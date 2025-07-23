import React, { useEffect, useState } from 'react';
import {
	Box, Typography, List, ListItem, ListItemButton, ListItemIcon,
	ListItemText, Divider, IconButton, Tooltip, Chip,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';

import { useSettingsStore } from '../store/useSettingsStore';
import { useFileStore, FileInfo } from '../store/useFileStore';
import { useViewStore } from '../store/useViewStore';
import { useChatSessionStore } from '../store/useChatSessionStore'; // <-- ВОТ НЕДОСТАЮЩИЙ ИМПОРТ
import { ListFiles } from '../../wailsjs/go/main/App';

export const SourcesPanel: React.FC = () => {
	const { rootDirectory, setRootDirectory } = useSettingsStore();
	const { files, setFiles } = useFileStore();
	const { activeTabId, setOpenFile } = useViewStore();
	const [isLoading, setIsLoading] = useState(false);
	const [showAllFiles, setShowAllFiles] = useState(false);

	useEffect(() => {
		if (rootDirectory) {
			setIsLoading(true);
			ListFiles(rootDirectory)
				.then((fileList) => {
					const sorted = fileList.sort((a, b) => {
						if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
						return a.name.localeCompare(b.name);
					});
					setFiles(sorted);
				})
				.catch((error) => console.error('Failed to list files:', error))
				.finally(() => setIsLoading(false));
		} else {
			setFiles([]);
		}
	}, [rootDirectory, setFiles]);

	const handleFileClick = (file: FileInfo) => {
		if (!file.isDirectory) {
			setOpenFile(file.path);
		}
	};

	const handleCloseProject = () => {
		setRootDirectory('');
		useViewStore.getState().closeOpenFile();
		useChatSessionStore.getState().setActiveSessionId(null);
	};
	
	const filteredFiles = files.filter(file =>
		showAllFiles || file.isDirectory || file.name.toLowerCase().endsWith('.md')
	);

	return (
		<Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid', borderColor: 'divider' }}>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
				<Typography variant="h6" sx={{ fontWeight: 600 }}>Explorer</Typography>
				<Box>
					<Tooltip title={showAllFiles ? "Show only Markdown files" : "Show all files"}>
						<IconButton onClick={() => setShowAllFiles(!showAllFiles)} size="small">
							{showAllFiles ? <FilterListOffIcon /> : <FilterListIcon />}
						</IconButton>
					</Tooltip>
					<Tooltip title="Close Project">
						<IconButton onClick={handleCloseProject} size="small"><LogoutIcon /></IconButton>
					</Tooltip>
				</Box>
			</Box>
			{rootDirectory && (
				<Chip label={rootDirectory} size="small" sx={{ maxWidth: '100%', mb: 1, justifyContent: 'flex-start', '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' } }} />
			)}
			<Divider sx={{ my: 1 }} />
			
			<Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
				{isLoading ? <Typography sx={{ p: 2, color: 'text.secondary' }}>Loading...</Typography> : (
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