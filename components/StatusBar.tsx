import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useTheme } from '../contexts/ThemeContext';

export function StatusBar() {
  const { isDark } = useTheme();
  
  return <ExpoStatusBar style={isDark ? 'light' : 'dark'} />;
} 