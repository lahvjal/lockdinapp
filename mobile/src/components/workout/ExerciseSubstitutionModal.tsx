import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Portal, Modal, Text, Button, Card, Searchbar, Chip } from 'react-native-paper';
import { Exercise } from '../../types';
import { findSubstituteExercises, searchExercises } from '../../utils/exerciseDatabase';

interface ExerciseSubstitutionModalProps {
  visible: boolean;
  onDismiss: () => void;
  currentExercise: Exercise;
  onSelectSubstitute: (exercise: Exercise) => void;
  availableEquipment?: string[];
  scenario: 'swap' | 'equipment-unavailable';
}

export default function ExerciseSubstitutionModal({
  visible,
  onDismiss,
  currentExercise,
  onSelectSubstitute,
  availableEquipment,
  scenario,
}: ExerciseSubstitutionModalProps) {
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bodyweight' | 'similar'>('similar');

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible, currentExercise]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const substitutes = await findSubstituteExercises(
        currentExercise.id,
        availableEquipment
      );
      setSuggestions(substitutes);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      Alert.alert('Error', 'Failed to load exercise suggestions');
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    try {
      const results = await searchExercises(searchQuery);
      setSearchResults(results.filter(ex => ex.id !== currentExercise.id));
    } catch (error) {
      console.error('Error searching exercises:', error);
    }
  };

  const handleSelectExercise = (exercise: Exercise) => {
    Alert.alert(
      'Confirm Substitution',
      `Replace "${currentExercise.name}" with "${exercise.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            onSelectSubstitute(exercise);
            onDismiss();
          },
        },
      ]
    );
  };

  const filteredSuggestions = () => {
    if (selectedFilter === 'bodyweight') {
      return suggestions.filter(ex => ex.is_bodyweight);
    }
    if (selectedFilter === 'similar') {
      return suggestions.slice(0, 5);
    }
    return suggestions;
  };

  const displayExercises = searchQuery.length > 2 ? searchResults : filteredSuggestions();

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <ScrollView>
          <Text variant="headlineSmall" style={styles.title}>
            {scenario === 'equipment-unavailable' 
              ? 'Equipment Not Available' 
              : 'Swap Exercise'}
          </Text>

          <Card style={styles.currentCard}>
            <Card.Content>
              <Text variant="labelMedium" style={styles.label}>
                Current Exercise:
              </Text>
              <Text variant="titleLarge">{currentExercise.name}</Text>
              <Text variant="bodySmall" style={styles.detail}>
                {currentExercise.primary_muscle_group} · {currentExercise.movement_pattern}
              </Text>
              {currentExercise.equipment_required.length > 0 && (
                <Text variant="bodySmall" style={styles.equipment}>
                  Equipment: {currentExercise.equipment_required.join(', ')}
                </Text>
              )}
            </Card.Content>
          </Card>

          <Searchbar
            placeholder="Search exercises..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />

          {!searchQuery && (
            <View style={styles.filterRow}>
              <Chip
                selected={selectedFilter === 'similar'}
                onPress={() => setSelectedFilter('similar')}
                style={styles.chip}
              >
                Best Matches
              </Chip>
              <Chip
                selected={selectedFilter === 'bodyweight'}
                onPress={() => setSelectedFilter('bodyweight')}
                style={styles.chip}
              >
                Bodyweight Only
              </Chip>
              <Chip
                selected={selectedFilter === 'all'}
                onPress={() => setSelectedFilter('all')}
                style={styles.chip}
              >
                All
              </Chip>
            </View>
          )}

          {scenario === 'equipment-unavailable' && (
            <Text variant="bodyMedium" style={styles.hint}>
              Here are alternatives that don't require the same equipment:
            </Text>
          )}

          {loading ? (
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          ) : displayExercises.length === 0 ? (
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'No exercises found. Try a different search.' 
                : 'No suitable alternatives found.'}
            </Text>
          ) : (
            <View style={styles.exerciseList}>
              {displayExercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  style={styles.exerciseCard}
                  onPress={() => handleSelectExercise(exercise)}
                >
                  <Card.Content>
                    <Text variant="titleMedium">{exercise.name}</Text>
                    <Text variant="bodySmall" style={styles.exerciseDetail}>
                      {exercise.primary_muscle_group} · {exercise.movement_pattern}
                    </Text>
                    {exercise.equipment_required.length > 0 ? (
                      <Text variant="bodySmall" style={styles.exerciseEquipment}>
                        {exercise.equipment_required.join(', ')}
                      </Text>
                    ) : (
                      <Text variant="bodySmall" style={styles.bodyweightTag}>
                        ✓ Bodyweight
                      </Text>
                    )}
                    {exercise.description && (
                      <Text variant="bodySmall" style={styles.description}>
                        {exercise.description.substring(0, 80)}...
                      </Text>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}

          <Button mode="outlined" onPress={onDismiss} style={styles.cancelButton}>
            Cancel
          </Button>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '90%',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  currentCard: {
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  label: {
    color: '#666',
    marginBottom: 4,
  },
  detail: {
    color: '#666',
    marginTop: 4,
  },
  equipment: {
    color: '#999',
    marginTop: 2,
    fontSize: 12,
  },
  searchBar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: 4,
  },
  hint: {
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 20,
  },
  exerciseList: {
    marginBottom: 16,
  },
  exerciseCard: {
    marginBottom: 8,
  },
  exerciseDetail: {
    color: '#666',
    marginTop: 4,
  },
  exerciseEquipment: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  bodyweightTag: {
    color: '#4CAF50',
    fontSize: 12,
    marginTop: 2,
  },
  description: {
    color: '#666',
    marginTop: 6,
  },
  cancelButton: {
    marginTop: 8,
  },
});
