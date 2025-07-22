import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SettingsState {
  rootDirectory: string | null;
  setRootDirectory: (path: string) => void;
  clearRootDirectory: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      rootDirectory: null,
      setRootDirectory: (path: string) => set({ rootDirectory: path }),
      clearRootDirectory: () => set({ rootDirectory: null }),
    }),
    {
      name: 'app-settings-storage', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);