// Streak Calculation Edge Function
// This function calculates and updates streaks for all categories

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const REQUIRED_COMPLETION = {
  workout: 'completed_workout',
  meals: 'logged_minimum_meals', // e.g., 70% of meal slots
  water: 'reached_daily_target',
  sleep: 'logged_sleep',
};

interface DayLog {
  date: string;
  workout_completed: boolean;
  meals_percentage: number;
  water_percentage: number;
  sleep_logged: boolean;
}

Deno.serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, category } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get last 30 days of logs
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // Calculate streaks for specific category or all categories
    const categories = category ? [category] : ['workout', 'meals', 'water', 'sleep'];
    const results: any = {};

    for (const cat of categories) {
      const streakData = await calculateCategoryStreak(supabaseClient, userId, cat, thirtyDaysAgo, today);
      results[cat] = streakData;

      // Update or insert streak record
      await supabaseClient
        .from('streaks')
        .upsert({
          user_id: userId,
          category: cat,
          current_streak: streakData.current_streak,
          longest_streak: streakData.longest_streak,
          last_completed_date: streakData.last_completed_date,
        }, {
          onConflict: 'user_id,category',
        });
    }

    return new Response(JSON.stringify({ success: true, streaks: results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function calculateCategoryStreak(
  client: any,
  userId: string,
  category: string,
  startDate: Date,
  endDate: Date
) {
  const dayLogs: Record<string, boolean> = {};

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Get skip token usage for this category
  const { data: skipTokenUsage } = await client
    .from('skip_token_usage')
    .select('date, skip_tokens!inner(user_id)')
    .eq('skip_tokens.user_id', userId)
    .eq('category', category)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  // Mark skip token days as completed
  skipTokenUsage?.forEach((usage: any) => {
    dayLogs[usage.date] = true;
  });

  switch (category) {
    case 'workout': {
      const { data } = await client
        .from('workout_logs')
        .select('date, status')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      data?.forEach((log: any) => {
        if (log.status === 'completed') {
          dayLogs[log.date] = true;
        }
      });
      break;
    }

    case 'meals': {
      // Get meal slots count
      const { data: planData } = await client
        .from('plans')
        .select('id')
        .eq('user_id', userId)
        .eq('category', 'meals')
        .eq('is_active', true)
        .single();

      if (planData) {
        const { data: slotsData } = await client
          .from('meal_slots')
          .select('id')
          .eq('plan_id', planData.id);

        const totalSlots = slotsData?.length || 3;
        const requiredSlots = Math.ceil(totalSlots * 0.7); // 70% threshold

        // Get logs grouped by date
        const { data: logsData } = await client
          .from('meal_logs')
          .select('logged_at')
          .eq('user_id', userId)
          .gte('logged_at', `${startDateStr}T00:00:00`)
          .lte('logged_at', `${endDateStr}T23:59:59`);

        const logsByDate: Record<string, number> = {};
        logsData?.forEach((log: any) => {
          const date = log.logged_at.split('T')[0];
          logsByDate[date] = (logsByDate[date] || 0) + 1;
        });

        Object.entries(logsByDate).forEach(([date, count]) => {
          if (count >= requiredSlots) {
            dayLogs[date] = true;
          }
        });
      }
      break;
    }

    case 'water': {
      const { data: planData } = await client
        .from('plans')
        .select('data')
        .eq('user_id', userId)
        .eq('category', 'water')
        .eq('is_active', true)
        .single();

      const targetMl = planData?.data?.daily_target_ml || 2000;

      const { data: logsData } = await client
        .from('water_logs')
        .select('logged_at, amount_ml')
        .eq('user_id', userId)
        .gte('logged_at', `${startDateStr}T00:00:00`)
        .lte('logged_at', `${endDateStr}T23:59:59`);

      const totalByDate: Record<string, number> = {};
      logsData?.forEach((log: any) => {
        const date = log.logged_at.split('T')[0];
        totalByDate[date] = (totalByDate[date] || 0) + log.amount_ml;
      });

      Object.entries(totalByDate).forEach(([date, total]) => {
        if (total >= targetMl) {
          dayLogs[date] = true;
        }
      });
      break;
    }

    case 'sleep': {
      const { data } = await client
        .from('sleep_logs')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDateStr)
        .lte('date', endDateStr);

      data?.forEach((log: any) => {
        dayLogs[log.date] = true;
      });
      break;
    }
  }

  // Calculate current streak (counting backwards from today)
  let currentStreak = 0;
  let checkDate = new Date(endDate);
  let lastCompletedDate: string | null = null;

  while (checkDate >= startDate) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dayLogs[dateStr]) {
      currentStreak++;
      if (!lastCompletedDate) {
        lastCompletedDate = dateStr;
      }
    } else if (lastCompletedDate) {
      // Streak broken
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Calculate longest streak in the period
  let longestStreak = 0;
  let tempStreak = 0;

  const sortedDates = Object.keys(dayLogs).sort();
  for (let i = 0; i < sortedDates.length; i++) {
    if (dayLogs[sortedDates[i]]) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    current_streak: currentStreak,
    longest_streak: Math.max(longestStreak, currentStreak),
    last_completed_date: lastCompletedDate,
  };
}
