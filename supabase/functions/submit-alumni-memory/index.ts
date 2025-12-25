import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// CORS headers for preflight requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * FAIL-OPEN Tag Memory System
 * Strategy: NEVER reject valid memories. If no confident theme detected,
 * accept with fallback tag and flag for manual review.
 */
interface TaggingResult {
  tags: string[];
  topTag: string;
  scores: Record<string, number>;
  confidence: number;
  needsReview: boolean;
}

// Pre-computed taxonomy for fast keyword matching
const TAXONOMY = [
  {
    id: "nostalgia",
    keywords: [
      // Core nostalgia terms
      "nostalgia", "nostalgic", "remember", "recall", "relive", "miss", "memories", "memory",
      // Time phrases
      "school days", "those days", "good time", "great time", "best time", "best days",
      "golden period", "golden years", "golden days", "best years", "good old days",
      // Single tokens that indicate nostalgia
      "days", "period", "time", "years", "moments", "childhood", "youth",
    ],
    phrases: [
      "school days", "those days", "good time", "great time", "best time", "best days",
      "golden period", "golden years", "miss school", "best years", "good old days",
    ],
  },
  {
    id: "friendship",
    keywords: ["friend", "friends", "companion", "pal", "buddy", "gang", "group", "bond", "together", "close"],
    phrases: ["close friends", "best friends", "school friends", "bus gang"],
  },
  {
    id: "teachers",
    keywords: ["teacher", "teachers", "ma'am", "sir", "maam", "madam", "principal", "class teacher", "mentor", "guide"],
    phrases: ["english ma'am", "class teacher", "favorite teacher"],
  },
  {
    id: "sports_athletics",
    keywords: ["sport", "sports", "game", "games", "team", "match", "football", "cricket", "athletics", "tournament", "sports day"],
    phrases: ["sports day", "annual sports", "football match"],
  },
  {
    id: "academic_excellence",
    keywords: ["study", "studies", "exam", "exams", "teacher", "class", "learn", "learning", "education", "academic", "knowledge"],
    phrases: ["exam time", "class room", "study hours"],
  },
  {
    id: "cultural_events",
    keywords: ["fest", "festival", "performance", "dance", "drama", "music", "concert", "annual day", "cultural"],
    phrases: ["annual day", "cultural fest", "annual function"],
  },
  {
    id: "spiritual_growth",
    keywords: ["prayer", "prayers", "mass", "chapel", "church", "faith", "god", "spiritual", "blessing"],
    phrases: ["morning prayer", "chapel service"],
  },
  {
    id: "house_rivalry",
    keywords: ["house", "houses", "competition", "rivalry", "red house", "blue house", "green house", "yellow house", "inter-house"],
    phrases: ["house competition", "inter-house", "house points"],
  },
  {
    id: "bus_memories",
    keywords: ["bus", "buses", "transport", "journey", "travel", "route"],
    phrases: ["bus ride", "bus gang", "school bus"],
  },
];

