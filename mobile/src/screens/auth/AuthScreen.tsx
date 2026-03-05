import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../services/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function AuthScreen() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            path: '/auth/callback',
          }),
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          AuthSession.makeRedirectUri({
            path: '/auth/callback',
          })
        );

        if (result.type === 'success') {
          const { url } = result;
          const params = new URL(url).searchParams;
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: AuthSession.makeRedirectUri({
            path: '/auth/callback',
          }),
        },
      });

      if (error) throw error;

      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          AuthSession.makeRedirectUri({
            path: '/auth/callback',
          })
        );

        if (result.type === 'success') {
          const { url } = result;
          const params = new URL(url).searchParams;
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Signing in...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayLarge" style={styles.title}>LockdIn</Text>
        <Text variant="titleMedium" style={styles.subtitle}>
          Your structured habit companion
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleGoogleSignIn}
          style={styles.button}
          contentStyle={styles.buttonContent}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <Button
          mode="contained"
          onPress={handleAppleSignIn}
          style={[styles.button, styles.appleButton]}
          contentStyle={styles.buttonContent}
          buttonColor="#000"
          disabled={loading}
        >
          Continue with Apple
        </Button>
      </View>

      <Text variant="bodySmall" style={styles.disclaimer}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    marginBottom: 16,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  appleButton: {
    marginTop: 8,
  },
  disclaimer: {
    textAlign: 'center',
    color: '#999',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
});
