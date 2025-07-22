import { create } from 'zustand';

// @comment: Это тип данных, который точно соответствует нашей Go-структуре FileInfo.
export interface FileInfo {
  name: string;
  isDirectory: boolean;
  path: string;
}

interface FileStoreState {
  files: FileInfo[];
  activeFilePath: string | null;
  setFiles: (files: FileInfo[]) => void;
  setActiveFilePath: (path: string | null) => void;
}

/**
 * @store useFileStore
 * @description Этот стор отвечает исключительно за управление списком файлов
 * и отслеживание активного (выбранного) файла.
 */
export const useFileStore = create<FileStoreState>((set) => ({
  files: [],
  activeFilePath: null,
  setFiles: (files) => set({ files }),
  setActiveFilePath: (path) => set({ activeFilePath: path }),
}));