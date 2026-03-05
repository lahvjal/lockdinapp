// Plan Lifecycle Management Edge Function
// Runs on a cron schedule to check for:
// - Expired fixed-duration plans
// - Upcoming check-ins
// - Send notifications

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    const results = {
      expired_plans: [],
      upcoming_checkins: [],
      notifications_sent: 0,
    };

    // Check for expired fixed-duration plans
    const { data: fixedPlans, error: fixedError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .not('data->>duration_mode', 'is', null)
      .filter('data->>duration_mode', 'eq', 'fixed');

    if (fixedError) throw fixedError;

    for (const plan of fixedPlans || []) {
      const endDate = plan.data?.end_date;
      if (endDate && endDate <= today) {
        // Mark plan as expired
        const { error: updateError } = await supabaseClient
          .from('plans')
          .update({
            data: {
              ...plan.data,
              expired_at: new Date().toISOString(),
              completion_status: 'expired',
            },
          })
          .eq('id', plan.id);

        if (!updateError) {
          results.expired_plans.push(plan.id);
          // TODO: Send notification to user
          results.notifications_sent++;
        }
      }
    }

    // Check for upcoming check-ins (within next 2 days)
    const { data: checkInPlans, error: checkInError } = await supabaseClient
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .not('data->>duration_mode', 'is', null)
      .filter('data->>duration_mode', 'eq', 'check_in');

    if (checkInError) throw checkInError;

    for (const plan of checkInPlans || []) {
      const intervalDays = plan.data?.check_in_interval_days || 7;
      const lastCheckIn = plan.data?.last_check_in_date 
        ? new Date(plan.data.last_check_in_date)
        : new Date(plan.created_at);

      const nextCheckIn = new Date(lastCheckIn);
      nextCheckIn.setDate(nextCheckIn.getDate() + intervalDays);

      const daysUntilCheckIn = Math.floor(
        (nextCheckIn.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilCheckIn <= 2 && daysUntilCheckIn >= 0) {
        results.upcoming_checkins.push({
          plan_id: plan.id,
          days_until: daysUntilCheckIn,
        });
        // TODO: Send notification reminder
        results.notifications_sent++;
      }

      // Auto-archive if check-in is overdue by 7 days
      if (daysUntilCheckIn < -7) {
        await supabaseClient
          .from('plans')
          .update({
            is_active: false,
            data: {
              ...plan.data,
              archived_at: new Date().toISOString(),
              completion_status: 'abandoned',
            },
          })
          .eq('id', plan.id);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
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
