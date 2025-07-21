// File Name: src/components/SourcesPanel.tsx

import { Box, Button, Typography, Chip, Divider, IconButton, Tooltip, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloseIcon from '@mui/icons-material/Close';
import FunctionsIcon from '@mui/icons-material/Functions';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import React from 'react';
import { useChatSessionStore } from '@/store/useChatSessionStore';
import { fileSystemService } from '@/services/FileSystemService';

export const SourcesPanel = ({ children }: { children: React.ReactNode }) => {
    const { 
        sessions, 
        activeSessionId, 
        setActiveSessionId, 
        isProjectOpen, 
        projectName, 
        openProject, 
        closeProject, 
        loadSessions, 
        addFileToContext 
    } = useChatSessionStore();

    const { setProjectFileTreeContext, projectFileTreeContext } = useChatSessionStore(state => ({
        setProjectFileTreeContext: state.setProjectFileTreeContext,
        projectFileTreeContext: state.projectFileTreeContext
    }));

    const handleScanProject = async () => {
        const tree = await fileSystemService.getProjectFileTree();
        if (tree) {
            setProjectFileTreeContext(tree);
        }
    };
    
    const handleChangeRootDirectory = async () => {
        const handle = await fileSystemService.promptAndSetDirectory();
        if (handle) {
            await loadSessions();
        }
    };
    
    const handleAddFileToContext = async (fileName: string) => {
        try {
            const content = await fileSystemService.readFile(fileName);
            addFileToContext({ fileName, content });
        } catch (error) {
            console.error(`Failed to read file ${fileName} for context:`, error);
        }
    };

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Контекст</Typography>
                <Box>
                    <Tooltip title="Сменить корневую папку">
                         <IconButton onClick={handleChangeRootDirectory} size="small">
                            <DriveFolderUploadIcon />
                        </IconButton>
                    </Tooltip>
                    {children}
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
                <Button fullWidth variant="outlined" startIcon={<FolderOpenIcon />} sx={{ borderColor: '#e0e0e0', color: 'text.primary', justifyContent: 'flex-start' }} onClick={openProject}>
                    Открыть проект...
                </Button>

                {isProjectOpen && (
                    <Button fullWidth variant={projectFileTreeContext ? "contained" : "outlined"} startIcon={<FunctionsIcon />} sx={{ borderColor: '#e0e0e0', color: projectFileTreeContext ? 'white' : 'text.primary', justifyContent: 'flex-start' }} onClick={handleScanProject}>
                        {projectFileTreeContext ? "Контекст загружен" : "Загрузить контекст"}
                    </Button>
                )}
                
                {isProjectOpen && projectName && (
                    <Box>
                        <Chip label={`Проект: ${projectName}`} onDelete={closeProject} deleteIcon={<CloseIcon />} color="primary" variant="outlined" sx={{ maxWidth: '100%', mt: 1 }} />
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <Typography variant="overline" color="text.secondary">Файлы</Typography>
                <List dense>
                    {sessions.map((session) => (
                        <ListItem 
                            key={session.id} 
                            disablePadding
                            secondaryAction={
                                <Tooltip title="Добавить в контекст">
                                    <IconButton edge="end" onClick={() => handleAddFileToContext(session.id)}>
                                        <AddCircleOutlineIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            }
                        >
                            <ListItemButton
                                selected={session.id === activeSessionId}
                                onClick={() => setActiveSessionId(session.id)}
                            >
                                <ListItemIcon sx={{minWidth: '32px'}}>
                                    <ArticleOutlinedIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={session.label} 
                                    primaryTypographyProps={{ style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Box>
    );
};