import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PersistedSettings {
	workspaceDir: string | null;
	setWorkspaceDir: (path: string) => void;
	clearWorkspaceDir: () => void;
}

interface SettingsState extends PersistedSettings {
	projectDir: string | null;
	setProjectDir: (path: string | null) => void;
	getActiveDirectory: () => string | null;
}

export const useSettingsStore = create<SettingsState>()(
	persist(
		(set, get) => ({
			workspaceDir: null,
			/**
			 * @function setWorkspaceDir
			 * @description Устанавливает новый основной каталог и автоматически
			 * закрывает любой открытый проект, чтобы избежать конфликтов.
			 */
			setWorkspaceDir: (path: string) => set({ workspaceDir: path, projectDir: null }),
			
			/**
			 * @function clearWorkspaceDir
			 * @description Полностью сбрасывает основной каталог, возвращая
			 * пользователя на экран первоначальной настройки.
			 */
			clearWorkspaceDir: () => set({ workspaceDir: null, projectDir: null }),

			projectDir: null,
			setProjectDir: (path: string | null) => set({ projectDir: path }),

			getActiveDirectory: () => {
				const { projectDir, workspaceDir } = get();
				return projectDir || workspaceDir;
			},
		}),
		{
			name: 'app-settings-storage',
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({ 
				workspaceDir: state.workspaceDir,
			}),
		}
	)
);