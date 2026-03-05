import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, ProgressBar, Button } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Streak } from '../../types';

interface CategoryStreak extends Streak {
  category: string;
  at_risk: boolean;
  completion_percentage: number;
}

export default function StreaksScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [streaks, setStreaks] = useState<CategoryStreak[]>([]);
  const [overallCompletion, setOverallCompletion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStreaks();
  }, []);

  const loadStreaks = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch streaks from database
      const { data: streaksData, error } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Check if each category is at risk
      const today = new Date().toISOString().split('T')[0];
      const enrichedStreaks: CategoryStreak[] = await Promise.all(
        (streaksData || []).map(async (streak) => {
          const isAtRisk = await checkIfAtRisk(streak.category, streak.last_completed_date, today);
          const completion = await getTodayCompletion(streak.category);
          
          return {
            ...streak,
            at_risk: isAtRisk,
            completion_percentage: completion,
          };
        })
      );

      setStreaks(enrichedStreaks);

      // Calculate overall completion percentage
      const totalCompletion = enrichedStreaks.reduce((sum, s) => sum + s.completion_percentage, 0);
      setOverallCompletion(enrichedStreaks.length > 0 ? totalCompletion / enrichedStreaks.length : 0);
    } catch (error) {
      console.error('Error loading streaks:', error);
      Alert.alert('Error', 'Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAtRisk = async (category: string, lastCompletedDate: string | null, today: string): Promise<boolean> => {
    if (!lastCompletedDate) return true;
    
    const lastDate = new Date(lastCompletedDate);
    const todayDate = new Date(today);
    const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    // If last completed was yesterday or earlier, and today is not complete, it's at risk
    return daysDiff >= 1;
  };

  const getTodayCompletion = async (category: string): Promise<number> => {
    if (!user) return 0;

    const today = new Date().toISOString().split('T')[0];

    try {
      switch (category) {
        case 'workout': {
          const { data } = await supabase
            .from('workout_logs')
            .select('status')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

          return data?.status === 'completed' ? 100 : 0;
        }

        case 'meals': {
          const { data: planData } = await supabase
            .from('plans')
            .select('id')
            .eq('user_id', user.id)
            .eq('category', 'meals')
            .eq('is_active', true)
            .maybeSingle();

          if (!planData) return 0;

          const { data: slotsData } = await supabase
            .from('meal_slots')
            .select('id')
            .eq('plan_id', planData.id);

          const totalSlots = slotsData?.length || 3;

          const { data: logsData } = await supabase
            .from('meal_logs')
            .select('id')
            .eq('user_id', user.id)
            .gte('logged_at', `${today}T00:00:00`)
            .lte('logged_at', `${today}T23:59:59`);

          const loggedCount = logsData?.length || 0;
          return Math.round((loggedCount / totalSlots) * 100);
        }

        case 'water': {
          const { data: planData } = await supabase
            .from('plans')
            .select('data')
            .eq('user_id', user.id)
            .eq('category', 'water')
            .eq('is_active', true)
            .maybeSingle();

          const targetMl = planData?.data?.daily_target_ml || 2000;

          const { data: logsData } = await supabase
            .from('water_logs')
            .select('amount_ml')
            .eq('user_id', user.id)
            .gte('logged_at', `${today}T00:00:00`)
            .lte('logged_at', `${today}T23:59:59`);

          const totalMl = logsData?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
          return Math.min(Math.round((totalMl / targetMl) * 100), 100);
        }

        case 'sleep': {
          const { data } = await supabase
            .from('sleep_logs')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', today)
            .maybeSingle();

          return data ? 100 : 0;
        }

        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error checking completion for ${category}:`, error);
      return 0;
    }
  };

  const recalculateStreaks = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Call Edge Function to recalculate streaks
      const { data, error } = await supabase.functions.invoke('calculate-streaks', {
        body: { userId: user.id },
      });

      if (error) throw error;

      Alert.alert('Success', 'Streaks recalculated!');
      await loadStreaks();
    } catch (error) {
      console.error('Error recalculating streaks:', error);
      Alert.alert('Error', 'Failed to recalculate streaks');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'workout': return '💪';
      case 'meals': return '🍽️';
      case 'water': return '💧';
      case 'sleep': return '😴';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workout': return '#1976D2';
      case 'meals': return '#4CAF50';
      case 'water': return '#2196F3';
      case 'sleep': return '#673AB7';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading streaks...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Your Streaks 🔥</Text>

        <Card style={styles.overallCard}>
          <Card.Content>
            <Text variant="displayMedium" style={styles.overallPercentage}>
              {Math.round(overallCompletion)}%
            </Text>
            <Text variant="titleMedium" style={styles.overallLabel}>
              Overall Completion
            </Text>
            <ProgressBar
              progress={overallCompletion / 100}
              style={styles.overallProgress}
              color="#FF9800"
            />
            <Text variant="bodySmall" style={styles.overallHint}>
              Complete all categories daily to maintain your streaks
            </Text>
          </Card.Content>
        </Card>

        {streaks.map((streak) => (
          <Card
            key={streak.category}
            style={[
              styles.streakCard,
              streak.at_risk && styles.atRiskCard,
            ]}
          >
            <Card.Content>
              <View style={styles.streakHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(streak.category)}</Text>
                  <View>
                    <Text variant="titleLarge" style={{ color: getCategoryColor(streak.category) }}>
                      {streak.category.charAt(0).toUpperCase() + streak.category.slice(1)}
                    </Text>
                    {streak.at_risk && (
                      <Text variant="bodySmall" style={styles.atRiskText}>
                        ⚠️ At Risk
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.streakNumbers}>
                  <Text variant="displaySmall" style={styles.currentStreak}>
                    {streak.current_streak}
                  </Text>
                  <Text variant="bodySmall" style={styles.streakLabel}>
                    day streak
                  </Text>
                </View>
              </View>

              <View style={styles.todayProgress}>
                <Text variant="bodyMedium">Today's Progress:</Text>
                <Text variant="titleMedium" style={styles.todayPercentage}>
                  {Math.round(streak.completion_percentage)}%
                </Text>
              </View>

              <ProgressBar
                progress={streak.completion_percentage / 100}
                style={styles.categoryProgress}
                color={getCategoryColor(streak.category)}
              />

              <View style={styles.streakStats}>
                <View>
                  <Text variant="bodySmall" style={styles.statLabel}>Longest Streak</Text>
                  <Text variant="titleMedium">{streak.longest_streak} days</Text>
                </View>
                {streak.last_completed_date && (
                  <View>
                    <Text variant="bodySmall" style={styles.statLabel}>Last Completed</Text>
                    <Text variant="bodyMedium">
                      {new Date(streak.last_completed_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="outlined"
          onPress={recalculateStreaks}
          style={styles.recalculateButton}
        >
          Recalculate Streaks
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  overallCard: {
    marginBottom: 24,
    backgroundColor: '#FFF3E0',
  },
  overallPercentage: {
    fontWeight: 'bold',
    color: '#FF9800',
    textAlign: 'center',
  },
  overallLabel: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 12,
  },
  overallProgress: {
    height: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  overallHint: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  streakCard: {
    marginBottom: 16,
  },
  atRiskCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 32,
  },
  atRiskText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  streakNumbers: {
    alignItems: 'center',
  },
  currentStreak: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  streakLabel: {
    color: '#666',
  },
  todayProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayPercentage: {
    fontWeight: 'bold',
  },
  categoryProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 16,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: '#666',
    marginBottom: 4,
  },
  recalculateButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});
