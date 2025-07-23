import React, { useState } from 'react';
import { useSettingsStore } from './store/useSettingsStore';
import SetupDirectoryDialog from './components/SetupDirectoryDialog';
import { MainView } from './components/MainView';
import ThemeRegistry from './components/ThemeRegistry';
import { NotificationsProvider } from './components/NotificationsProvider';
import './App.css';

// Определяем пропсы, которые ожидает MainView.
// Я создал этот интерфейс на основе твоей ошибки, чтобы было наглядно.
interface MainViewProps {
	isLogPanelVisible: boolean;
	onToggleLogPanel: () => void;
	onOpenSettings: () => void;
	onNewChat: () => void;
}

function App() {
	const rootDirectory = useSettingsStore((state) => state.rootDirectory);

	// --- Управление состоянием для MainView ---
	// ИЗМЕНЕНО: Панель терминала теперь видна по умолчанию для проверки layout.
	const [isLogPanelVisible, setIsLogPanelVisible] = useState(true);

	const handleToggleLogPanel = () => {
		setIsLogPanelVisible(prev => !prev);
	};

	const handleOpenSettings = () => {
		// TODO: Implement settings dialog logic
		console.log("Settings dialog should open.");
	};

	const handleNewChat = () => {
		// TODO: Implement new chat dialog logic
		console.log("New chat dialog should open.");
	};
	// -----------------------------------------

	// Собираем пропсы в один объект для чистоты
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
						// Теперь мы передаем все необходимые пропсы в MainView
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