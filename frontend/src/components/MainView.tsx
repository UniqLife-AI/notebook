// File: frontend/src/components/MainView.tsx
// Намерение: Добавить лог, который покажет, какие именно `openViews`
// приходят в этот компонент для рендеринга.

import React from 'react';
import { Box, Typography, Tabs, Tab, IconButton } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { SourcesPanel } from './SourcesPanel';
import NoteEditor from "./NoteEditor";
import TerminalComponent from "./TerminalComponent";
import { useAppStore, View } from '../store/useAppStore';
import { ChatPanel } from './ChatPanel';

interface MainViewProps {
    isLogPanelVisible: boolean;
    onNewChat: () => void;
    onCloseView: (view: View) => void;
}

export const MainView = ({ isLogPanelVisible, onNewChat, onCloseView }: MainViewProps) => {
    const { openViews, activeViewId, setActiveView, sessions } = useAppStore();

    // ОТЛАДКА: Показываем, какие вкладки пришли в компонент для рендера.
    console.log(`[DEBUG][MainView] Рендеринг с openViews:`, openViews.map(v => v.id));

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveView(newValue);
    };

    const handleCloseClick = (e: React.MouseEvent, view: View) => {
        e.stopPropagation();
        onCloseView(view);
    };
    
    const activeView = openViews.find(v => v.id === activeViewId);

    return (
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
            <Box sx={{ width: '300px', flexShrink: 0 }}>
                <SourcesPanel />
            </Box>
            <PanelGroup direction="vertical">
                <Panel>
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                            <Tabs value={activeViewId || false} onChange={handleTabChange} variant="scrollable" sx={{ flexGrow: 1 }}>
                                {openViews.map(view => (
                                    <Tab
                                        key={view.id}
                                        value={view.id}
                                        label={
                                            <Box sx={{display: 'flex', alignItems: 'center'}}>
                                                {view.title}
                                                <IconButton size="small" onClick={(e) => handleCloseClick(e, view)} sx={{ml: 1}}>
                                                    <CloseIcon fontSize="inherit" />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                ))}
                            </Tabs>
                            <IconButton onClick={onNewChat} sx={{ ml: 1, mr: 1 }} title="Новый чат">
                                <AddIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{ flexGrow: 1, overflow: 'auto', position: 'relative' }}>
                            {activeView?.type === 'file' && <NoteEditor filePath={activeView.id} />}
                            {activeView?.type === 'chat' && sessions[activeView.id] && <ChatPanel sessionId={activeView.id} />}
                            {!activeViewId && (
                                <Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Typography color="text.secondary">
                                        Выберите файл из проводника или начните новый чат.
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </Panel>
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