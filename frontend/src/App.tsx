import React, { useState, useEffect } from 'react'; // <-- Добавлен useEffect
import { useSettingsStore } from './store/useSettingsStore';
import SetupDirectoryDialog from './components/SetupDirectoryDialog';
import { MainView } from './components/MainView';
import ThemeRegistry from './components/ThemeRegistry';
import { NotificationsProvider } from './components/NotificationsProvider';
import './App.css';

import { useChatSessionStore } from './store/useChatSessionStore';
import { v4 as uuidv4 } from 'uuid';
import TokenizerService from './services/TokenizerService'; // <-- ИМПОРТ НАШЕГО СЕРВИСА

interface MainViewProps {
	isLogPanelVisible: boolean;
	onToggleLogPanel: () => void;
	onOpenSettings: () => void;
	onNewChat: () => void;
}

function App() {
	const rootDirectory = useSettingsStore((state) => state.rootDirectory);
	const { addSession } = useChatSessionStore();

	// --- ИНИЦИАЛИЗАЦИЯ ТОКЕНИЗАТОРА ---
	useEffect(() => {
		// Вызываем асинхронную инициализацию при первом рендере App
		TokenizerService.init();
	}, []); // Пустой массив зависимостей гарантирует однократный вызов

	const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);

	const handleToggleLogPanel = () => {
		setIsLogPanelVisible(prev => !prev);
	};

	const handleOpenSettings = () => {
		console.log("Settings dialog should open.");
	};

	const handleNewChat = () => {
		addSession({
			id: `chat-session-${uuidv4()}`, 
			title: 'New Chat',
			model: 'gpt-4o',
			temperature: 0.7,
			createdAt: new Date().toISOString(),
		});
	};

	const mainViewProps: MainViewProps = {
		isLogPanelVisible,
		onToggleLogPanel: handleToggleLogPanel,
		onOpenSettings: handleOpenSettings,
		onNewChat: handleNewChat,
	};

	return (
		<ThemeRegistry>
			<NotificationsProvider>
				<div id="App">
					{rootDirectory ? (
						<MainView {...mainViewProps} />
					) : (
						<SetupDirectoryDialog />
					)}
				</div>
			</NotificationsProvider>
		</ThemeRegistry>
	);
}

export default App;