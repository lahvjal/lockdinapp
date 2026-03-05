import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, Portal, Modal, Chip } from 'react-native-paper';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SkipTokenData {
  id: string;
  month: string;
  total_tokens: number;
  used_tokens: number;
  remaining_tokens: number;
}

interface SkipTokenUsage {
  id: string;
  date: string;
  category: string;
  created_at: string;
}

export default function SkipTokensScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [tokenData, setTokenData] = useState<SkipTokenData | null>(null);
  const [usageHistory, setUsageHistory] = useState<SkipTokenUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [useModalVisible, setUseModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['workout', 'meals', 'water', 'sleep'];

  useEffect(() => {
    loadSkipTokens();
  }, []);

  const loadSkipTokens = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const currentMonth = new Date().toISOString().substring(0, 7);

      // Get current month's tokens
      const { data: tokenData, error: tokenError } = await supabase
        .from('skip_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .maybeSingle();

      if (tokenError) throw tokenError;

      setTokenData(tokenData);

      // Get usage history for current month
      const { data: usageData, error: usageError } = await supabase
        .from('skip_token_usage')
        .select('*')
        .eq('skip_token_id', tokenData?.id)
        .order('created_at', { ascending: false });

      if (usageError) throw usageError;

      setUsageHistory(usageData || []);
    } catch (error) {
      console.error('Error loading skip tokens:', error);
      Alert.alert('Error', 'Failed to load skip token data');
    } finally {
      setLoading(false);
    }
  };

  const handleUseToken = async () => {
    if (!user || !selectedCategory || !tokenData) return;

    if (tokenData.remaining_tokens <= 0) {
      Alert.alert('No Tokens Available', 'You have used all your skip tokens for this month.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      // Check if token already used for this category today
      const { data: existingUsage } = await supabase
        .from('skip_token_usage')
        .select('id')
        .eq('skip_token_id', tokenData.id)
        .eq('category', selectedCategory)
        .eq('date', today)
        .maybeSingle();

      if (existingUsage) {
        Alert.alert('Already Used', 'You have already used a skip token for this category today.');
        return;
      }

      // Insert usage record
      const { error: usageError } = await supabase
        .from('skip_token_usage')
        .insert({
          skip_token_id: tokenData.id,
          category: selectedCategory,
          date: today,
        });

      if (usageError) throw usageError;

      // Update token count
      const { error: updateError } = await supabase
        .from('skip_tokens')
        .update({
          used_tokens: tokenData.used_tokens + 1,
          remaining_tokens: tokenData.remaining_tokens - 1,
        })
        .eq('id', tokenData.id);

      if (updateError) throw updateError;

      Alert.alert('Success', `Skip token used for ${selectedCategory}. Your streak is protected!`);
      setUseModalVisible(false);
      setSelectedCategory(null);
      await loadSkipTokens();
    } catch (error) {
      console.error('Error using skip token:', error);
      Alert.alert('Error', 'Failed to use skip token');
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
        <Text>Loading skip tokens...</Text>
      </SafeAreaView>
    );
  }

  if (!tokenData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text variant="headlineSmall" style={styles.emptyTitle}>
            No Skip Tokens Available
          </Text>
          <Text variant="bodyMedium" style={styles.emptyText}>
            Skip tokens are allocated at the start of each month.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="displaySmall" style={styles.title}>Skip Tokens 🎫</Text>

        <Card style={styles.summaryCard}>
          <Card.Content>
            <View style={styles.tokenDisplay}>
              <Text variant="displayLarge" style={styles.tokenCount}>
                {tokenData.remaining_tokens}
              </Text>
              <Text variant="titleMedium" style={styles.tokenLabel}>
                Tokens Remaining
              </Text>
            </View>

            <View style={styles.tokenInfo}>
              <Text variant="bodyMedium" style={styles.infoText}>
                Total this month: {tokenData.total_tokens}
              </Text>
              <Text variant="bodyMedium" style={styles.infoText}>
                Used: {tokenData.used_tokens}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              💡 How Skip Tokens Work
            </Text>
            <Text variant="bodyMedium" style={styles.infoDescription}>
              Skip tokens let you maintain your streak when life gets busy. Use a token to mark a category as complete for today without logging anything.
              {'\n\n'}
              • You get 3 tokens per month{'\n'}
              • Use them for any category{'\n'}
              • One token = one day in one category{'\n'}
              • Unused tokens don't roll over{'\n'}
              • Tokens renew on the 1st of each month
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleLarge" style={styles.sectionTitle}>
          Use a Token
        </Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => {
            const usedToday = usageHistory.some(
              (usage) =>
                usage.category === category &&
                usage.date === new Date().toISOString().split('T')[0]
            );

            return (
              <Card
                key={category}
                style={[
                  styles.categoryCard,
                  usedToday && styles.usedCard,
                ]}
                onPress={() => {
                  if (usedToday) {
                    Alert.alert('Already Used', `You've already used a skip token for ${category} today.`);
                  } else {
                    setSelectedCategory(category);
                    setUseModalVisible(true);
                  }
                }}
              >
                <Card.Content>
                  <Text style={styles.categoryCardIcon}>{getCategoryIcon(category)}</Text>
                  <Text variant="titleMedium" style={{ color: getCategoryColor(category) }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Text>
                  {usedToday && (
                    <Chip style={styles.usedChip} textStyle={styles.usedChipText}>
                      Used Today
                    </Chip>
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </View>

        {usageHistory.length > 0 && (
          <>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Usage History
            </Text>

            {usageHistory.map((usage) => (
              <Card key={usage.id} style={styles.historyCard}>
                <Card.Content style={styles.historyContent}>
                  <View style={styles.historyCategory}>
                    <Text style={styles.historyIcon}>{getCategoryIcon(usage.category)}</Text>
                    <Text variant="titleMedium">
                      {usage.category.charAt(0).toUpperCase() + usage.category.slice(1)}
                    </Text>
                  </View>
                  <Text variant="bodySmall" style={styles.historyDate}>
                    {new Date(usage.date).toLocaleDateString()}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </>
        )}
      </ScrollView>

      <Portal>
        <Modal
          visible={useModalVisible}
          onDismiss={() => {
            setUseModalVisible(false);
            setSelectedCategory(null);
          }}
          contentContainerStyle={styles.modal}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>
            Use Skip Token?
          </Text>

          <Text variant="bodyLarge" style={styles.modalText}>
            Are you sure you want to use a skip token for{' '}
            <Text style={{ fontWeight: 'bold' }}>{selectedCategory}</Text> today?
          </Text>

          <Text variant="bodyMedium" style={styles.modalWarning}>
            This will count as completing {selectedCategory} for today and protect your streak.
            You have {tokenData.remaining_tokens} token(s) remaining this month.
          </Text>

          <Button
            mode="contained"
            onPress={handleUseToken}
            style={styles.modalButton}
          >
            Use Token
          </Button>

          <Button
            mode="outlined"
            onPress={() => {
              setUseModalVisible(false);
              setSelectedCategory(null);
            }}
            style={styles.modalButton}
          >
            Cancel
          </Button>
        </Modal>
      </Portal>
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
  summaryCard: {
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
  },
  tokenDisplay: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenCount: {
    fontWeight: 'bold',
    color: '#FF9800',
  },
  tokenLabel: {
    color: '#666',
  },
  tokenInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoText: {
    color: '#666',
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#E3F2FD',
  },
  infoTitle: {
    marginBottom: 12,
  },
  infoDescription: {
    lineHeight: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  categoryCard: {
    width: '47%',
  },
  usedCard: {
    opacity: 0.6,
  },
  categoryCardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  usedChip: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
  },
  usedChipText: {
    color: '#fff',
    fontSize: 10,
  },
  historyCard: {
    marginBottom: 8,
  },
  historyContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyIcon: {
    fontSize: 24,
  },
  historyDate: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  modalText: {
    marginBottom: 16,
  },
  modalWarning: {
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  modalButton: {
    marginTop: 8,
  },
});
