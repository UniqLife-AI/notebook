// File: frontend/src/components/ChatPanel.tsx
// Намерение: Обновить UI для отображения метаданных (токены, дата)
// из чистых полей объекта Message, а не из его контента.

import React, { useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Divider } from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { useAppStore, Message } from '../store/useAppStore';
import TokenizerService from '../services/TokenizerService';

interface ChatPanelProps {
    sessionId: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
    const session = useAppStore((state) => state.sessions[sessionId]);
    const addMessage = useAppStore((state) => state.addMessage);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendMessage = () => {
        if (!input.trim() || isSending) return;
        setIsSending(true);
        const userMessageContent = input;
        setInput('');
        const lastMessage = session.messages[session.messages.length - 1];
        const nextTurn = (lastMessage && lastMessage.role === 'assistant') 
            ? lastMessage.turn + 1 
            : (lastMessage?.turn || 0) + 1; // Начинаем с 1, если сообщений нет
        
        addMessage(sessionId, {
            turn: nextTurn,
            role: 'user',
            content: userMessageContent,
            tokenCount: TokenizerService.countTokens(userMessageContent),
        });

        setTimeout(() => {
            const assistantResponse = `Симуляция ответа на сообщение: "${userMessageContent}".\nБэкенд пока не подключен.`;
            addMessage(sessionId, {
                turn: nextTurn,
                role: 'assistant',
                content: assistantResponse,
                tokenCount: TokenizerService.countTokens(assistantResponse),
            });
            setIsSending(false);
        }, 1500);
    };
    
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && event.ctrlKey) {
            event.preventDefault();
            handleSendMessage();
        }
    };

    if (!session) {
        return <Box p={2}><Typography>Сессия не найдена.</Typography></Box>;
    }

    return (
        <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box mb={2}>
                <Typography variant="h5">{session.title}</Typography>
                <Typography variant="caption" color="text.secondary">
                    Model: {session.model} | Temp: {session.temperature} | Tokens: {session.totalTokenCount}
                </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', mb: 2, pr: 1 }}>
                {session.messages.length === 0 ? (
                    <Typography sx={{textAlign: 'center', mt: 4, color: 'text.secondary'}}>
                        Начните диалог.
                    </Typography>
                ) : (
                    session.messages.map((msg: Message) => (
                        <Paper 
                            key={msg.id} 
                            elevation={1} 
                            sx={{ p: 1.5, mb: 1.5, bgcolor: msg.role === 'user' ? '#e3f2fd' : 'background.paper' }}
                        >
                            <Typography variant="body2" sx={{ fontWeight: 'bold', textTransform: 'uppercase', color: msg.role === 'user' ? 'primary.dark' : 'text.primary' }}>
                                {msg.role} (Turn: {msg.turn})
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', py: 1 }}>
                                {msg.content}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            {/* ИЗМЕНЕНИЕ: Отображаем метаданные из чистых полей */}
                            <Typography variant="caption" color="text.secondary">
                                {new Date(msg.createdAt).toLocaleString()} | Токенов: {msg.tokenCount}
                            </Typography>
                        </Paper>
                    ))
                )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                    fullWidth multiline maxRows={5} variant="outlined"
                    placeholder="Введите ваше сообщение... (Ctrl+Enter для отправки)"
                    value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown} disabled={isSending}
                />
                <Button
                    variant="contained" onClick={handleSendMessage} disabled={!input.trim() || isSending}
                    sx={{ height: '56px', minWidth: '56px', bgcolor: isSending ? 'warning.main' : 'primary.main' }}
                >
                    {isSending ? <StopCircleIcon /> : <ArrowUpwardIcon />}
                </Button>
            </Box>
        </Box>
    );
};