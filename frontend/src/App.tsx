// File: frontend/src/App.tsx
// Намерение: Внедрить проверку на существование файла перед созданием
// нового чата, чтобы предотвратить случайную перезапись данных.

import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import SetupDirectoryDialog from '@/components/SetupDirectoryDialog';
import { MainView } from '@/components/MainView';
import { CommandPalette } from '@/components/CommandPalette';
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore';
import { ChatSettingsDialog } from '@/components/ChatSettingsDialog';
import { NewChatDialog } from '@/components/NewChatDialog';
import { useAppStore, View, ChatSession } from '@/store/useAppStore';
import { useChatSettingsStore } from '@/store/useChatSettingsStore';
import { useNotifier } from '@/hooks/useNotifier';
import { useHasHydrated } from '@/hooks/useHasHydrated';
// ИЗМЕНЕНИЕ: Импортируем новую Go-функцию CheckFileExists.
import { LoadChatSessions, GetChatSessionPath, ShowConfirmationDialog, DeleteChatSession, CheckFileExists } from 'wailsjs/go/main/App.js';
import ChatPersistenceService from '@/services/ChatPersistenceService';

function App() {
    const { workspaceDir, getActiveDirectory, projectDir } = useSettingsStore();
    const { addSession, hydrateSessions, openView, closeChatView, closeFileView } = useAppStore();
    const { open: openCommandPalette } = useCommandPaletteStore();
    const { model, temperature } = useChatSettingsStore();
    const { notifySuccess, notifyError } = useNotifier();
    const hasHydrated = useHasHydrated();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isLogPanelVisible, setIsLogPanelVisible] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openCommandPalette();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [openCommandPalette]);

    useEffect(() => {
        if (!hasHydrated) { return; }
        const activeDir = getActiveDirectory();
        if (activeDir) {
            LoadChatSessions(activeDir).then(chatFiles => {
                const sessions = (chatFiles || []).map(file => ChatPersistenceService.parse(file.path, file.content)).filter((s): s is ChatSession => s !== null);
                hydrateSessions(sessions);
            }).catch(error => {
                console.error('Ошибка загрузки сессий чата:', error);
                notifyError('Не удалось загрузить сессии чатов.');
            });
        } else {
            hydrateSessions([]);
        }
    }, [workspaceDir, projectDir, hasHydrated, getActiveDirectory, hydrateSessions, notifyError]);

    const handleCreateSession = async (fileName: string) => {
        const activeDirectory = getActiveDirectory();
        if (!activeDirectory) {
            notifyError("Невозможно создать чат: не выбран рабочий каталог.");
            return;
        }
        try {
            const title = fileName.replace(/\.md$/, '');
            const filePath = await GetChatSessionPath(activeDirectory, fileName);

            // ИЗМЕНЕНИЕ: Проверяем, существует ли файл, ПЕРЕД созданием.
            const exists = await CheckFileExists(filePath);
            if (exists) {
                notifyError(`Чат с именем "${fileName}" уже существует.`);
                return;
            }

            const newSession = await addSession({ id: filePath, title: title, model, temperature, createdAt: new Date().toISOString() });
            const newView: View = { id: newSession.id, type: 'chat', title: newSession.title };
            openView(newView);
            setIsNewChatOpen(false);
            notifySuccess(`Чат "${title}" создан.`);
        } catch (error) {
            console.error("Ошибка в процессе создания сессии чата:", error);
            notifyError(`Не удалось создать чат: ${error}`);
        }
    };

    const handleCloseView = async (view: View) => {
        if (view.type === 'file') {
            closeFileView(view.id);
            return;
        }
        if (view.type === 'chat') {
            const result = await ShowConfirmationDialog('Подтверждение удаления', `Вы уверены, что хотите навсегда удалить чат "${view.title}"? Это действие необратимо.`);
            if (result === 'Yes') {
                try {
                    await DeleteChatSession(view.id);
                } catch (err) {
                    console.error("Не удалось удалить файл чата, но вкладка все равно будет закрыта:", err);
                    notifyError("Ошибка при удалении файла чата.");
                } finally {
                    closeChatView(view.id);
                    notifySuccess(`Чат "${view.title}" удален.`);
                }
            }
        }
    };

    if (!hasHydrated) { return null; }
    if (!workspaceDir) { return <SetupDirectoryDialog />; }

    return (
        <>
            <MainView isLogPanelVisible={isLogPanelVisible} onNewChat={() => setIsNewChatOpen(true)} onCloseView={handleCloseView} />
            <CommandPalette onOpenSettings={() => setIsSettingsOpen(true)} onNewChat={() => setIsNewChatOpen(true)} />
            <ChatSettingsDialog open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <NewChatDialog open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} onCreate={handleCreateSession} />
        </>
    );
}

export default App;