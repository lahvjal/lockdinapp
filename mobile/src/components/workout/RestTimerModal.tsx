import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Portal, Modal, Text, Button, ProgressBar } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { updateRestTimer, stopRestTimer } from '../../store/slices/workoutSlice';

export default function RestTimerModal() {
  const dispatch = useDispatch();
  const { restTimer } = useSelector((state: RootState) => state.workout);

  useEffect(() => {
    if (!restTimer.active) return;

    const interval = setInterval(() => {
      if (restTimer.secondsRemaining > 0) {
        dispatch(updateRestTimer(restTimer.secondsRemaining - 1));
      } else {
        dispatch(stopRestTimer());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.secondsRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSkip = () => {
    dispatch(stopRestTimer());
  };

  const progress = restTimer.secondsRemaining / 90; // Assuming max 90 seconds rest

  return (
    <Portal>
      <Modal
        visible={restTimer.active}
        onDismiss={handleSkip}
        contentContainerStyle={styles.modal}
      >
        <Text variant="headlineMedium" style={styles.title}>
          Rest Timer
        </Text>

        <Text variant="displayLarge" style={styles.time}>
          {formatTime(restTimer.secondsRemaining)}
        </Text>

        <ProgressBar
          progress={1 - progress}
          style={styles.progress}
        />

        <Text variant="bodyMedium" style={styles.message}>
          Take your time and catch your breath
        </Text>

        <Button
          mode="outlined"
          onPress={handleSkip}
          style={styles.button}
        >
          Skip Rest
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    padding: 32,
    margin: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
  },
  time: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1976D2',
  },
  progress: {
    width: '100%',
    height: 8,
    marginBottom: 24,
    borderRadius: 4,
  },
  message: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    minWidth: 150,
  },
});
