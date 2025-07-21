// File Name: src/components/FocusView.tsx

"use client";
import { useEffect, useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import { SourcesPanel } from "./SourcesPanel";
import { DraftPanel } from "./DraftPanel";
import { Box, IconButton, CircularProgress } from "@mui/material";
import { AppHeader } from './AppHeader';
import { CollapsedPanel } from './CollapsedPanel';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import { useSettingsStore } from '@/store/useSettingsStore';
import { fileSystemService } from '@/services/FileSystemService';
import { SetupDirectoryDialog } from './SetupDirectoryDialog';
import { LogPanel } from './LogPanel';
import { ChatSettingsDialog } from './ChatSettingsDialog';
import { CommandPalette } from './CommandPalette';
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore';
import { NewChatDialog } from './NewChatDialog';
import { useChatSessionStore } from '@/store/useChatSessionStore';
import { MainView } from './MainView';

export default function FocusView() {
    const leftPanelRef = useRef<ImperativePanelHandle>(null);
    const rightPanelRef = useRef<ImperativePanelHandle>(null);
    const logPanelRef = useRef<ImperativePanelHandle>(null);

    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);
    const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

    const { isInitialized, needsSetup, setInitialized, setNeedsSetup } = useSettingsStore();
    const { toggle: toggleCommandPalette } = useCommandPaletteStore();
    // ИЗМЕНЕНИЕ: Получаем loadSessions здесь
    const { createNewSession, loadSessions } = useChatSessionStore();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                toggleCommandPalette();
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, [toggleCommandPalette]);


    useEffect(() => {
        const initializeApp = async () => {
            const success = await fileSystemService.initialize();
            if (success) {
                setNeedsSetup(false);
                // ИЗМЕНЕНИЕ: Загружаем сессии только после успешной инициализации
                await loadSessions(); 
            } else {
                setNeedsSetup(true);
            }
            setInitialized(true);
        };
        initializeApp();
    // Добавляем loadSessions в массив зависимостей
    }, [setInitialized, setNeedsSetup, loadSessions]);
    
    const handleToggleLogPanel = () => {
        const panel = logPanelRef.current;
        if (!panel) return;
        if (isLogPanelVisible) {
            panel.collapse();
        } else {
            panel.expand();
        }
    };

    const handleLeftAction = () => {
        const panel = leftPanelRef.current;
        if (!panel) return;
        panel.isCollapsed() ? panel.expand() : panel.collapse();
    };

    const handleRightAction = () => {
        const panel = rightPanelRef.current;
        if (!panel) return;
        panel.isCollapsed() ? panel.expand() : panel.collapse();
    };

    if (!isInitialized) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (needsSetup) {
        return <SetupDirectoryDialog />;
    }

    return (
        <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />
            <ChatSettingsDialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <NewChatDialog open={isNewChatDialogOpen} onClose={() => setIsNewChatDialogOpen(false)} onCreate={createNewSession} />
            <CommandPalette onOpenSettings={() => setIsSettingsOpen(true)} onNewChat={() => setIsNewChatDialogOpen(true)} />

            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <PanelGroup direction="horizontal">
                    <Panel ref={leftPanelRef} defaultSize={20} minSize={15} collapsible={true} collapsedSize={5} onCollapse={() => setIsLeftCollapsed(true)} onExpand={() => setIsLeftCollapsed(false)}>
                        {isLeftCollapsed ? <CollapsedPanel onExpand={handleLeftAction} side="left" /> : (<SourcesPanel><IconButton onClick={handleLeftAction} size="small"><KeyboardDoubleArrowLeftIcon /></IconButton></SourcesPanel>)}
                    </Panel>
                    <PanelResizeHandle style={{ width: '1px', background: '#e0e0e0' }} />
                    <Panel defaultSize={60} minSize={30}>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={70} minSize={20}>
                                <MainView
                                    isLogPanelVisible={isLogPanelVisible}
                                    onToggleLogPanel={handleToggleLogPanel}
                                    onOpenSettings={() => setIsSettingsOpen(true)}
                                    onNewChat={() => setIsNewChatDialogOpen(true)}
                                />
                            </Panel>
                            <PanelResizeHandle style={{ height: '5px', background: isLogPanelVisible ? '#e0e0e0' : 'transparent', cursor: 'row-resize' }} />
                            <Panel ref={logPanelRef} collapsible={true} defaultSize={30} minSize={10} collapsedSize={0} onCollapse={() => setIsLogPanelVisible(false)} onExpand={() => setIsLogPanelVisible(true)}>
                                <LogPanel />
                            </Panel>
                        </PanelGroup>
                    </Panel>
                    <PanelResizeHandle style={{ width: '1px', background: '#e0e0e0' }} />
                    <Panel ref={rightPanelRef} defaultSize={20} minSize={15} collapsible={true} collapsedSize={5} onCollapse={() => setIsRightCollapsed(true)} onExpand={() => setIsRightCollapsed(false)}>
                        {isRightCollapsed ? <CollapsedPanel onExpand={handleRightAction} side="right" /> : (<DraftPanel><IconButton onClick={handleRightAction} size="small"><KeyboardDoubleArrowRightIcon /></IconButton></DraftPanel>)}
                    </Panel>
                </PanelGroup>
            </Box>
        </Box>
    );
}