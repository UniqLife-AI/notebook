import React from 'react';
import { Box, Typography } from "@mui/material";
// Импорт компонентов для изменяемых панелей
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

// Импортируем наши главные компоненты для панелей
import { SourcesPanel } from './SourcesPanel';
import NoteEditor from "./NoteEditor";
import TerminalComponent from "./TerminalComponent"; // Импортируем терминал

// Импортируем наш стор, чтобы знать, какой файл активен
import { useFileStore } from '../store/useFileStore';

/**
 * @interface MainViewProps
 * @description Интерфейс расширен, чтобы явно указать на использование `isLogPanelVisible`.
 */
interface MainViewProps {
	isLogPanelVisible: boolean; // Этот флаг будет управлять отображением терминала
	onToggleLogPanel: () => void;
	onOpenSettings: () => void;
	onNewChat: () => void;
}

/**
 * @component MainView
 * @description Компонент перестроен для поддержки трехпанельного интерфейса.
 * - Слева: `SourcesPanel`.
 * - Справа: Вертикальная группа панелей.
 * - Верхняя панель: `NoteEditor` или приветствие.
 * - Нижняя панель: `TerminalComponent`, чей размер можно изменять.
 * Отображение терминала управляется пропом `isLogPanelVisible`.
 */
export const MainView = ({ isLogPanelVisible }: MainViewProps) => {
	// Мы по-прежнему получаем активный файл из глобального хранилища.
	const activeFilePath = useFileStore((state) => state.activeFilePath);

	return (
		// Главный контейнер, который использует Flexbox для расположения панелей в ряд.
		<Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
			
			{/* Левая панель: Наш файловый проводник */}
			<Box sx={{ width: '300px', flexShrink: 0 }}>
				<SourcesPanel />
			</Box>

			{/* Правая часть: Вертикальная группа с редактором и терминалом */}
			<PanelGroup direction="vertical">
				{/* Верхняя панель: Редактор или сообщение-заглушка */}
				<Panel>
					<Box sx={{ height: '100%', overflow: 'auto', p: 2 }}>
						{activeFilePath ? (
							// Если пользователь кликнул на файл, показываем редактор.
							<NoteEditor filePath={activeFilePath} />
						) : (
							// Если файл еще не выбран, показываем приветствие.
							<Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
								<Typography color="text.secondary">
									Select a file from the explorer panel to view or edit it.
								</Typography>
							</Box>
						)}
					</Box>
				</Panel>

				{/* Если флаг `isLogPanelVisible` true, показываем разделитель и панель терминала */}
				{isLogPanelVisible && (
					<>
						<PanelResizeHandle style={{ height: '4px', background: '#333', borderTop: '1px solid #444', borderBottom: '1px solid #444' }} />
						<Panel defaultSize={30} minSize={10} collapsible>
							<TerminalComponent />
						</Panel>
					</>
				)}
			</PanelGroup>

		</Box>
	);
};