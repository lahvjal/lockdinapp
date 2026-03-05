import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { supabase } from '../../services/supabase';
import { signOut } from '../../store/slices/authSlice';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    dispatch(signOut());
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to LockdIn!
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Hello, {user?.email}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        Authentication successful! You're now signed in.
      </Text>
      <Text variant="bodySmall" style={styles.nextSteps}>
        Next: Onboarding flow will be implemented here
      </Text>
      <Button 
        mode="outlined" 
        onPress={handleSignOut}
        style={styles.button}
      >
        Sign Out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  nextSteps: {
    color: '#999',
    marginBottom: 32,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  button: {
    marginTop: 16,
  },
});
