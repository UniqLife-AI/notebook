import React, { useEffect, useState } from 'react';
import {
	Box,
	Typography,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Divider,
	IconButton,
	Tooltip,
	Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';

// ИМПОРТЫ НОВОЙ АРХИТЕКТУРЫ
import { useSettingsStore } from '../store/useSettingsStore';
import { useFileStore, FileInfo } from '../store/useFileStore';
import { ListFiles } from '../../wailsjs/go/main/App';

/**
 * @component SourcesPanel
 * @description Полностью переписанная панель для отображения файлов.
 * - Использует `useSettingsStore` для получения корневой директории.
 * - Использует `useFileStore` для хранения списка файлов и активного файла.
 * - Вызывает Go-функцию `ListFiles` для получения данных.
 * - Старая логика (useChatSessionStore, fileSystemService) полностью удалена.
 */
export const SourcesPanel: React.FC = () => {
	// Получаем данные из наших новых, правильных хранилищ
	const { rootDirectory, setRootDirectory } = useSettingsStore();
	const { files, setFiles, activeFilePath, setActiveFilePath } = useFileStore();
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * @effect Загрузка списка файлов
	 * @description Срабатывает, когда `rootDirectory` изменяется.
	 * Вызывает Go-функцию `ListFiles` и сохраняет результат в `useFileStore`.
	 */
	useEffect(() => {
		if (rootDirectory) {
			setIsLoading(true);
			ListFiles(rootDirectory)
				.then((fileList) => {
					// Сортируем: сначала папки, потом файлы, все по алфавиту
					const sorted = fileList.sort((a, b) => {
						if (a.isDirectory !== b.isDirectory) {
							return a.isDirectory ? -1 : 1;
						}
						return a.name.localeCompare(b.name);
					});
					setFiles(sorted);
				})
				.catch((error) => {
					console.error('Failed to list files:', error);
					setFiles([]); // В случае ошибки показываем пустой список
				})
				.finally(() => {
					setIsLoading(false);
				});
		} else {
			// Если директория не выбрана (например, после "закрытия" проекта), очищаем список
			setFiles([]);
		}
	}, [rootDirectory, setFiles]);

	/**
	 * @handler handleFileClick
	 * @description Обрабатывает клик по файлу в списке.
	 * Устанавливает его как активный, только если это не директория.
	 */
	const handleFileClick = (file: FileInfo) => {
		if (!file.isDirectory) {
			setActiveFilePath(file.path);
		}
		// TODO: В будущем можно добавить логику для раскрытия директорий
	};

	/**
	 * @handler handleCloseProject
	 * @description "Закрывает" проект, очищая корневую директорию.
	 * Это приведет к отображению `SetupDirectoryDialog` в `App.tsx`.
	 */
	const handleCloseProject = () => {
		setActiveFilePath(null);
		setRootDirectory('');
	};

	return (
		<Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					Explorer
				</Typography>
				<Tooltip title="Close Project">
					<IconButton onClick={handleCloseProject} size="small">
						<LogoutIcon />
					</IconButton>
				</Tooltip>
			</Box>

			{rootDirectory && (
				<Chip
					label={rootDirectory}
					size="small"
					sx={{ maxWidth: '100%', mb: 1, justifyContent: 'flex-start', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }}
				/>
			)}

			<Divider sx={{ my: 1 }} />

			<Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
				{isLoading ? (
					<Typography sx={{ p: 2, color: 'text.secondary' }}>Loading...</Typography>
				) : (
					<List dense>
						{files.map((file) => (
							<ListItem key={file.path} disablePadding>
								<ListItemButton
									selected={file.path === activeFilePath}
									onClick={() => handleFileClick(file)}
									// Директории делаем некликабельными для выбора
									disabled={file.isDirectory}
								>
									<ListItemIcon sx={{ minWidth: '32px' }}>
										{file.isDirectory ? (
											<FolderIcon fontSize="small" />
										) : (
											<ArticleOutlinedIcon fontSize="small" />
										)}
									</ListItemIcon>
									<ListItemText
										primary={file.name}
										primaryTypographyProps={{ style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}
									/>
								</ListItemButton>
							</ListItem>
						))}
					</List>
				)}
			</Box>
		</Box>
	);
};