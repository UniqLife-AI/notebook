import React, { useState } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import SetupDirectoryDialog from './components/SetupDirectoryDialog';
import { MainView } from './components/MainView';
import ThemeRegistry from './components/ThemeRegistry';
import { NotificationsProvider } from './components/NotificationsProvider';
import './App.css';

// --- НОВЫЕ ИМПОРТЫ ---
import { useChatSessionStore } from './store/useChatSessionStore';
import { v4 as uuidv4 } from 'uuid';


interface MainViewProps {
	isLogPanelVisible: boolean;
	onToggleLogPanel: () => void;
	onOpenSettings: () => void;
	onNewChat: () => void;
}

function App() {
	const rootDirectory = useSettingsStore((state) => state.rootDirectory);
	// --- ПОЛУЧАЕМ ФУНКЦИЮ ИЗ СТОРА ЧАТА ---
	const { addSession } = useChatSessionStore();


	const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);

	const handleToggleLogPanel = () => {
		setIsLogPanelVisible(prev => !prev);
	};

	const handleOpenSettings = () => {
		console.log("Settings dialog should open.");
	};

	// --- ИЗМЕНЕНА ЛОГИКА СОЗДАНИЯ ЧАТА ---
	const handleNewChat = () => {
		// Теперь эта функция создает полноценную сессию с дефолтными значениями
		addSession({
			// ID пока генерируем на лету. В будущем это будет путь к файлу.
			id: `chat-session-${uuidv4()}`, 
			title: 'New Chat',
			model: 'gpt-4o', // Модель по умолчанию
			temperature: 0.7,    // Температура по умолчанию
			createdAt: new Date().toISOString(),
		});
	};
	// -----------------------------------------

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