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

    const { userId, accessToken } = body;

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
        // Use Anon Client + Auth API verification to bypass Gateway signature check issues
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

        // 2. Initialize Admin Client to check role and perform deletion
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: adminProfile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !adminProfile || adminProfile.role !== 'super_admin') {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Only Super Admins can delete users' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'Missing userId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Prevent deleting self
        if (userId === user.id) {
            return new Response(
                JSON.stringify({ error: 'Cannot delete your own account' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Delete the user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            throw deleteError
        }

        // Explicitly delete from admin_profiles
        await supabaseAdmin
            .from('admin_profiles')
            .delete()
            .eq('id', userId)


        return new Response(
            JSON.stringify({ message: 'Admin deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
