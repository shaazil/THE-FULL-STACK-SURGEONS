// utils/apiKeyManager.ts
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Type to represent configuration values (keys and URLs)
type ConfigValue = string;

// Check if we're running on web platform
const isWeb = Platform.OS === 'web';

// Function to get config values from secure storage with fallback to app.config.js
export async function getConfigValue(configName: string): Promise<ConfigValue> {
  try {
    // For web, try to get directly from process.env via Constants
    if (isWeb) {
      // First try to get from Constants.expoConfig.extra
      const configValue = getValueFromConfig(configName);
      if (configValue) {
        console.log(`[apiKeyManager] Found ${configName} in app config`);
        return configValue;
      }
      
      // If we still don't have a value, check if we have a public Expo variable
      const publicVarName = `EXPO_PUBLIC_${configName}`;
      // @ts-ignore - Access to process.env
      if (process.env && process.env[publicVarName]) {
        // @ts-ignore - Access to process.env
        const publicValue = process.env[publicVarName];
        console.log(`[apiKeyManager] Found ${configName} in public env vars`);
        return publicValue;
      }
      
      // For OpenAI specifically, try the hardcoded value from .env
      if (configName === 'OPENAI_API_KEY') {
        const openAIKey = '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';
        console.log('[apiKeyManager] Using hardcoded OpenAI key');
        return openAIKey;
      }
      
      // For Gemini specifically, try the hardcoded value from .env
      if (configName === 'GEMINI_API_KEY') {
        const geminiKey = 'AIzaSyCcND3qfnjp47PD3upHnBImNlBTUnIROVY';
        console.log('[apiKeyManager] Using hardcoded Gemini key');
        return geminiKey;
      }
    } else {
      // For native platforms, try SecureStore first
      try {
        const storedValue = await SecureStore.getItemAsync(configName);
        if (storedValue) {
          console.log(`[apiKeyManager] Found ${configName} in secure storage`);
          return storedValue;
        }
      } catch (secureStoreError) {
        console.warn(`[apiKeyManager] SecureStore error for ${configName}:`, secureStoreError);
        // Continue to fallbacks
      }
    }

    // Common fallback for all platforms: try to get from app.config.js
    const configValue = getValueFromConfig(configName);
    if (configValue) {
      console.log(`[apiKeyManager] Found ${configName} in app config (fallback)`);
      return configValue;
    }

    // If we still don't have a value, throw an error
    console.error(`[apiKeyManager] ${configName} not found in any source`);
    throw new Error(`${configName} not configured. Please set in .env file or secure storage.`);
  } catch (error) {
    if (error instanceof Error) {
      // Check if this is just a "value not found" error from our own code
      if (error.message.includes('not configured')) {
        throw error;
      }
      
      // For other errors, try the fallback
      const configValue = getValueFromConfig(configName);
      if (configValue) {
        console.log(`[apiKeyManager] Found ${configName} in app config (error fallback)`);
        return configValue;
      }
      
      // If all else fails, throw a clear error
      console.error(`[apiKeyManager] Failed to get ${configName}:`, error);
      throw new Error(`${configName} not configured. Please set in .env file or secure storage.`);
    }
    throw error;
  }
}

// Helper function to save config value to secure storage
export async function saveConfigValue(configName: string, value: ConfigValue): Promise<void> {
  try {
    if (!isWeb) {
      await SecureStore.setItemAsync(configName, value);
      console.log(`[apiKeyManager] Saved ${configName} to secure storage`);
    } else {
      console.warn(`[apiKeyManager] Cannot save ${configName} on web platform`);
    }
  } catch (error) {
    console.error(`[apiKeyManager] Error saving ${configName} to secure storage:`, error);
    throw error;
  }
}

// Helper function to extract values from app.config.js
function getValueFromConfig(configName: string): ConfigValue {
  try {
    // Debug what's available in Constants
    if (isWeb && configName === 'OPENAI_API_KEY') {
      console.log('[apiKeyManager] Constants.expoConfig?.extra:', Constants.expoConfig?.extra);
    }
    
    switch (configName) {
      // API Keys
      case 'OPENAI_API_KEY':
        return Constants.expoConfig?.extra?.OPENAI_API_KEY || '';
      case 'GEMINI_API_KEY':
        return Constants.expoConfig?.extra?.GEMINI_API_KEY || Constants.expoConfig?.extra?.EXPO_PUBLIC_GEMINI_API_KEY || '';
        
      // URLs
      case 'SUPABASE_URL':
        return Constants.expoConfig?.extra?.supabaseUrl || '';
      case 'SUPABASE_KEY':
        return Constants.expoConfig?.extra?.supabaseKey || '';
      case 'OPENAI_API_URL':
        return 'https://api.openai.com/v1';
      case 'GEMINI_API_URL':
        return 'https://generativelanguage.googleapis.com/v1';
      
      // Add other config values as needed
      default:
        return '';
    }
  } catch (error) {
    console.warn(`[apiKeyManager] Error accessing ${configName} from config:`, error);
    return '';
  }
}

// Export specific getters for cleaner imports elsewhere
export async function getOpenAIKey(): Promise<string> {
  return getConfigValue('OPENAI_API_KEY');
}

export async function getGeminiKey(): Promise<string> {
  return getConfigValue('GEMINI_API_KEY');
}

export async function getSupabaseUrl(): Promise<string> {
  return getConfigValue('SUPABASE_URL');
}

export async function getSupabaseKey(): Promise<string> {
  return getConfigValue('SUPABASE_KEY');
}

export async function getOpenAIUrl(): Promise<string> {
  return getConfigValue('OPENAI_API_URL');
}

export async function getGeminiUrl(): Promise<string> {
  return getConfigValue('GEMINI_API_URL');
}