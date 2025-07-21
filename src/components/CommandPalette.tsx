// File Name: src/components/CommandPalette.tsx

"use client";

import { useEffect } from 'react';
import { Command } from 'cmdk';
import { Dialog, DialogContent, Box, Typography, Paper } from '@mui/material';
import { useCommandPaletteStore } from '@/store/useCommandPaletteStore';
import { useChatSessionStore, type FileContentContext } from '@/store/useChatSessionStore';
import { fileSystemService } from '@/services/FileSystemService';
import { useNotifier } from '@/hooks/useNotifier';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';

const commandPaletteStyles = `
    [cmdk-input] {
        font-family: 'Roboto', sans-serif;
        font-size: 16px;
        width: 100%;
        padding: 16px;
        border: none;
        outline: none;
        background-color: transparent;
        border-bottom: 1px solid #e0e0e0;
    }
    [cmdk-list] {
        min-height: 200px;
        max-height: 400px;
        overflow: auto;
    }
    [cmdk-item] {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        cursor: pointer;
        font-family: 'Roboto', sans-serif;
        transition: background-color 0.1s ease-in-out;
    }
    [cmdk-item] > svg {
        margin-right: 12px;
        color: #616161;
    }
    [cmdk-item][aria-selected="true"] {
        background-color: #f0f2f5;
    }
    [cmdk-item][aria-disabled="true"] {
        color: #9e9e9e;
        cursor: not-allowed;
    }
    [cmdk-group-heading] {
        font-family: 'Roboto', sans-serif;
        padding: 8px 16px;
        font-size: 12px;
        color: #616161;
        font-weight: 500;
        text-transform: uppercase;
    }
    [cmdk-empty] {
        padding: 16px;
        font-family: 'Roboto', sans-serif;
        text-align: center;
    }
`;

interface CommandPaletteProps {
    onOpenSettings: () => void;
    onNewChat: () => void;
    // ИЗМЕНЕНИЕ: Новый проп для запуска воркфлоу
    onInitiateChatWithContext: (file: FileContentContext) => void;
}

export const CommandPalette = ({ onOpenSettings, onNewChat, onInitiateChatWithContext }: CommandPaletteProps) => {
    const { isOpen, close } = useCommandPaletteStore();
    // ИЗМЕНЕНИЕ: Получаем getActiveSession для проверки типа сессии
    const { sessions, openProject, addFileToContext, getActiveSession } = useChatSessionStore();
    const { notifySuccess, notifyError } = useNotifier();

    const runCommand = (command: () => void) => {
        close();
        command();
    };

    // ИЗМЕНЕНИЕ: Логика теперь ветвится в зависимости от типа активной сессии
    const handleAddToContext = async (fileName: string) => {
        const activeSession = getActiveSession();
        if (!activeSession) {
            notifyError("Нет активной сессии для добавления контекста.");
            return;
        }

        try {
            const content = await fileSystemService.readFile(fileName);
            const fileToAdd = { fileName, content };

            if (activeSession.type === 'chat') {
                addFileToContext(fileToAdd);
                notifySuccess(`Файл "${fileName}" добавлен в контекст.`);
            } else {
                // Если активна заметка, запускаем новый воркфлоу через FocusView
                onInitiateChatWithContext(fileToAdd);
            }

        } catch (error) {
            console.error(`Failed to read file ${fileName} for context:`, error);
            notifyError(`Не удалось прочитать файл "${fileName}".`);
        }
    };

    return (
        <Dialog 
            open={isOpen} 
            onClose={close}
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                    overflow: 'hidden'
                }
            }}
        >
            <style>{commandPaletteStyles}</style>
            <DialogContent sx={{ p: 0 }}>
                <Command label="Command Menu">
                    <Command.Input placeholder="Введите команду или имя файла..." />
                    <Command.List>
                        <Command.Empty>Команды не найдены.</Command.Empty>
                        
                        <Command.Group heading="Основные">
                            <Command.Item onSelect={() => runCommand(onNewChat)}>
                                Новый чат...
                            </Command.Item>
                             <Command.Item onSelect={() => runCommand(onOpenSettings)}>
                                Настройки...
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Проект">
                            <Command.Item onSelect={() => runCommand(openProject)}>
                                Открыть проект...
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Добавить файл в контекст">
                            {sessions.map(session => (
                                <Command.Item 
                                    key={session.id} 
                                    onSelect={() => runCommand(() => handleAddToContext(session.id))}
                                    value={session.label}
                                >
                                    <ArticleOutlinedIcon />
                                    {session.label}
                                </Command.Item>
                            ))}
                        </Command.Group>

                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
};