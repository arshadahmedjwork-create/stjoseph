import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-auth',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    // Parse request body first
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return new Response(
            JSON.stringify({ error: "Invalid request body" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const { userId, newRole, accessToken } = body;

    try {
        // Get authorization token (Header > X-Header > Body)
        let token = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
            req.headers.get("X-Supabase-Auth")?.replace(/^Bearer\s+/i, "") ||
            accessToken;

        if (!token) {
            return new Response(
                JSON.stringify({ error: "Missing authorization token" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // 1. Verify the requester is a Super Admin using access token
        const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false }
        });

        const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid authorization token', details: authError?.message }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Initialize Admin Client to check role and update
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: adminProfile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !adminProfile || adminProfile.role !== 'super_admin') {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Only Super Admins can update roles' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!userId || !newRole) {
            return new Response(
                JSON.stringify({ error: 'Missing userId or newRole' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate role
        const validRoles = ['admin', 'super_admin', 'reviewer'];
        if (!validRoles.includes(newRole)) {
            return new Response(
                JSON.stringify({ error: 'Invalid role' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Prevent changing own role
        if (userId === user.id) {
            return new Response(
                JSON.stringify({ error: 'Cannot change your own role' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Update the role
        const { error: updateError } = await supabaseAdmin
            .from('admin_profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (updateError) throw updateError;

        return new Response(
            JSON.stringify({ message: 'Role updated successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
