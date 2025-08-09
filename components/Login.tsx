import { TouchableOpacity } from 'react-native';
// components/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons'; // make sure this is imported

const LoginScreen = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [description, setDescription] = useState('');
  const [magicWord, setMagicWord] = useState('');
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('auth'); // 'auth' or 'forgot'
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  // Gender options for dropdown
  const genderOptions = ['Male', 'Female'];

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

    // For signup, validate additional fields
    if (mode === 'signup') {
      if (!email || !description || !magicWord) {
        Alert.alert('Please fill in all fields');
        return;
      }
    }

    const key = `user_${username}`;

    if (mode === 'signup') {
      const existing = await AsyncStorage.getItem(key);
      if (existing) {
        Alert.alert('Username already exists');
        return;
      }
      
      // Save user data including email and description
      const userData = {
        password: password,
        email: email,
        description: description,
        magicWord: magicWord,
        createdAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(userData));
      Alert.alert('Sign-up successful! You can now log in.');
      setMode('login');
      
      // Clear signup fields
      setEmail('');
      setDescription('');
      setMagicWord('');
    } else {
      const storedUserData = await AsyncStorage.getItem(key);
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          // Handle both old format (string) and new format (object)
          const storedPassword = typeof userData === 'string' ? userData : userData.password;
          
          if (storedPassword === password) {
            // Save session for persistent login
            await saveSession(username, rememberMe);
            onLoginSuccess(); // Grant access to app
          } else {
            Alert.alert('Invalid credentials');
          }
        } catch (error) {
          // Handle old format users
          if (storedUserData === password) {
            await saveSession(username, rememberMe);
            onLoginSuccess();
          } else {
            Alert.alert('Invalid credentials');
          }
        }
      } else {
        Alert.alert('Invalid credentials');
      }
    }
  };

  const handlePasswordResetSubmit = async () => {
    if (!username || !password || !magicWord) {
      Alert.alert('Please fill in all fields');
      return;
    }
    
    const key = `user_${username}`;
    const storedUserData = await AsyncStorage.getItem(key);
    
    if (!storedUserData) {
      Alert.alert('Username not found');
      return;
    }
    
    // Verify magic word before allowing password reset
    try {
      const userData = JSON.parse(storedUserData);
      if (typeof userData === 'object') {
        if (userData.magicWord && userData.magicWord !== magicWord) {
          Alert.alert('Invalid magic word');
          return;
        }
        userData.password = password;
        await AsyncStorage.setItem(key, JSON.stringify(userData));
      } else {
        // Handle old format users - they don't have magic word, so allow reset
        await AsyncStorage.setItem(key, password);
      }
    } catch (error) {
      // Handle old format users
      await AsyncStorage.setItem(key, password);
    }
    
    Alert.alert('Password reset successful!', 'You can now log in with your new password.');
    setCurrentScreen('auth');
    setUsername('');
    setPassword('');
    setMagicWord('');
  };

  const handlePasswordReset = async () => {
    if (!username) {
      Alert.alert('Enter your username first');
      return;
    }

    const key = `user_${username}`;
    const storedUserData = await AsyncStorage.getItem(key);

    if (!storedUserData) {
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
        
        try {
          const userData = JSON.parse(storedUserData);
          // Update password in user data object
          if (typeof userData === 'object') {
            userData.password = newPassword;
            await AsyncStorage.setItem(key, JSON.stringify(userData));
          } else {
            // Handle old format
            await AsyncStorage.setItem(key, newPassword);
          }
        } catch (error) {
          // Handle old format
          await AsyncStorage.setItem(key, newPassword);
        }
        
        Alert.alert('Password reset successful. You can now log in.');
      },
      'plain-text',
      '',
      'default'
    );
  };

  const handleLogout = async () => {
    await clearSession();
    await AsyncStorage.multiRemove(['userToken', 'userProfile']);
    // This would be called from your main app when user logs out
  };

  // Show loading screen while checking for existing session
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#086e36ff" />
        <Text style={styles.loadingText}>Checking login status...</Text>
      </View>
    );
  }

  // Forgot Password Screen
  if (currentScreen === 'forgot') {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Reset Password</Text>
        </View>
        
        {/* Username Input */}
        <View style={styles.inputWrapper}>
          <Feather name="user" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.inputField}
            placeholder="Username"
            placeholderTextColor="#888"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
        </View>
        
        {/* Magic Word Input */}
        <View style={styles.inputWrapper}>
          <Feather name="key" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.inputField}
            placeholder="Magic Word (for account recovery)"
            autoCapitalize="none"
            placeholderTextColor="#888"
            value={magicWord}
            onChangeText={setMagicWord}
          />
        </View>

        {/* New Password Input */}
        <View style={styles.inputWrapper}>
          <Feather name="lock" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.inputField}
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Feather 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#888" 
              style={styles.eyeIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Reset Password Button */}
        <TouchableOpacity style={styles.authButton} onPress={handlePasswordResetSubmit}>
          <Text style={styles.authButtonText}>Reset Password</Text>
        </TouchableOpacity>

        {/* Back to Login Link */}
        <Text style={styles.link} onPress={() => setCurrentScreen('auth')}>
          Back to Login
        </Text>
      </View>
    );
  }

  // Main Auth Screen (Login/Signup)
  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{mode === 'login' ? 'Login' : 'Sign Up'}</Text>
      </View>
      
      {/* Username Input */}
      <View style={styles.inputWrapper}>
        <Feather name="user" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.inputField}
          placeholder="Username"
          placeholderTextColor="#888"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
      </View>
      
      {/* Email Input - Only show in signup mode */}
      {mode === 'signup' && (
        <View style={styles.inputWrapper}>
          <Feather name="mail" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.inputField}
            placeholder="Email"
            placeholderTextColor="#888"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>
      )}
      
      {/* Password Input */}
      <View style={styles.inputWrapper}>
        <Feather name="lock" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.inputField}
          placeholder="Password"
          placeholderTextColor="#888"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Feather 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#888" 
            style={styles.eyeIcon}
          />
        </TouchableOpacity>
      </View>
      
      {/* Magic Word Input - Only show in signup mode */}
      {mode === 'signup' && (
        <View style={styles.inputWrapper}>
          <Feather name="key" size={20} color="#888" style={styles.icon} />
          <TextInput
            style={styles.inputField}
            placeholder="Magic Word (for account recovery)"
            autoCapitalize="none"
            placeholderTextColor="#888"
            value={magicWord}
            onChangeText={setMagicWord}
          />
        </View>
      )}
      
      {/* Gender Dropdown - Only show in signup mode */}
      {mode === 'signup' && (
        <View style={styles.inputWrapper}>
          <Feather name="users" size={20} color="#888" style={styles.icon} />
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setShowGenderDropdown(!showGenderDropdown)}
          >
            <Text style={[styles.dropdownText, !description && styles.placeholderText]}>
              {description || "What best describes you?"}
            </Text>
            <Feather 
              name={showGenderDropdown ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#888" 
            />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Gender Dropdown List */}
      {mode === 'signup' && showGenderDropdown && (
        <View style={styles.dropdownList}>
          {genderOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dropdownOption,
                
                index === genderOptions.length - 1 && styles.lastDropdownOption
              ]}
              onPress={() => {
                setDescription(option);
                setShowGenderDropdown(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>{option}</Text>
              {description === option && (
                <Feather name="check" size={16} color="#06a54e" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Remember Me - Only show in login mode */}
      {mode === 'login' && (
        <View style={styles.checkboxContainer}>
          <TouchableOpacity 
            style={styles.checkboxTouchable}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <Feather 
              name={rememberMe ? "check-square" : "square"} 
              size={18} 
              color={rememberMe ? "#eb0404ff" : "#927d05ff"} 
            />
            <Text style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              Remember me for 7 days
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Forgot Password - Only show in login mode */}
      {mode === 'login' && (
        <Text style={styles.forgot} onPress={() => setCurrentScreen('forgot')}>
          Forgot password?
        </Text>
      )}

      {/* Auth Button */}
      <TouchableOpacity style={styles.authButton } onPress={handleAuth}>
        <Text style={styles.authButtonText}>
          {mode === 'login' ? 'Login' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Toggle Mode Link */}
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
    backgroundColor: '#f9f9f9',
  },
  headerContainer: {
    alignItems: 'flex-end',
    marginBottom: 30,
    
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#086e36ff',
    marginTop: 16,
    fontSize: 16,
  },
  title: { 
    fontSize: 34, 
    marginBottom: 20, 
    textAlign: 'right', 
    color: '#000000ff',
    fontWeight: 'bold',
    marginRight: 30,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#06a54e',
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    marginLeft: 30,
    marginRight: 30,
  },
  icon: {
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    height: 50,
    fontSize: 16,
    paddingVertical: 15,
    
  },
  checkboxContainer: {
    marginBottom: 15,
    marginLeft: 30,
  },
  checkboxTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    color: '#927d05ff',
    fontSize: 16,
    marginLeft: 8,
  },
  checkboxChecked: {
    color: '#eb0404ff',
  },
  authButton: {
    backgroundColor: '#086e36ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 30,
    marginRight: 30,
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    color: '#6b6b6bff',
    textAlign: 'center',
  },
  forgot: {
    color: '#b61904ff',
    textAlign: 'right',
    marginBottom: 10,
    textDecorationLine: 'underline',
    marginRight: 30,
  },
  dropdownButton: {
    flex: 1,
    height: 50,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: '#000000',
  },
  placeholderText: {
    color: '#888',
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#06a54e',
    borderRadius: 10,
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 15,
    marginTop: -10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  eyeIcon: {
    marginLeft: 8,
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