import React, { useEffect, useState } from 'react';
import {
	Box, Typography, List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, Divider, IconButton, Tooltip, Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import SwitchAccountOutlinedIcon from '@mui/icons-material/SwitchAccountOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

import { useSettingsStore } from '../store/useSettingsStore';
import { useFileStore, FileInfo } from '../store/useFileStore';
import { useViewStore } from '../store/useViewStore';
import { ListFiles, SelectDirectory } from '../../wailsjs/go/main/App';

export const SourcesPanel: React.FC = () => {
	// ИСПРАВЛЕНИЕ: Явно получаем workspaceDir, чтобы отслеживать его изменения
	const { projectDir, workspaceDir, getActiveDirectory, setProjectDir, setWorkspaceDir } = useSettingsStore();
	const activeDirectory = getActiveDirectory();

	const { files, setFiles } = useFileStore();
	const { activeTabId, setOpenFile } = useViewStore();
	const [isLoading, setIsLoading] = useState(false);
	const [showAllFiles, setShowAllFiles] = useState(false);

	// ИСПРАВЛЕНИЕ 1: Список зависимостей теперь явно отслеживает и projectDir, и workspaceDir.
	// Это гарантирует, что эффект перезапустится при смене любого из каталогов.
	useEffect(() => {
		const currentActiveDir = getActiveDirectory();
		if (currentActiveDir) {
			setIsLoading(true);
			ListFiles(currentActiveDir)
				.then((fileList) => {
					const sorted = fileList.sort((a, b) => {
						if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
						return a.name.localeCompare(b.name);
					});
					setFiles(sorted);
				})
				.catch((error) => console.error('Ошибка получения списка файлов:', error))
				.finally(() => setIsLoading(false));
		} else {
			setFiles([]);
		}
	}, [projectDir, workspaceDir, setFiles, getActiveDirectory]);

	const handleFileClick = (file: FileInfo) => {
		if (!file.isDirectory) {
			setOpenFile(file.path);
		}
	};

	const handleCloseProject = () => {
		setProjectDir(null);
		useViewStore.getState().closeOpenFile();
	};

	// ИСПРАВЛЕНИЕ 2: Обработчики теперь передают текущий каталог в бэкенд,
	// чтобы диалог открывался в релевантной папке.
	const handleOpenProject = async () => {
		try {
			// Открываем диалог в текущем активном каталоге
			const path = await SelectDirectory(activeDirectory || '');
			if (path) {
				setProjectDir(path);
			}
		} catch (error) {
			console.error('Ошибка выбора каталога проекта:', error);
		}
	};

	const handleChangeWorkspace = async () => {
		try {
			// Открываем диалог в текущем основном каталоге
			const path = await SelectDirectory(workspaceDir || '');
			if (path) {
				setWorkspaceDir(path);
			}
		} catch (error) {
			console.error('Ошибка выбора основного каталога:', error);
		}
	};
	
	const filteredFiles = files.filter(file =>
		showAllFiles || file.isDirectory || file.name.toLowerCase().endsWith('.md')
	);

	return (
		<Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>
					{projectDir ? 'Проводник Проекта' : 'Проводник Workspace'}
				</Typography>
				<Box>
					<Tooltip title="Сменить основной каталог (Workspace)">
						<IconButton onClick={handleChangeWorkspace} size="small">
							<SwitchAccountOutlinedIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Открыть проект">
						<IconButton onClick={handleOpenProject} size="small">
							<FolderOpenOutlinedIcon />
						</IconButton>
					</Tooltip>
					<Tooltip title="Закрыть проект">
						<span>
							<IconButton onClick={handleCloseProject} size="small" disabled={!projectDir}>
								<LogoutIcon />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title={showAllFiles ? "Показать только Markdown" : "Показать все файлы"}>
						<IconButton onClick={() => setShowAllFiles(!showAllFiles)} size="small">
							{showAllFiles ? <FilterListOffIcon /> : <FilterListIcon />}
						</IconButton>
					</Tooltip>
				</Box>
			</Box>
			{activeDirectory && (
				<Chip label={activeDirectory} size="small" sx={{ maxWidth: '100%', mb: 1, justifyContent: 'flex-start', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
			)}
			<Divider sx={{ my: 1 }} />
			
			<Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
				{isLoading ? <Typography sx={{ p: 2, color: 'text.secondary' }}>Загрузка...</Typography> : (
					<List dense>
						{filteredFiles.map((file) => (
							<ListItem key={file.path} disablePadding>
								<ListItemButton
									selected={file.path === activeTabId}
									onClick={() => handleFileClick(file)}
									disabled={file.isDirectory}
								>
									<ListItemIcon sx={{ minWidth: '32px' }}>
										{file.isDirectory ? <FolderIcon fontSize="small" /> : <ArticleOutlinedIcon fontSize="small" />}
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