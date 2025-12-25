import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { JSZip } from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check admin profile
    const { data: adminProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    
    if (!adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body (optional filters)
    const { submissionIds, filters } = await req.json().catch(() => ({ submissionIds: null, filters: {} }));
    
    console.log("Exporting submissions for admin:", user.email);
    
    // Fetch submissions
    let query = supabaseAdmin
      .from("alumni_submissions")
      .select("*")
      .order("created_at", { ascending: false });
    
    // Apply filters
    if (submissionIds && Array.isArray(submissionIds)) {
      query = query.in("id", submissionIds);
    } else {
      if (filters.institution) query = query.eq("institution", filters.institution);
      if (filters.batch_year) query = query.eq("batch_year", filters.batch_year);
      if (filters.review_status) query = query.eq("review_status", filters.review_status);
      if (filters.top_tag) query = query.eq("top_tag", filters.top_tag);
    }
    
    const { data: submissions, error: fetchError } = await query;
    
    if (fetchError) {
      console.error("Failed to fetch submissions:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch submissions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!submissions || submissions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No submissions found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Exporting ${submissions.length} submissions`);
    
    // Create ZIP
    const zip = new JSZip();
    
    // Generate CSV
    const csvHeaders = [
      "ID", "Created At", "Full Name", "Institution", "Batch Year", "Roll Number",
      "Date of Birth", "Email", "Phone", "Message Text", "Top Tag", "Tags",
      "Review Status", "Admin Notes", "Rejected", "Has Audio", "Has Video"
    ];
    
    const csvRows = submissions.map(sub => [
      sub.id,
      sub.created_at,
      sub.full_name,
      sub.institution,
      sub.batch_year,
      sub.roll_number,
      sub.date_of_birth,
      sub.email,
      sub.phone || "",
      (sub.message_text || "").replace(/"/g, '""'), // Escape quotes
      sub.top_tag || "",
      (sub.tags || []).join("; "),
      sub.review_status,
      (sub.admin_notes || "").replace(/"/g, '""'),
      sub.rejected ? "Yes" : "No",
      sub.audio_path ? "Yes" : "No",
      sub.video_path ? "Yes" : "No",
    ]);
    
    const csvContent = [
      csvHeaders.map(h => `"${h}"`).join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    zip.file("submissions.csv", csvContent);
    
    // Process each submission
    for (const submission of submissions) {
      const folder = `submission-${submission.id}`;
      
      // Add message.txt
      if (submission.message_text) {
        zip.file(`${folder}/message.txt`, submission.message_text);
      }
      
      // Download and add audio
      if (submission.audio_path) {
        try {
          const { data: audioBlob } = await supabaseAdmin.storage
            .from("alumni-audio")
            .download(submission.audio_path);
          
          if (audioBlob) {
            const audioBuffer = await audioBlob.arrayBuffer();
            zip.file(`${folder}/audio.webm`, audioBuffer);
          }
        } catch (err) {
          console.error(`Failed to download audio for ${submission.id}:`, err);
        }
      }
      
      // Download and add video
      if (submission.video_path) {
        try {
          const { data: videoBlob } = await supabaseAdmin.storage
            .from("alumni-videos")
            .download(submission.video_path);
          
          if (videoBlob) {
            const videoBuffer = await videoBlob.arrayBuffer();
            const ext = submission.video_path.split('.').pop() || 'mp4';
            zip.file(`${folder}/video.${ext}`, videoBuffer);
          }
        } catch (err) {
          console.error(`Failed to download video for ${submission.id}:`, err);
        }
      }
    }
    
    // Generate ZIP file
    const zipBlob = await zip.generateAsync({ 
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    
    console.log(`Generated ZIP: ${zipBlob.length} bytes`);
    
    // Return ZIP
    return new Response(zipBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="alumni-submissions-${new Date().toISOString().split('T')[0]}.zip"`,
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
