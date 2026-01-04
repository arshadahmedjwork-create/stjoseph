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

    const { submissionId, accessToken } = body;

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

    try {
        // 1. Verify the requester is an authenticated user
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

        // 2. Initialize Admin Client to check role
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

        const { data: adminProfile, error: profileError } = await supabaseAdmin
            .from('admin_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Allow 'admin' and 'super_admin' to delete submissions
        if (profileError || !adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Only Admins can delete submissions' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (!submissionId) {
            return new Response(
                JSON.stringify({ error: 'Missing submissionId' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Delete the submission
        const { error: deleteError } = await supabaseAdmin
            .from('alumni_submissions')
            .delete()
            .eq('id', submissionId)

        if (deleteError) {
            throw deleteError
        }

        return new Response(
            JSON.stringify({ message: 'Submission deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
