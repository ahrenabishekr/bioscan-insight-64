import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);

  // Use your local network IP
  const API_URL = 'http://172.16.18.169:3001';

  const handleForgotPassword = async () => {
    if (!studentId.trim()) {
      Alert.alert('Error', 'Please enter your Student ID');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId.trim().toUpperCase(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          '✅ Success!',
          'Password reset link has been sent to your email.\n\nPlease check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
        setStudentId('');
      } else {
        Alert.alert('❌ Error', data.error || 'Student ID not found');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert(
        '❌ Network Error',
        'Could not connect to server. Make sure backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>🔐 Forgot Password?</Text>
        <Text style={styles.subtitle}>
          Enter your Student ID and we'll send you a password reset link to your registered email.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Student ID (e.g., BIO2026001)"
          value={studentId}
          onChangeText={setStudentId}
          autoCapitalize="characters"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleForgotPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back to Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default ForgotPasswordScreen;
