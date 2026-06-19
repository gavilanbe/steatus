import React, { createContext, useContext, useEffect } from 'react';
import { useSupabaseSettings } from '../hooks/useSupabaseSettings';

interface ThemeContextType {
  isDarkMode: boolean;
  colorScheme: 'warm' | 'cool' | 'neutral';
  fontSize: 'small' | 'medium' | 'large';
  toggleDarkMode: () => void;
  setColorScheme: (scheme: 'warm' | 'cool' | 'neutral') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, updateSettings } = useSupabaseSettings();

  const isDarkMode = settings?.dark_mode || false;
  const colorScheme = settings?.color_scheme || 'warm';
  const fontSize = settings?.font_size || 'medium';

  const toggleDarkMode = async () => {
    if (settings) {
      await updateSettings({ dark_mode: !isDarkMode });
    }
  };

  const setColorScheme = async (scheme: 'warm' | 'cool' | 'neutral') => {
    if (settings) {
      await updateSettings({ color_scheme: scheme });
    }
  };

  const setFontSize = async (size: 'small' | 'medium' | 'large') => {
    if (settings) {
      await updateSettings({ font_size: size });
    }
  };

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply dark mode class
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Apply color scheme class
    root.classList.remove('theme-warm', 'theme-cool', 'theme-neutral');
    root.classList.add(`theme-${colorScheme}`);

    // Apply font size class
    root.classList.remove('text-small', 'text-medium', 'text-large');
    root.classList.add(`text-${fontSize}`);

    // Update CSS custom properties for themes
    if (colorScheme === 'cool') {
      root.style.setProperty('--color-primary', isDarkMode ? '#60a5fa' : '#3b82f6');
      root.style.setProperty('--color-secondary', isDarkMode ? '#34d399' : '#10b981');
      root.style.setProperty('--color-accent', isDarkMode ? '#a78bfa' : '#8b5cf6');
    } else if (colorScheme === 'neutral') {
      root.style.setProperty('--color-primary', isDarkMode ? '#9ca3af' : '#6b7280');
      root.style.setProperty('--color-secondary', isDarkMode ? '#d1d5db' : '#9ca3af');
      root.style.setProperty('--color-accent', isDarkMode ? '#f3f4f6' : '#e5e7eb');
    } else { // warm (default)
      root.style.setProperty('--color-primary', isDarkMode ? '#fbbf24' : '#f59e0b');
      root.style.setProperty('--color-secondary', isDarkMode ? '#fb923c' : '#ea580c');
      root.style.setProperty('--color-accent', isDarkMode ? '#f87171' : '#dc2626');
    }

    // Font sizes
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--font-size-base', fontSizes[fontSize]);

  }, [isDarkMode, colorScheme, fontSize]);

  const value = {
    isDarkMode,
    colorScheme,
    fontSize,
    toggleDarkMode,
    setColorScheme,
    setFontSize,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}