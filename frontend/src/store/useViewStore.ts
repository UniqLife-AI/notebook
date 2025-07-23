import { create } from 'zustand';

interface ViewState {
  openFilePath: string | null;      // Какой файл сейчас открыт во вкладке
  activeTabId: string | null;       // ID активной вкладки (может быть путем к файлу или ID сессии)
  
  // Действия
  setOpenFile: (path: string) => void;
  closeOpenFile: () => void;
  setActiveTab: (id: string | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  openFilePath: null,
  activeTabId: null,
  
  setOpenFile: (path) => set({ openFilePath: path, activeTabId: path }),
  
  closeOpenFile: () => set(state => ({
    openFilePath: null,
    // Если активной была вкладка файла, сбрасываем ее
    activeTabId: state.activeTabId === state.openFilePath ? null : state.activeTabId,
  })),

  setActiveTab: (id) => set({ activeTabId: id }),
}));