import React, { useState, useEffect } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import SetupDirectoryDialog from './components/SetupDirectoryDialog';
import { MainView } from './components/MainView';
import ThemeRegistry from './components/ThemeRegistry';
import { NotificationsProvider } from './components/NotificationsProvider';
import './App.css';

import { useChatSessionStore } from './store/useChatSessionStore';
import TokenizerService from './services/TokenizerService';
import { NewChatDialog } from './components/NewChatDialog';
import { LoadChatSessions } from '../wailsjs/go/main/App';
import ChatPersistenceService from './services/ChatPersistenceService'; // <-- ВОТ НЕДОСТАЮЩИЙ ИМПОРТ

function App() {
	const { workspaceDir, getActiveDirectory, projectDir } = useSettingsStore();
	const { addSession, hydrateSessions } = useChatSessionStore();
	const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);

	useEffect(() => {
		TokenizerService.init();
	}, []);

	useEffect(() => {
		const activeDir = getActiveDirectory();
		if (activeDir) {
			console.log(`Загрузка сессий чата из: ${activeDir}`);
			LoadChatSessions(activeDir)
				.then(chatFiles => {
					if (chatFiles) {
						const sessions = chatFiles
							.map(file => ChatPersistenceService.parse(file.path, file.content))
							.filter((session): session is NonNullable<typeof session> => session !== null);
						
						hydrateSessions(sessions);
						console.log(`Загружено ${sessions.length} сессий.`);
					} else {
						hydrateSessions([]);
						console.log(`Загружено 0 сессий.`);
					}
				})
				.catch(error => {
					console.error('Ошибка загрузки сессий чата:', error);
				});
		}
	}, [workspaceDir, projectDir, hydrateSessions, getActiveDirectory]);

	const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);

	const handleToggleLogPanel = () => setIsLogPanelVisible(prev => !prev);
	const handleOpenSettings = () => console.log("Settings dialog should open.");
	const handleNewChat = () => setIsNewChatDialogOpen(true);

	const handleCreateSession = (fileName: string) => {
		const activeDirectory = getActiveDirectory();
		if (!activeDirectory) return;

		const title = fileName.replace(/\.md$/, '');
		const filePath = [activeDirectory, '.ai-notebook', 'chats', fileName].join('\\');

		addSession({
			id: filePath,
			title: title,
			model: 'gpt-4o',
			temperature: 0.7,
			createdAt: new Date().toISOString(),
		});
		setIsNewChatDialogOpen(false);
	};

	const mainViewProps = {
		isLogPanelVisible,
		onToggleLogPanel: handleToggleLogPanel,
		onOpenSettings: handleOpenSettings,
		onNewChat: handleNewChat,
	};

	return (
		<ThemeRegistry>
			<NotificationsProvider>
				<div id="App">
					{workspaceDir ? (
						<MainView {...mainViewProps} />
					) : (
						<SetupDirectoryDialog />
					)}
					<NewChatDialog
						open={isNewChatDialogOpen}
						onClose={() => setIsNewChatDialogOpen(false)}
						onCreate={handleCreateSession}
					/>
				</div>
			</NotificationsProvider>
		</ThemeRegistry>
	);
}

export default App;