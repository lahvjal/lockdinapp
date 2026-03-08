import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { Button, Text, TextInput, ActivityIndicator, SegmentedButtons, Divider } from 'react-native-paper';
import { supabase } from '../../services/supabase';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        Alert.alert('Check your email', 'We sent you a confirmation link. Click it to activate your account.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error: any) {
      Alert.alert('Auth error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);

      // Force lockdinapp:// scheme regardless of environment.
      // ASWebAuthenticationSession (used by openAuthSessionAsync on iOS) intercepts
      // redirects to this scheme automatically — it does NOT need to be registered
      // in Info.plist. This avoids the exp://127.0.0.1 Metro-manifest problem.
      const redirectUri = 'lockdinapp://auth/callback';

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });
      if (error) throw error;

      if (data.url) {
        // ASWebAuthenticationSession watches for redirects to lockdinapp://
        // and closes the in-app browser, returning the full URL with tokens.
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

        if (result.type === 'success') {
          const fragment = result.url.includes('#')
            ? result.url.split('#')[1]
            : result.url.split('?')[1] ?? '';
          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          } else {
            Alert.alert('Sign in failed', 'Could not retrieve session. Please try again.');
          }
        }
      }
    } catch (error: any) {
      Alert.alert('Sign in error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Signing in…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="displayLarge" style={styles.title}>LockdIn</Text>
          <Text variant="titleMedium" style={styles.subtitle}>Your structured habit companion</Text>
        </View>

        <SegmentedButtons
          value={mode}
          onValueChange={(v) => setMode(v as AuthMode)}
          buttons={[
            { value: 'signin', label: 'Sign In' },
            { value: 'signup', label: 'Create Account' },
          ]}
          style={styles.segmented}
        />

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!passwordVisible}
            right={
              <TextInput.Icon
                icon={passwordVisible ? 'eye-off' : 'eye'}
                onPress={() => setPasswordVisible(!passwordVisible)}
              />
            }
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleEmailAuth}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </View>

        <View style={styles.dividerRow}>
          <Divider style={styles.dividerLine} />
          <Text variant="bodySmall" style={styles.dividerText}>or</Text>
          <Divider style={styles.dividerLine} />
        </View>

        <Button
          mode="outlined"
          onPress={() => handleOAuthSignIn('google')}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="google"
        >
          Continue with Google
        </Button>

        <Button
          mode="contained"
          onPress={() => handleOAuthSignIn('apple')}
          style={[styles.button, styles.appleButton]}
          contentStyle={styles.buttonContent}
          buttonColor="#000"
          icon="apple"
        >
          Continue with Apple
        </Button>

        <Text variant="bodySmall" style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  segmented: {
    marginBottom: 24,
  },
  form: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginBottom: 12,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  appleButton: {
    marginBottom: 24,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  disclaimer: {
    textAlign: 'center',
    color: '#999',
    paddingHorizontal: 16,
  },
});
