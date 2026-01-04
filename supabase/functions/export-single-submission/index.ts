import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  // Handle CORS preflight FIRST - before anything else
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
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

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from Supabase's automatic JWT verification
    // Supabase Edge Functions automatically verify the JWT and provide the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's JWT to get their session
    const supabaseClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY") || "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: {
          persistSession: false,
        },
      }
    );

    // Extract token from Bearer string
    const token = authHeader.replace(/^Bearer\s+/i, "");

    // Get the authenticated user by passing the token explicitly
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid authorization", details: authError?.message || "User not found" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin status
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin check error:", adminError);
      return new Response(
        JSON.stringify({ error: "Admin verification failed", details: adminError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get submission ID
    const url = new URL(req.url);
    let submissionId = url.searchParams.get("id");

    if (!submissionId && req.method === "POST") {
      try {
        const body = await req.json();
        submissionId = body.id;
      } catch (e) {
        // Continue with null
      }
    }

    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch submission
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from("alumni_submissions")
      .select("*")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return new Response(
        JSON.stringify({ error: "Submission not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PREPARE ZIP
    const zip = new JSZip();

    // 1. Add JSON metadata
    const metadata = {
      id: submission.id,
      fullName: submission.full_name,
      rollNumber: submission.roll_number,
      institution: submission.institution,
      batchYear: submission.batch_year,
      email: submission.email,
      phone: submission.phone,
      message: submission.message_text,
      submittedAt: submission.created_at,
      reviewStatus: submission.review_status,
      tags: submission.tags,
      topTag: submission.top_tag,
      adminNotes: submission.admin_notes,
      audioPath: submission.audio_path,
      videoPath: submission.video_path,
    };

    zip.file("submission_details.json", JSON.stringify(metadata, null, 2));

    // 2. Download and Add Media Files
    const downloadFile = async (bucket: string, path: string, filename: string) => {
      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucket)
          .download(path);

        if (error) {
          console.error(`Failed to download ${path} from ${bucket}:`, error);
          zip.file(`errors/${filename}_error.txt`, `Failed to download: ${error.message}`);
          return;
        }

        if (data) {
          zip.file(filename, await data.arrayBuffer());
        }
      } catch (err) {
        console.error(`Error processing ${path}:`, err);
        zip.file(`errors/${filename}_error.txt`, `Error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    const promises = [];

    if (submission.audio_path) {
      const filename = submission.audio_path.split('/').pop() || 'audio_recording.webm';
      promises.push(downloadFile("alumni-audio", submission.audio_path, `media/${filename}`));
    }

    if (submission.video_path) {
      const filename = submission.video_path.split('/').pop() || 'video_recording.mp4';
      promises.push(downloadFile("alumni-videos", submission.video_path, `media/${filename}`));
    }

    // Wait for all downloads
    await Promise.all(promises);

    // 3. Generate ZIP
    const zipContent = await zip.generateAsync({ type: "uint8array" });

    // 4. Return Response
    const safeFilename = `${submission.roll_number}_${submission.full_name.replace(/[^a-z0-9]/gi, '_')}.zip`;

    return new Response(
      zipContent,
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
        },
      }
    );

  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to export submission",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
