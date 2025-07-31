import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { FirebaseProvider } from '../contexts/FirebaseContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { StatusBar } from '../components/StatusBar';

export default function RootLayout() {
  return (
    <FirebaseProvider>
      <AuthProvider>
        <ThemeProvider>
          <StatusBar />
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </FirebaseProvider>
  );
} 