'use client';

import { useCallback } from 'react';

// Local alias for OscillatorType to satisfy linting in environments
// where the DOM lib types may not be picked up by ESLint.
type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle' | 'custom';

export type GameSoundInput = {
  soundType: 'correct' | 'incorrect' | 'win' | 'hint' | 'click';
  intensity?: 'low' | 'medium' | 'high';
};

/**
 * Client-side sound player using Web Audio API
 */
class GameSoundPlayer {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (e) {
        console.error('Web Audio API is not supported in this browser.', e);
      }
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    volume = 0.3,
    type: OscillatorType = 'sine'
  ) {
    if (!this.audioContext || !this.isEnabled) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = type;

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.warn('Failed to play tone:', error);
    }
  }

  playCorrect(intensity: 'low' | 'medium' | 'high' = 'medium') {
    const volume = intensity === 'high' ? 0.4 : intensity === 'medium' ? 0.3 : 0.2;
    this.playTone(800, 0.3, volume, 'sine');
  }

  playIncorrect(intensity: 'low' | 'medium' | 'high' = 'medium') {
    const volume = intensity === 'high' ? 0.4 : intensity === 'medium' ? 0.3 : 0.2;
    this.playTone(400, 0.3, volume, 'sine');
  }

  playWin(intensity: 'low' | 'medium' | 'high' = 'medium') {
    const volume = intensity === 'high' ? 0.5 : intensity === 'medium' ? 0.4 : 0.3;
    // Play celebratory arpeggio
    [600, 800, 1000, 1200].forEach((frequency, index) => {
      setTimeout(() => {
        this.playTone(frequency, 0.15, volume, 'sine');
      }, index * 150);
    });
  }

  playHint(intensity: 'low' | 'medium' | 'high' = 'medium') {
    const volume = intensity === 'high' ? 0.3 : intensity === 'medium' ? 0.2 : 0.1;
    this.playTone(600, 0.2, volume, 'sine');
  }

  playClick(intensity: 'low' | 'medium' | 'high' = 'medium') {
    const volume = intensity === 'high' ? 0.2 : intensity === 'medium' ? 0.15 : 0.1;
    this.playTone(300, 0.1, volume, 'sine');
  }

  playSound(
    soundType: GameSoundInput['soundType'],
    intensity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    switch (soundType) {
      case 'correct':
        this.playCorrect(intensity);
        break;
      case 'incorrect':
        this.playIncorrect(intensity);
        break;
      case 'win':
        this.playWin(intensity);
        break;
      case 'hint':
        this.playHint(intensity);
        break;
      case 'click':
        this.playClick(intensity);
        break;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // Resume audio context if it was suspended (common in browsers)
  async resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
}

// Singleton instance
export const gameSoundPlayer = new GameSoundPlayer();

/**
 * React Hook for using game sounds in components
 */
export function useGameSounds() {
  const playSound = useCallback(
    (
      soundType: GameSoundInput['soundType'],
      intensity: 'low' | 'medium' | 'high' = 'medium'
    ) => {
      gameSoundPlayer.playSound(soundType, intensity);
    },
    []
  );

  const setSoundsEnabled = useCallback((enabled: boolean) => {
    gameSoundPlayer.setEnabled(enabled);
  }, []);

  const resumeAudio = useCallback(async () => {
    await gameSoundPlayer.resume();
  }, []);

  return {
    playSound,
    setSoundsEnabled,
    resumeAudio,
  };
}
