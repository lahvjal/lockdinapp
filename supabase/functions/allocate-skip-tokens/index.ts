// Monthly Skip Token Allocation Edge Function
// Runs on a cron schedule (1st of each month) to allocate tokens

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const MONTHLY_TOKENS = 3; // Each user gets 3 skip tokens per month

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all active users
    const { data: users, error: usersError } = await supabaseClient
      .from('user_profiles')
      .select('id');

    if (usersError) throw usersError;

    const results = [];

    for (const user of users || []) {
      const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format

      // Check if tokens already allocated for this month
      const { data: existing } = await supabaseClient
        .from('skip_tokens')
        .select('id')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      if (!existing) {
        // Allocate new tokens for the month
        const { error: insertError } = await supabaseClient
          .from('skip_tokens')
          .insert({
            user_id: user.id,
            month: currentMonth,
            total_tokens: MONTHLY_TOKENS,
            used_tokens: 0,
            remaining_tokens: MONTHLY_TOKENS,
          });

        if (insertError) {
          console.error(`Error allocating tokens for user ${user.id}:`, insertError);
        } else {
          results.push({ user_id: user.id, allocated: MONTHLY_TOKENS });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        allocated_count: results.length,
        details: results,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
