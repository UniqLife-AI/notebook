import React, { useEffect } from 'react';
import { Box, Typography, Tabs, Tab, IconButton } from "@mui/material";
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';

import { SourcesPanel } from './SourcesPanel';
import NoteEditor from "./NoteEditor";
import TerminalComponent from "./TerminalComponent";
import { ChatPanel } from './ChatPanel';
import { useChatSessionStore } from '../store/useChatSessionStore';
import { useViewStore } from '../store/useViewStore';

interface MainViewProps {
	isLogPanelVisible: boolean;
	onNewChat: () => void;
}

export const MainView = ({ isLogPanelVisible, onNewChat }: MainViewProps) => {
	const { openFilePath, activeTabId, setActiveTab, closeOpenFile } = useViewStore();
	// ИСПРАВЛЕНИЕ: Получаем deleteSession вместо closeSession
	const { sessions, activeSessionId, deleteSession, setActiveSessionId } = useChatSessionStore();

	useEffect(() => {
		if (activeSessionId) {
			setActiveTab(activeSessionId);
		}
	}, [activeSessionId, setActiveTab]);

	const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
		setActiveTab(newValue);
		if (sessions[newValue]) {
			setActiveSessionId(newValue);
		} else {
			setActiveSessionId(null);
		}
	};
	
	// ИСПРАВЛЕНИЕ: Вызываем deleteSession для удаления файла с диска
	const handleCloseChatTab = (e: React.MouseEvent, sessionId: string) => {
		e.stopPropagation();
		deleteSession(sessionId);
	};

	const handleCloseFileTab = (e: React.MouseEvent) => {
		e.stopPropagation();
		closeOpenFile();
	}

	const openSessions = Object.values(sessions);

	return (
		<Box sx={{ display: 'flex', height: '100vh', width: '100vw', bgcolor: 'background.default' }}>
			<Box sx={{ width: '300px', flexShrink: 0 }}>
				<SourcesPanel />
			</Box>
			<PanelGroup direction="vertical">
				<Panel>
					<Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
						<Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
							<Tabs 
								value={activeTabId || false}
								onChange={handleTabChange} 
								variant="scrollable"
								sx={{ flexGrow: 1 }}
							>
								{openFilePath && (
									<Tab
										value={openFilePath}
										label={
											<Box sx={{display: 'flex', alignItems: 'center'}}>
												{openFilePath.split(/[/\\]/).pop()}
												<IconButton size="small" onClick={handleCloseFileTab} sx={{ml: 1}}>
													<CloseIcon fontSize="inherit" />
												</IconButton>
											</Box>
										}
									/>
								)}
								{openSessions.map(session => (
									<Tab 
										key={session.id} 
										value={session.id}
										label={
											<Box sx={{display: 'flex', alignItems: 'center'}}>
												{session.title}
												<IconButton size="small" onClick={(e) => handleCloseChatTab(e, session.id)} sx={{ml: 1}}>
													<CloseIcon fontSize="inherit" />
												</IconButton>
											</Box>
										} 
									/>
								))}
							</Tabs>
							<IconButton onClick={onNewChat} sx={{ ml: 1, mr: 1 }} title="New Chat">
								<AddIcon />
							</IconButton>
						</Box>
						<Box sx={{ flexGrow: 1, overflow: 'auto' }}>
							{activeTabId === openFilePath && openFilePath && <Box p={2}><NoteEditor filePath={openFilePath} /></Box>}
							{activeTabId && sessions[activeTabId] && <ChatPanel sessionId={activeTabId} />}
							{!activeTabId && (
								<Box sx={{ p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
									<Typography color="text.secondary">
										Select a file or start a new chat.
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