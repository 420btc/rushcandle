import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Sound objects
let sounds: { [key: string]: Audio.Sound } = {};

// Sound URLs
const soundUrls = {
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-click-tone-1112.mp3',
  success: 'https://assets.mixkit.co/sfx/preview/mixkit-game-success-alert-2039.mp3',
  failure: 'https://assets.mixkit.co/sfx/preview/mixkit-game-over-trombone-1940.mp3',
  coin: 'https://assets.mixkit.co/sfx/preview/mixkit-coin-win-notification-1992.mp3',
  achievement: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
  countdown: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-countdown-922.mp3'
};

// Load all sounds
export const loadSounds = async (): Promise<void> => {
  try {
    // Skip loading sounds on web for now as it can cause issues
    if (Platform.OS === 'web') {
      console.log('Skipping sound loading on web platform');
      return;
    }
    
    // Load each sound
    for (const [key, url] of Object.entries(soundUrls)) {
      const { sound } = await Audio.Sound.createAsync({ uri: url }, { shouldPlay: false });
      sounds[key] = sound;
    }
    
    console.log('All sounds loaded successfully');
  } catch (error) {
    console.error('Error loading sounds:', error);
  }
};

// Play a sound
export const playSound = async (soundName: keyof typeof soundUrls): Promise<void> => {
  try {
    // Skip playing sounds on web for now
    if (Platform.OS === 'web') {
      console.log(`Skipping playing sound ${soundName} on web platform`);
      return;
    }
    
    // Check if sound is loaded
    if (!sounds[soundName]) {
      console.log(`Sound ${soundName} not loaded, loading now...`);
      const { sound } = await Audio.Sound.createAsync({ uri: soundUrls[soundName] }, { shouldPlay: false });
      sounds[soundName] = sound;
    }
    
    // Reset the sound to the beginning
    await sounds[soundName].setPositionAsync(0);
    
    // Play the sound
    await sounds[soundName].playAsync();
  } catch (error) {
    console.error(`Error playing sound ${soundName}:`, error);
  }
};

// Unload all sounds to free up resources
export const unloadSounds = async (): Promise<void> => {
  try {
    // Skip on web
    if (Platform.OS === 'web') {
      return;
    }
    
    for (const sound of Object.values(sounds)) {
      await sound.unloadAsync();
    }
    
    // Clear the sounds object
    sounds = {};
    
    console.log('All sounds unloaded');
  } catch (error) {
    console.error('Error unloading sounds:', error);
  }
};
