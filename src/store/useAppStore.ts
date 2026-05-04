import { create } from 'zustand'

interface AppState {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activeCollectionId: string | null;
  activeRequestId: string | null;
  activeEnvId: string | null;
  setActiveIds: (collectionId: string | null, requestId: string | null) => void;
  setEnvId: (envId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  activeCollectionId: null,
  activeRequestId: null,
  activeEnvId: null,
  setActiveIds: (collectionId, requestId) => set({ activeCollectionId: collectionId, activeRequestId: requestId }),
  setEnvId: (envId) => set({ activeEnvId: envId }),
}))
