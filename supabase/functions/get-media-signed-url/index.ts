import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: Generate signed URLs for private media access
 * 
 * Purpose:
 * - Admins need to view/download audio and images from submissions
 * - Media is stored in PRIVATE buckets (not publicly accessible)
 * - This function generates time-limited signed URLs
 * 
 * Security:
 * - Requires authenticated admin user
 * - URLs expire after 10 minutes (600 seconds)
 * - No direct storage access from client
 * 
 * Usage:
 * POST /get-media-signed-url
 * Body: {
 *   "paths": ["audio/uuid.webm", "images/uuid/0.jpg"],
 *   "expiresIn": 600  // optional, defaults to 600
 * }
 * 
 * Response: {
 *   "signedUrls": {
 *     "audio/uuid.webm": "https://...",
 *     "images/uuid/0.jpg": "https://..."
 *   }
 * }
 */

interface SignedUrlRequest {
  paths: string[];
  expiresIn?: number; // seconds, default 600 (10 minutes)
}

/**
 * Verify that the request comes from an authenticated admin
 */
async function verifyAdmin(supabase: any, authHeader: string | null): Promise<boolean> {
  if (!authHeader) {
    return false;
  }
  
  const token = authHeader.replace(/^bearer\s+/i, "");
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return false;
  }
  
  // Check if user exists in admin_profiles table
  const { data: adminProfile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", user.id)
    .single();
  
  return !profileError && !!adminProfile;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify admin authentication
    const authHeader = req.headers.get("Authorization");
    const isAdmin = await verifyAdmin(supabase, authHeader);
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body
    const body: SignedUrlRequest = await req.json();
    
    if (!body.paths || !Array.isArray(body.paths) || body.paths.length === 0) {
      return new Response(
        JSON.stringify({ error: "paths array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const expiresIn = body.expiresIn || 600; // Default 10 minutes
    
    if (expiresIn < 60 || expiresIn > 3600) {
      return new Response(
        JSON.stringify({ error: "expiresIn must be between 60 and 3600 seconds" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Generate signed URLs for each path
    const signedUrls: Record<string, string> = {};
    const errors: Record<string, string> = {};
    
    for (const path of body.paths) {
      try {
        // Determine bucket from path
        let bucket: string;
        if (path.startsWith("audio/")) {
          bucket = "alumni-audio";
        } else if (path.startsWith("videos/")) {
          bucket = "alumni-videos";
        } else if (path.startsWith("images/")) {
          bucket = "alumni-images";
        } else {
          errors[path] = "Invalid path: must start with 'audio/', 'videos/', or 'images/'";
          continue;
        }
        
        // Generate signed URL
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);
        
        if (error || !data) {
          errors[path] = error?.message || "Failed to generate signed URL";
          continue;
        }
        
        signedUrls[path] = data.signedUrl;
        
      } catch (err) {
        errors[path] = err instanceof Error ? err.message : "Unknown error";
      }
    }
    
    // Return results
    const response: any = { signedUrls };
    
    if (Object.keys(errors).length > 0) {
      response.errors = errors;
    }
    
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
