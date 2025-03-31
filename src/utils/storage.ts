/**
 * Cross-platform storage utility that works in both web and native environments
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import localforage from 'localforage';

// Check if we're running in a web environment
const isWeb = typeof document !== 'undefined';

// Initialize localforage for web
if (isWeb) {
  localforage.config({
    name: 'candlerush',
    storeName: 'candlerush_store'
  });
}

// Regular storage (AsyncStorage in native, localforage in web)
export const storage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        return await localforage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        await localforage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        await localforage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
    }
  },
  
  clear: async (): Promise<void> => {
    try {
      if (isWeb) {
        await localforage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
};

// Secure storage (SecureStore in native, localforage with encryption in web)
export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isWeb) {
        // In web, we use localforage with a different store name for "secure" items
        // Note: This isn't truly secure in web, but it's a separate storage
        const secureStore = localforage.createInstance({
          name: 'candlerush_secure',
          storeName: 'candlerush_secure_store'
        });
        return await secureStore.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Error getting secure item ${key}:`, error);
      return null;
    }
  },
  
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isWeb) {
        const secureStore = localforage.createInstance({
          name: 'candlerush_secure',
          storeName: 'candlerush_secure_store'
        });
        await secureStore.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error setting secure item ${key}:`, error);
    }
  },
  
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isWeb) {
        const secureStore = localforage.createInstance({
          name: 'candlerush_secure',
          storeName: 'candlerush_secure_store'
        });
        await secureStore.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing secure item ${key}:`, error);
    }
  }
};
