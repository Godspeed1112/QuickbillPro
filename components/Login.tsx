// components/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Check for existing session on app start
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const loggedInUser = await AsyncStorage.getItem('logged_in_user');
      const sessionExpiry = await AsyncStorage.getItem('session_expiry');
      
      if (loggedInUser && sessionExpiry) {
        const now = new Date().getTime();
        const expiryTime = parseInt(sessionExpiry);
        
        // Check if session is still valid (7 days by default)
        if (now < expiryTime) {
          console.log('Auto-login successful for user:', loggedInUser);
          onLoginSuccess(); // Automatically log user in
          return;
        } else {
          // Session expired, clear it
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('logged_in_user');
      await AsyncStorage.removeItem('session_expiry');
      await AsyncStorage.removeItem('remember_me');
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  };

  const saveSession = async (username: string, rememberUser: boolean = false) => {
    try {
      // Set session expiry (7 days if remember me, 1 day otherwise)
      const expiryDays = rememberUser ? 7 : 1;
      const expiryTime = new Date().getTime() + (expiryDays * 24 * 60 * 60 * 1000);
      
      await AsyncStorage.setItem('logged_in_user', username);
      await AsyncStorage.setItem('session_expiry', expiryTime.toString());
      await AsyncStorage.setItem('remember_me', rememberUser.toString());
      
      console.log(`Session saved for ${username}, expires in ${expiryDays} days`);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const toggleMode = () => setMode((prev) => (prev === 'login' ? 'signup' : 'login'));

  const handleAuth = async () => {
    if (!username || !password) {
      Alert.alert('Please fill in both fields');
      return;
    }

    const key = `user_${username}`;

    if (mode === 'signup') {
      const existing = await AsyncStorage.getItem(key);
      if (existing) {
        Alert.alert('Username already exists');
        return;
      }
      await AsyncStorage.setItem(key, password);
      Alert.alert('Sign-up successful! You can now log in.');
      setMode('login');
    } else {
      const storedPassword = await AsyncStorage.getItem(key);
      if (storedPassword === password) {
        // Save session for persistent login
        await saveSession(username, rememberMe);
        onLoginSuccess(); // Grant access to app
      } else {
        Alert.alert('Invalid credentials');
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!username) {
      Alert.alert('Enter your username first');
      return;
    }

    const key = `user_${username}`;
    const storedPassword = await AsyncStorage.getItem(key);

    if (!storedPassword) {
      Alert.alert('Username not found');
      return;
    }

    Alert.prompt(
      'Reset Password',
      'Enter your new password:',
      async (newPassword) => {
        if (!newPassword) {
          Alert.alert('Password cannot be empty');
          return;
        }
        await AsyncStorage.setItem(key, newPassword);
        Alert.alert('Password reset successful. You can now log in.');
      },
      'plain-text',
      '',
      'default'
    );
  };

  const handleLogout = async () => {
    await clearSession();
    // This would be called from your main app when user logs out
  };

  // Show loading screen while checking for existing session
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      
      {mode === 'login' && (
        <View style={styles.checkboxContainer}>
          <Text 
            style={[styles.checkbox, rememberMe && styles.checkboxChecked]}
            onPress={() => setRememberMe(!rememberMe)}
          >
            {rememberMe ? '☑' : '☐'} Remember me for 7 days
          </Text>
        </View>
      )}

      <Text style={styles.forgot} onPress={handlePasswordReset}>
        Forgot password?
      </Text>

      <Button title={mode === 'login' ? 'Login' : 'Sign Up'} onPress={handleAuth} />
      <Text style={styles.link} onPress={toggleMode}>
        {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20, 
    backgroundColor: '#100136ff' 
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  title: { 
    fontSize: 34, 
    marginBottom: 20, 
    textAlign: 'center', 
    color: '#fff' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 15,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    marginBottom: 15,
  },
  checkbox: {
    color: '#fff',
    fontSize: 16,
  },
  checkboxChecked: {
    color: '#87CEEB',
  },
  link: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center',
  },
  forgot: {
    color: 'skyblue',
    textAlign: 'right',
    marginBottom: 10,
    textDecorationLine: 'underline',
  },
});

// Export the logout function for use in other components
export const logout = async () => {
  try {
    await AsyncStorage.removeItem('logged_in_user');
    await AsyncStorage.removeItem('session_expiry');
    await AsyncStorage.removeItem('remember_me');
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Error during logout:', error);
  }
};

