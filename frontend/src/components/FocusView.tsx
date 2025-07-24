import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSettingsStore } from '../store/useSettingsStore';
import NoteEditor from './NoteEditor';

// import { ListFiles } from '../../wailsjs/go/main/App';

/**
 * @component FocusView
 * @description Компонент-контейнер для центральной части приложения.
 * Адаптирован под новую архитектуру useSettingsStore.
 */
const FocusView: React.FC = () => {
	// ИСПРАВЛЕНИЕ: Используем getActiveDirectory вместо несуществующего rootDirectory.
	const activeDirectory = useSettingsStore((state) => state.getActiveDirectory());

	const [activeFile, setActiveFile] = useState<string | null>(null);
	const [files, setFiles] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		// ИСПРАВЛЕНИЕ: Логика теперь зависит от activeDirectory
		if (activeDirectory) {
			console.log('FocusView: Активный каталог установлен. Логика загрузки файлов будет реализована здесь.');
			// setIsLoading(true);
			// ListFiles(activeDirectory).then(setFiles).finally(() => setIsLoading(false));
		}
	}, [activeDirectory]); // ИСПРАВЛЕНИЕ: Зависимость от activeDirectory

	return (
		<Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
				{/* ИЗМЕНЕНИЕ: Текст локализован */}
				<Typography variant="h6">Область фокуса</Typography>
			</Box>
			<Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
				{activeFile ? (
					<NoteEditor filePath={activeFile} />
				) : (
					// ИЗМЕНЕНИЕ: Текст локализован
					<Typography color="text.secondary">
						Выберите заметку для редактирования. (Реализация списка файлов в разработке).
					</Typography>
				)}
			</Box>
		</Paper>
	);
};

export default FocusView;