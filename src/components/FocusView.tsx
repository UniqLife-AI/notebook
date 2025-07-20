"use client";
import { useRef, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle, ImperativePanelHandle } from "react-resizable-panels";
import { SourcesPanel } from "./SourcesPanel";
import { ChatPanel } from "./ChatPanel";
import { DraftPanel } from "./DraftPanel";
import { Box, IconButton } from "@mui/material";
import { AppHeader } from './AppHeader';
import { CollapsedPanel } from './CollapsedPanel';
import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';

export function FocusView() {
    const leftPanelRef = useRef<ImperativePanelHandle>(null);
    const rightPanelRef = useRef<ImperativePanelHandle>(null);

    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const [isRightCollapsed, setIsRightCollapsed] = useState(false);

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

    return (
        // ИСПРАВЛЕНИЕ 1: '100%' вместо '100vw' для избежания горизонтального скролла
        <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <AppHeader />
            {/* ИСПРАВЛЕНИЕ 2: Добавляем minHeight: 0, чтобы flex-контейнер правильно ограничивал высоту дочерних элементов */}
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
                <PanelGroup direction="horizontal">

                    <Panel
                        ref={leftPanelRef}
                        defaultSize={22}
                        minSize={15}
                        collapsible={true}
                        collapsedSize={5}
                        onCollapse={() => setIsLeftCollapsed(true)}
                        onExpand={() => setIsLeftCollapsed(false)}
                    >
                        {isLeftCollapsed
                            ? <CollapsedPanel onExpand={handleLeftAction} side="left" />
                            : (
                                <SourcesPanel>
                                    <IconButton onClick={handleLeftAction} size="small"><KeyboardDoubleArrowLeftIcon /></IconButton>
                                </SourcesPanel>
                            )
                        }
                    </Panel>

                    <PanelResizeHandle style={{ width: '1px', background: '#e0e0e0' }} />

                    <Panel defaultSize={56} minSize={30}>
                        <ChatPanel />
                    </Panel>

                    <PanelResizeHandle style={{ width: '1px', background: '#e0e0e0' }} />

                    <Panel
                        ref={rightPanelRef}
                        defaultSize={22}
                        minSize={15}
                        collapsible={true}
                        collapsedSize={5}
                        onCollapse={() => setIsRightCollapsed(true)}
                        onExpand={() => setIsRightCollapsed(false)}
                    >
                        {isRightCollapsed
                            ? <CollapsedPanel onExpand={handleRightAction} side="right" />
                            : (
                                <DraftPanel>
                                    <IconButton onClick={handleRightAction} size="small"><KeyboardDoubleArrowRightIcon /></IconButton>
                                </DraftPanel>
                            )
                        }
                    </Panel>

                </PanelGroup>
            </Box>
        </Box>
    );
}