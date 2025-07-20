import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatSettings {
  model: string;
  temperature: number;
  setModel: (model: string) => void;
  setTemperature: (temp: number) => void;
}

export const useChatSettingsStore = create<ChatSettings>()(
  persist(
    (set) => ({
      model: 'gemini-1.5-flash-latest', // Начнем с более быстрой модели
      temperature: 0.7,
      setModel: (model) => set({ model }),
      setTemperature: (temp) => set({ temperature: temp }),
    }),
    {
      name: 'chat-settings-storage',
    }
  )
);