// File: frontend/src/components/CommandPalette.tsx

import React from 'react';
import { Command } from 'cmdk';
import { Dialog, DialogContent } from '@mui/material';
import { useCommandPaletteStore } from '../store/useCommandPaletteStore';

// ИСПРАВЛЕНО: Импорт `useChatSessionStore` полностью удален.

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
}

export const CommandPalette = ({ onOpenSettings, onNewChat }: CommandPaletteProps) => {
    const { isOpen, close } = useCommandPaletteStore();
    // ИСПРАВЛЕНО: Строка, использующая `useChatSessionStore`, удалена.

    const runCommand = (command: () => void) => {
        close();
        command();
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
                    <Command.Input placeholder="Введите команду или выполните поиск..." />
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

                        {/* ИСПРАВЛЕНО: Группа "Проект" и команда "Открыть проект..." удалены,
                            так как они зависели от старой архитектуры. */}
                    </Command.List>
                </Command>
            </DialogContent>
        </Dialog>
    );
};