// File Name: src/store/useSettingsStore.ts

import { create } from 'zustand';

interface SettingsState {
  isInitialized: boolean;
  needsSetup: boolean;
  setInitialized: (status: boolean) => void;
  setNeedsSetup: (status: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isInitialized: false, // Изначально приложение не инициализировано
  needsSetup: false,    // Изначально мы не знаем, нужна ли настройка
  setInitialized: (status) => set({ isInitialized: status }),
  setNeedsSetup: (status) => set({ needsSetup: status }),
}));