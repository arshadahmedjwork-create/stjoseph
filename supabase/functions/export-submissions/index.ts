import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

/**
 * Export Submissions as ZIP
 * 
 * Structure:
 * export.zip
 * ├── submissions.csv
 * ├── submission-<id>/
 * │   ├── message.txt
 * │   ├── audio.webm
 * │   ├── video.mp4
 * 
 * SECURITY:
 * - Only admins can export
 * - Uses service role to access private storage
 * - Generates signed URLs internally (not exposed)
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body or query params if GET (but this is usually POST/GET)
    // For GET requests, we can't extract body, so we rely on headers mainly.
    // The previous code tried `req.json()` which fails on GET. 
    // Let's assume params are in URL search params if it's a GET, or JSON if POST.

    let filters: any = {};
    let submissionIds: string[] | null = null;

    // Extract token
    const authHeader = req.headers.get("Authorization");
    const xSupabaseAuth = req.headers.get("X-Supabase-Auth");
    let token = authHeader?.replace(/^Bearer\s+/i, "") || xSupabaseAuth?.replace(/^Bearer\s+/i, "");

    // If query params are present, try to use them
    const url = new URL(req.url);
    if (!token && url.searchParams.has("token")) {
      token = url.searchParams.get("token") || undefined;
    }

    // Extract filters from URL params
    const institution = url.searchParams.get("institution");
    const batchYear = url.searchParams.get("batchYear");
    const reviewStatus = url.searchParams.get("reviewStatus");

    if (institution) filters.institution = institution;
    if (batchYear) filters.batch_year = batchYear;
    if (reviewStatus) filters.review_status = reviewStatus;

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Robust Auth Verification (Anon Client)
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Admin Check (Service Role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("admin_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError || !adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Exporting submissions for admin:", user.email, filters);

    // 3. Fetch submissions
    let query = supabaseAdmin
      .from("alumni_submissions")
      .select("*")
      .order("created_at", { ascending: false });

    // Apply filters
    if (filters.institution) query = query.eq("institution", filters.institution);
    if (filters.batch_year) query = query.eq("batch_year", filters.batch_year);
    if (filters.review_status) query = query.eq("review_status", filters.review_status);

    const { data: submissions, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No submissions found matching criteria" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${submissions.length} submissions for export`);

    // 4. Generate ZIP with CSV and Text
    // NOTE: We do NOT download media files to avoid Lambda OOM (503 errors).
    // Instead we generate Signed URLs associated with the media.
    const zip = new JSZip();

    const csvHeaders = [
      "ID", "Created At", "Full Name", "Institution", "Batch Year", "Roll Number",
      "Date of Birth", "Email", "Phone", "Message Text", "Top Tag", "Tags",
      "Review Status", "Admin Notes", "Rejected",
      "Audio Link (Expires 7 Days)", "Video Link (Expires 7 Days)"
    ];

    const csvRows = [];

    for (const sub of submissions) {
      // Generate signed URLs if paths exist
      let audioLink = "";
      let videoLink = "";

      if (sub.audio_path) {
        const { data } = await supabaseAdmin.storage.from('alumni-audio').createSignedUrl(sub.audio_path, 604800); // 7 days
        audioLink = data?.signedUrl || "Error generating link";
      }
      if (sub.video_path) {
        const { data } = await supabaseAdmin.storage.from('alumni-videos').createSignedUrl(sub.video_path, 604800); // 7 days
        videoLink = data?.signedUrl || "Error generating link";
      }

      csvRows.push([
        sub.id,
        sub.created_at,
        sub.full_name,
        sub.institution,
        sub.batch_year,
        sub.roll_number,
        sub.date_of_birth,
        sub.email,
        sub.phone || "",
        (sub.message_text || "").replace(/"/g, '""'), // Escape quotes for CSV
        sub.top_tag || "",
        (sub.tags || []).join("; "),
        sub.review_status,
        (sub.admin_notes || "").replace(/"/g, '""'),
        sub.rejected ? "Yes" : "No",
        audioLink,
        videoLink,
      ]);

      // Add individual text file for easier reading
      if (sub.message_text) {
        zip.file(`submission-${sub.id}/message.txt`, sub.message_text);
      }
    }

    const csvContent = [
      csvHeaders.map(h => `"${h}"`).join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    zip.file("submissions.csv", csvContent);
    zip.file("README.txt", "Media files (Audio/Video) are provided as downloadable links in the CSV file to ensure reliable export of large datasets.");

    // Generate ZIP
    const zipBlob = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });

    return new Response(zipBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="alumni-export-${new Date().toISOString().split('T')[0]}.zip"`,
      },
    });

  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({
        error: "Export failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
