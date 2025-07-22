// File: frontend/src/components/ChatPanel.tsx

import React from 'react';
import { Box, Typography } from '@mui/material';

// @comment: Контракт свойств сохранен, чтобы родительский компонент не выдавал ошибок.
interface ChatPanelProps {
    isLogPanelVisible: boolean;
    onToggleLogPanel: () => void;
    onOpenSettings: () => void;
    onNewChat: () => void;
}

/**
 * @component ChatPanel
 * @description Это компонент-заглушка для ChatPanel.
 * Оригинальный компонент был тесно связан со старой архитектурой (`useChatSessionStore`)
 * и вызывал ошибки компиляции. Мы временно заменяем его этой заглушкой,
 * чтобы получить чистую, рабочую сборку проекта.
 * Функциональность чата будет пере-реализована позже на основе новой архитектуры.
 */
export const ChatPanel: React.FC<ChatPanelProps> = (props) => {
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography color="text.secondary">
                Chat Panel Functionality is Pending Implementation.
            </Typography>
        </Box>
    );
};