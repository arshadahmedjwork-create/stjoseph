import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
 * Send admin credentials via Resend
 */
async function sendAdminCredentialsEmail(
  email: string,
  tempPassword: string
): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const emailFrom = Deno.env.get("EMAIL_FROM") || "onboarding@resend.dev";
  
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .credentials { background-color: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #4F46E5; border-radius: 4px; }
        .password { font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold; color: #DC2626; background-color: #FEF2F2; padding: 10px; border-radius: 4px; }
        .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; margin-top: 30px; color: #6B7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎓 St. Joseph Admin Access</h1>
        </div>
        <div class="content">
          <h2>Welcome to the Admin Portal</h2>
          <p>Your admin account has been created. Use the credentials below to access the admin portal.</p>
          
          <div class="credentials">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Temporary Password:</strong></p>
            <div class="password">${tempPassword}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Action Required:</strong> You must change this temporary password on your first login.
          </div>
          
          <p><strong>Login URL:</strong> <a href="https://yourapp.com/admin">Admin Portal</a></p>
          
          <p><strong>Security Tips:</strong></p>
          <ul>
            <li>Change your password immediately after first login</li>
            <li>Use a strong, unique password</li>
            <li>Never share your credentials</li>
            <li>Enable two-factor authentication if available</li>
          </ul>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} St. Joseph Alumni Portal</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: emailFrom,
      to: [email],
      subject: "Your Admin Access – Action Required",
      html: emailHtml,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Resend Error Response:", errorText);
    throw new Error(`Email delivery failed (${response.status}): ${errorText}`);
  }
  
  console.log("Email sent successfully via Resend");
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
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", { 
        supabaseUrl: !!supabaseUrl, 
        supabaseServiceKey: !!supabaseServiceKey
      });
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract JWT token (case-insensitive)
    const jwt = authHeader.replace(/^bearer\s+/i, "");
    
    console.log("JWT extracted, length:", jwt.length);
    
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // Validate user JWT explicitly by passing the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      console.error("Auth verification failed:", { 
        error: authError?.message,
        hasUser: !!user 
      });
      return new Response(
        JSON.stringify({ 
          error: "Invalid authorization token",
          details: authError?.message 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("User authenticated:", user.id);
    
    // Check if user is in admin_profiles
    const { data: adminProfile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();
    
    if (profileError || !adminProfile) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Not an admin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Parse request body
    const { email, role } = await req.json();
    
    if (!email || !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Admin ${user.email} creating new admin: ${email}`);
    
    // STEP 1: Generate temporary password
    const tempPassword = generateStrongPassword();
    console.log("Generated temporary password");
    
    // STEP 2: Create Supabase auth user
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
    });
    
    if (createUserError) {
      console.error("Failed to create auth user:", createUserError);
      
      // Check for duplicate email
      if (createUserError.message?.includes('email_exists') || createUserError.message?.includes('User already registered')) {
        return new Response(
          JSON.stringify({ 
            error: "Email already exists",
            details: "User already registered. Use a different email or delete the existing user first."
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create admin user",
          details: createUserError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Created auth user: ${newUser.user.id}`);
    
    // STEP 3: Insert into admin_profiles
    const { error: insertError } = await supabase
      .from("admin_profiles")
      .insert({
        id: newUser.user.id,
        email,
        role: role || 'admin',
        first_login: true,
        created_by: user.id,
      });
    
    if (insertError) {
      console.error("Failed to insert admin profile:", insertError);
      
      // Rollback: Delete auth user
      await supabase.auth.admin.deleteUser(newUser.user.id);
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create admin profile",
          details: insertError.message
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Created admin profile");
    
    // STEP 4: Send credentials via email
    try {
      await sendAdminCredentialsEmail(email, tempPassword);
      console.log("Sent credentials email");
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      
      // DO NOT rollback - admin is created, just email failed
      // Return temp password so creator can manually share it
      return new Response(
        JSON.stringify({ 
          warning: "Admin created but email delivery failed",
          email,
          temporary_password: tempPassword,
          message: "Email delivery requires domain verification in Resend. Please manually share these credentials with the admin.",
          instructions: "The admin must change their password on first login."
        }),
        { status: 207, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // SUCCESS
    return new Response(
      JSON.stringify({ 
        success: true,
        email,
        message: "Admin created successfully. Credentials sent via email."
      }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