function tagMemory(messageText: string): TaggingResult {
  try {
    console.log("=== TAGGING DEBUG ===");
    console.log("Input text:", messageText);
    console.log("Input length:", messageText?.length || 0);
    
    const normalized = (messageText || "").toLowerCase().trim();
    const words = normalized.split(/\s+/).filter(w => w.length > 0);
    const tokenCount = words.length;
    
    console.log("Token count:", tokenCount);
    
    const tags: string[] = [];
    const scores: Record<string, number> = {};
  
  // Dynamic minScore based on text length (shorter text = lower threshold)
  const dynamicMinScore = tokenCount < 20 ? 1 : tokenCount < 40 ? 2 : 3;
  console.log("Dynamic minScore:", dynamicMinScore);
  
  // Check phrases first (higher weight)
  for (const category of TAXONOMY) {
    let phraseMatches = 0;
    if (category.phrases) {
      for (const phrase of category.phrases) {
        if (normalized.includes(phrase)) {
          phraseMatches++;
          console.log(`  ✓ Phrase match "${phrase}" in ${category.id}`);
        }
      }
    }
    
    // Check individual keywords
    let keywordMatches = 0;
    for (const keyword of category.keywords) {
      if (words.includes(keyword) || normalized.includes(keyword)) {
        keywordMatches++;
      }
    }
    
    // Calculate score: phrases worth 2 points, keywords worth 1 point
    const rawScore = (phraseMatches * 2) + keywordMatches;
    
    if (rawScore > 0) {
      // Normalize score to 1-5 range
      const normalizedScore = Math.min(5, Math.max(1, rawScore + 1));
      tags.push(category.id);
      scores[category.id] = normalizedScore;
      console.log(`  ${category.id}: score=${normalizedScore} (phrases=${phraseMatches}, keywords=${keywordMatches})`);
    }
  }
  
  // Determine top tag
  let topTag = "";
  let topScore = 0;
  for (const [tag, score] of Object.entries(scores)) {
    if (score > topScore) {
      topScore = score;
      topTag = tag;
    }
  }
  
  // FAIL-OPEN: If no theme detected, use fallback
  let needsReview = false;
  if (!topTag || tags.length === 0) {
    console.log("  ⚠️  No confident theme detected, using fallback");
    topTag = "general_memory";
    tags.push("general_memory");
    scores["general_memory"] = 1;
    needsReview = true;
  }
  
  // Calculate confidence: higher score + more tokens = higher confidence
  const confidence = topScore / (tokenCount + 3);
  console.log(`Confidence: ${confidence.toFixed(3)} (topScore=${topScore}, tokens=${tokenCount})`);
  
  // Flag low confidence submissions for review
  if (confidence < 0.15 && !needsReview) {
    needsReview = true;
    console.log("  ⚠️  Low confidence, flagging for review");
  }
  
  console.log("=== RESULT ===");
  console.log("Top tag:", topTag);
  console.log("All tags:", tags);
  console.log("Needs review:", needsReview);
  console.log("==================");
  
  return { tags, topTag, scores, confidence, needsReview };
  } catch (error) {
    console.error("tagMemory crashed:", error);
    // Return safe fallback
    return {
      tags: ["general_memory"],
      topTag: "general_memory",
      scores: { general_memory: 1 },
      confidence: 0,
      needsReview: true,
    };
  }
}

/**
 * Quality Gate: REMOVED - We now fail-open and accept all submissions
 * Flag low-confidence submissions for manual review instead of rejecting
 */
function validateQualityGate(tagging: TaggingResult): string | null {
  // ALWAYS return null (passed) - we never reject based on tagging
  // Low confidence submissions are flagged with needsReview=true
  return null;
}

/**
 * Upload audio file to Supabase Storage
 */
async function uploadAudio(
  supabase: any,
  submissionId: string,
  audioBuffer: Uint8Array
): Promise<string> {
  const audioPath = `audio/${submissionId}.webm`;
  
  const { data, error } = await supabase.storage
    .from("alumni-audio")
    .upload(audioPath, audioBuffer, {
      contentType: "audio/webm",
      upsert: false,
    });
  
  if (error) {
    throw new Error(`Audio upload failed: ${error.message}`);
  }
  
  return audioPath;
}

/**
 * Upload video file to Supabase Storage
 */
async function uploadVideo(
  supabase: any,
  submissionId: string,
  videoBuffer: Uint8Array,
  mimeType: string
): Promise<string> {
  const ext = mimeType.split("/")[1] || "mp4";
  const videoPath = `videos/${submissionId}.${ext}`;
  
  const { data, error } = await supabase.storage
    .from("alumni-videos")
    .upload(videoPath, videoBuffer, {
      contentType: mimeType,
      upsert: false,
    });
  
  if (error) {
    throw new Error(`Video upload failed: ${error.message}`);
  }
  
  return videoPath;
}

/**
 * Rollback: Delete all uploaded files
 * Called when database insert fails or validation errors occur
 */
async function rollbackUploads(
  supabase: any,
  audioPath: string | null,
  videoPath: string | null
): Promise<void> {
  const pathsToDelete: string[] = [];
  
  if (audioPath) {
    pathsToDelete.push(audioPath);
  }
  
  if (videoPath) {
    pathsToDelete.push(videoPath);
  }
  
  if (pathsToDelete.length === 0) return;
  
  // Delete from audio bucket
  if (audioPath) {
    await supabase.storage.from("alumni-audio").remove([audioPath]);
  }
  
  // Delete from video bucket
  if (videoPath) {
    await supabase.storage.from("alumni-videos").remove([videoPath]);
  }
  
  console.log(`Rolled back ${pathsToDelete.length} uploaded files`);
}

