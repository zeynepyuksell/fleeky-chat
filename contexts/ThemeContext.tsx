import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
 
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  
  background: string;
  surface: string;
  surfaceVariant: string;
  
 
  text: string;
  textSecondary: string;
  textTertiary: string;
  
 
  border: string;
  borderLight: string;
  
  
  success: string;
  error: string;
  warning: string;
  info: string;
  
  
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDisabled: string;
  
  
  shadow: string;
  
  
  inputBackground: string;
  inputBorder: string;
  inputPlaceholder: string;
}

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const lightTheme: ThemeColors = {
  primary: '#6D28D9', // Darker Purple
  primaryLight: '#8B5CF6',
  primaryDark: '#5B21B6',
  
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceVariant: '#F1F5F9',
  
  text: '#1E293B',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  buttonPrimary: '#8B5CF6',
  buttonSecondary: '#F1F5F9',
  buttonDisabled: '#CBD5E1',
  
  shadow: 'rgba(0, 0, 0, 0.1)',
  
  inputBackground: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputPlaceholder: '#94A3B8',
};

const darkTheme: ThemeColors = {
  primary: '#8B5CF6', 
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  
  border: '#334155',
  borderLight: '#475569',
  
  success: '#34D399',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  
  buttonPrimary: '#A78BFA',
  buttonSecondary: '#334155',
  buttonDisabled: '#475569',
  
  shadow: 'rgba(0, 0, 0, 0.3)',
  
  inputBackground: '#1E293B',
  inputBorder: '#334155',
  inputPlaceholder: '#64748B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemeMode();
  }, []);

  useEffect(() => {
    const shouldUseDark = 
      themeMode === 'dark' || 
      (themeMode === 'system' && systemColorScheme === 'dark');
    setIsDark(shouldUseDark);
  }, [themeMode, systemColorScheme]);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('themeMode');
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeMode(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    }
  };

  const handleSetThemeMode = async (mode: ThemeMode) => {
    setThemeMode(mode);
    try {
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
    }
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode: handleSetThemeMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}; 