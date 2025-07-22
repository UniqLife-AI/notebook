import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ApiKeyStore {
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
}

export const useApiKeyStore = create<ApiKeyStore>()(
  persist(
    (set) => ({
      apiKey: null,
      setApiKey: (key) => set({ apiKey: key }),
    }),
    {
      name: 'api-key-storage', // Ключ в localStorage
    }
  )
);