/**
 * Parse multipart form data
 */
async function parseFormData(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") || "";
  
  if (!contentType.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }
  
  return await request.formData();
}

/**
 * Main Edge Function Handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error",
          details: "Missing required environment variables"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse incoming request
    const formData = await parseFormData(req);
    
    // Extract submission ID
    const submissionId = formData.get("submissionId") as string;
    if (!submissionId) {
      return new Response(
        JSON.stringify({ error: "submissionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract form fields
    const formDataJson = formData.get("formData") as string;
    if (!formDataJson) {
      return new Response(
        JSON.stringify({ error: "formData is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const parsedFormData = JSON.parse(formDataJson);
    const messageText = formData.get("messageText") as string;
    
    // STEP 1: QUALITY GATE - Tag and validate BEFORE any uploads
    console.log("STEP 1: Tagging memory content...");
    let tagging;
    try {
      tagging = tagMemory(messageText || "");
    } catch (tagError) {
      console.error("Tagging failed:", tagError);
      // Fail-open: if tagging crashes, accept with fallback tag
      tagging = {
        tags: ["general_memory"],
        topTag: "general_memory",
        scores: { general_memory: 1 },
        confidence: 0,
        needsReview: true,
      };
    }
    
    const rejectionReason = validateQualityGate(tagging);
    if (rejectionReason) {
      console.log(`REJECTED: ${rejectionReason}`);
      return new Response(
        JSON.stringify({
          status: "rejected",
          reason: rejectionReason,
          tags: tagging.tags,
          topTag: tagging.topTag,
          scores: tagging.scores,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`PASSED quality gate. Top tag: ${tagging.topTag} (score: ${tagging.scores[tagging.topTag]})`);
    
    // STEP 2: Upload media files (only after passing quality gate)
    let audioPath: string | null = null;
    let videoPath: string | null = null;
    
    try {
      // Upload audio if present
      const audioFile = formData.get("audioFile") as File | null;
      if (audioFile) {
        console.log("STEP 2a: Uploading audio file...");
        const audioBuffer = new Uint8Array(await audioFile.arrayBuffer());
        audioPath = await uploadAudio(supabase, submissionId, audioBuffer);
        console.log(`Audio uploaded: ${audioPath}`);
      }
      
      // Upload video if present
      const videoFile = formData.get("videoFile") as File | null;
      if (videoFile) {
        console.log("STEP 2b: Uploading video file...");
        const videoBuffer = new Uint8Array(await videoFile.arrayBuffer());
        videoPath = await uploadVideo(supabase, submissionId, videoBuffer, videoFile.type);
        console.log(`Video uploaded: ${videoPath}`);
      }
      
      // STEP 3: Insert database record
      console.log("STEP 3: Inserting database record...");
      const { data, error } = await supabase
        .from("alumni_submissions")
        .insert({
          id: submissionId,
          full_name: parsedFormData.fullName,
          institution: parsedFormData.institution,
          batch_year: parseInt(parsedFormData.batchYear),
          roll_number: parsedFormData.rollNumber,
          date_of_birth: parsedFormData.dateOfBirth,
          email: parsedFormData.email,
          phone: parsedFormData.phone || null,
          message_text: messageText,
          audio_path: audioPath,
          video_path: videoPath,
          consent_given: parsedFormData.consentGiven,
          tags: tagging.tags,
          top_tag: tagging.topTag,
          tag_scores: tagging.scores,
          rejected: false,
          review_status: tagging.needsReview ? "flagged" : "pending",
        });
      
      if (error) {
        console.error("Database insert failed:", error);
        throw new Error(`Database insert failed: ${error.message}`);
      }
      
      console.log("SUCCESS: Submission created");
      
      return new Response(
        JSON.stringify({
          status: "accepted",
          submissionId,
          tags: tagging.tags,
          topTag: tagging.topTag,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (uploadError) {
      // CRITICAL: Rollback all uploads on any failure
      console.error("Upload or insert failed, rolling back...", uploadError);
      await rollbackUploads(supabase, audioPath, videoPath);
      
      return new Response(
        JSON.stringify({
          error: "Submission failed",
          details: uploadError instanceof Error ? uploadError.message : "Unknown error",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
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
