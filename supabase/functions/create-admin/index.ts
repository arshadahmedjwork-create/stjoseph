import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-auth",
};

/**
 * Generate strong temporary password
 */
function generateStrongPassword(): string {
  const length = 16;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  // Ensure at least one of each type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}



/**
 * Create Admin Edge Function
 * 
 * SECURITY:
 * - Only existing admins can create new admins
 * - Generates temporary password
 * - Sends credentials via EmailJS
 * - Sets first_login = true
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // EmailJS Credentials
    const emailJsServiceId = Deno.env.get("EMAILJS_SERVICE_ID");
    const emailJsTemplateId = Deno.env.get("EMAILJS_TEMPLATE_ID");
    const emailJsPublicKey = Deno.env.get("EMAILJS_PUBLIC_KEY");
    const emailJsPrivateKey = Deno.env.get("EMAILJS_PRIVATE_KEY");

    // Check required env vars
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey || !emailJsServiceId || !emailJsTemplateId || !emailJsPublicKey || !emailJsPrivateKey) {
      const missing = [];
      if (!supabaseUrl) missing.push("SUPABASE_URL");
      if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
      if (!supabaseAnonKey) missing.push("SUPABASE_ANON_KEY");
      if (!emailJsServiceId) missing.push("EMAILJS_SERVICE_ID");
      if (!emailJsTemplateId) missing.push("EMAILJS_TEMPLATE_ID");
      if (!emailJsPublicKey) missing.push("EMAILJS_PUBLIC_KEY");
      if (!emailJsPrivateKey) missing.push("EMAILJS_PRIVATE_KEY");

      console.error("Missing environment variables:", missing.join(", "));
      return new Response(
        JSON.stringify({ error: `Server configuration error - missing env vars: ${missing.join(", ")}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body first (to get token if needed)
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role, accessToken } = body;

    // Get authorization token (Header > Body)
    let token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
      req.headers.get("X-Supabase-Auth")?.replace(/^Bearer\s+/i, "") ||
      accessToken;

    if (!token) {
      console.error("Missing authorization token");
      return new Response(
        JSON.stringify({ error: "Missing authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Initialize User Client (Anon Key) with Token from Body
    // We use the Anon Key and pass the token in global headers to force a network verification 
    // against the Auth API. This bypasses local signature issues (ES256 vs HS256).
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        persistSession: false,
      }
    });

    // Validate user (fetches from Auth Server)
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({
          error: "Invalid authorization token",
          details: authError?.message,
          hint: "Token verification failed using Anon Key + Auth API"
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Initialize Admin Client (Service Key) for privileged actions
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is SUPER ADMIN
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.role !== 'super_admin') {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only Super Admins can create new admins" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate temporary password
    const tempPassword = generateStrongPassword();

    // Create Supabase auth user
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (createUserError) {
      if (createUserError.message?.includes('email_exists')) {
        return new Response(
          JSON.stringify({ error: "Email already exists" }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to create admin user", details: createUserError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into admin_profiles
    const { error: insertError } = await supabaseAdmin
      .from("admin_profiles")
      .insert({
        id: newUser.user.id,
        email,
        role: role || 'admin',
        first_login: true,
        created_by: user.id,
      });

    if (insertError) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create admin profile", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send Email via EmailJS
    try {
      const emailResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: emailJsServiceId,
          template_id: emailJsTemplateId,
          user_id: emailJsPublicKey,
          accessToken: emailJsPrivateKey,
          template_params: {
            to_email: email,
            admin_email: email,
            temporary_password: tempPassword,
            name: "New Admin",
          },
        }),
      });

      if (!emailResponse.ok) {
        throw new Error(await emailResponse.text());
      }

    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return new Response(
        JSON.stringify({
          warning: "Admin created but email failed",
          email,
          temporary_password: tempPassword,
          details: emailError instanceof Error ? emailError.message : String(emailError)
        }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin created and email sent" }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
