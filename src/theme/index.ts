import { DefaultTheme } from 'react-native-paper';

// Medical-themed color palette
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#0077CC', // Medical blue
    accent: '#44C8B5', // Teal
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#333333',
    error: '#D32F2F',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
  },
  roundness: 8,
  fonts: {
    ...DefaultTheme.fonts,
  },
};

export default theme;