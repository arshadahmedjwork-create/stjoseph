import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { JSZip } from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Export Single Submission as ZIP
 * 
 * Structure:
 * {rollNumber}_{fullName}.zip
 * ├── message.txt
 * ├── audio.webm (if exists)
 * ├── video.mp4 (if exists)
 * └── details.json
 * 
 * SECURITY:
 * - Only admins can export
 * - Uses service role to access private storage
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
    
    const jwt = authHeader.replace(/^bearer\s+/i, "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Check admin status
    const { data: adminProfile } = await supabaseAdmin
      .from("admin_profiles")
      .select("id")
      .eq("id", user.id)
      .single();
    
    if (!adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get submission ID from query params
    const url = new URL(req.url);
    const submissionId = url.searchParams.get("id");
    
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
    
    // Create ZIP
    const zip = new JSZip();
    
    // Add message.txt
    if (submission.message_text) {
      zip.file("message.txt", submission.message_text);
    }
    
    // Add details.json with submission metadata
    const details = {
      fullName: submission.full_name,
      rollNumber: submission.roll_number,
      institution: submission.institution,
      batchYear: submission.batch_year,
      email: submission.email,
      phone: submission.phone,
      submittedAt: submission.created_at,
      reviewStatus: submission.review_status,
      tags: submission.tags,
      topTag: submission.top_tag,
      adminNotes: submission.admin_notes,
    };
    zip.file("details.json", JSON.stringify(details, null, 2));
    
    // Add audio file if exists
    if (submission.audio_path) {
      try {
        const { data: audioData, error: audioError } = await supabaseAdmin.storage
          .from("alumni-audio")
          .download(submission.audio_path);
        
        if (audioData) {
          const arrayBuffer = await audioData.arrayBuffer();
          const extension = submission.audio_path.split('.').pop() || 'webm';
          zip.file(`audio.${extension}`, arrayBuffer);
        }
      } catch (err) {
        console.error("Failed to download audio:", err);
      }
    }
    
    // Add video file if exists
    if (submission.video_path) {
      try {
        const { data: videoData, error: videoError } = await supabaseAdmin.storage
          .from("alumni-videos")
          .download(submission.video_path);
        
        if (videoData) {
          const arrayBuffer = await videoData.arrayBuffer();
          const extension = submission.video_path.split('.').pop() || 'mp4';
          zip.file(`video.${extension}`, arrayBuffer);
        }
      } catch (err) {
        console.error("Failed to download video:", err);
      }
    }
    
    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: "uint8array" });
    
    // Create filename: RollNumber_FullName.zip (sanitized)
    const sanitize = (str: string) => str.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitize(submission.roll_number)}_${sanitize(submission.full_name)}.zip`;
    
    return new Response(zipBlob, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
    
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
