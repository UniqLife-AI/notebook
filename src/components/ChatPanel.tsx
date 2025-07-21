// File Name: src/components/ChatPanel.tsx

"use client";
import { useEffect, useRef, useLayoutEffect, useState, useMemo } from 'react';
import { useChat, type Message } from 'ai/react';
import {
    Box, Paper, TextField, IconButton, Typography, Button, CircularProgress,
    Dialog, DialogContent, Tabs, Tab, Avatar, Divider, Chip, Tooltip
} from '@mui/material';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import StopIcon from '@mui/icons-material/Stop';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import FunctionsIcon from '@mui/icons-material/Functions';
import TerminalIcon from '@mui/icons-material/Terminal';
import SpeedIcon from '@mui/icons-material/Speed';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { useApiKeyStore } from '@/store/useApiKeyStore';
import { useChatSettingsStore } from '@/store/useChatSettingsStore';
import { useChatSessionStore, FileContentContext } from '@/store/useChatSessionStore';
import { useNotifier } from '@/hooks/useNotifier';

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });

const ChatMessage = ({ msg }: { msg: Message }) => {
    const [modalImage, setModalImage] = useState<string | null>(null);
    const messageData = msg.data as { imageUrl?: string | null };

    return (
        <Box sx={{ mb: 2 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5', position: 'relative' }}>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{msg.role === 'user' ? 'Вы' : 'AI'}</Typography>
                {messageData?.imageUrl && (<IconButton onClick={() => setModalImage(messageData.imageUrl || null)} sx={{ p: 0 }}> <Avatar src={messageData.imageUrl} variant="rounded" sx={{ width: 120, height: 120, mb: 1 }} /> </IconButton>)}
                
                <Typography component="div" sx={{ 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-word',
                    fontFamily: 'monospace', 
                    fontSize: '14px' 
                }}>
                    {String(msg.content)}
                </Typography>

            </Paper>
            <Dialog open={Boolean(modalImage)} onClose={() => setModalImage(null)} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
                <DialogContent sx={{ p: 1 }}>
                    <img src={modalImage || ''} alt="Enlarged content" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
                </DialogContent>
            </Dialog>
        </Box>
    );
};


// ИЗМЕНЕНИЕ: Убрали onNewChat из пропсов
interface ChatPanelProps {
    isLogPanelVisible: boolean;
    onToggleLogPanel: () => void;
    onOpenSettings: () => void;
}

interface TokenUsage {
    total_tokens: number;
}

// ИЗМЕНЕНИЕ: Убрали onNewChat из деструктуризации
export const ChatPanel = ({ isLogPanelVisible, onToggleLogPanel, onOpenSettings }: ChatPanelProps) => {
    const { apiKey } = useApiKeyStore();
    const settings = useChatSettingsStore();
    const { 
        sessions, activeSessionId, setActiveSessionId, getActiveSession,
        updateSessionMessages, fileContentContext, removeFileFromContext, clearFileContext 
    } = useChatSessionStore();
    const { projectFileTreeContext, setProjectFileTreeContext } = useChatSessionStore(state => ({
        projectFileTreeContext: state.projectFileTreeContext,
        setProjectFileTreeContext: state.setProjectFileTreeContext,
    }));
    const { notifyError } = useNotifier();

    const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
    const [pastedImage, setPastedImage] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { messages, setMessages, input, setInput, handleInputChange, isLoading, append, stop } = useChat({
        headers: { 'x-api-key': apiKey || '' },
        api: '/api/chat',
        body: { settings },
        onFinish: (message) => { /* ... */ },
        onError: (error) => {
            const userFriendlyMessage = error.message.includes('429') 
                ? 'Ошибка: Превышен лимит запросов к API. Проверьте ваш тарифный план и лимиты.'
                : `Произошла ошибка: ${error.message}`;
            notifyError(userFriendlyMessage);
        },
    });

    const activeSession = useMemo(() => getActiveSession(), [sessions, activeSessionId]);
    
    useEffect(() => {
        if (activeSession) {
            setMessages(activeSession.messages);
        } else {
            setMessages([]);
        }
    }, [activeSession, setMessages]); 

    useLayoutEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        setActiveSessionId(newValue);
    };

    const handleSmartSubmit = () => {
        if (!apiKey) { onOpenSettings(); return; }
        if (!input.trim() && !pastedImage) return;

        setTokenUsage(null);
        let finalInput = '';
        let fileContextString = '';
        if (fileContentContext.length > 0) {
            fileContextString = fileContentContext.map(file => 
                `Контекст из файла "${file.fileName}":\n\`\`\`\n${file.content}\n\`\`\``
            ).join('\n\n');
        }

        if (projectFileTreeContext) {
            finalInput += `Based on the following file structure of my project:\n\n${projectFileTreeContext}\n\n`;
        }
        
        if (fileContextString) {
             finalInput += `And the content of these files:\n\n${fileContextString}\n\n`;
        }

        finalInput += `My question is: ${input}`;

        const newUserMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: finalInput,
            data: { imageUrl: pastedImage }
        };

        if (activeSessionId) {
            updateSessionMessages(activeSessionId, [...messages, newUserMessage]);
        }

        append(newUserMessage);
        
        setInput('');
        setPastedImage(null);
        setProjectFileTreeContext(null);
        clearFileContext();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSmartSubmit(); } };
    const handlePaste = async (e: React.ClipboardEvent) => { const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/')); if (item) { const file = item.getAsFile(); if (file) setPastedImage(await fileToDataUrl(file)); } };

    const canSubmit = !isLoading && (input.trim().length > 0 || pastedImage) && activeSessionId;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Tabs value={activeSessionId || false} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" sx={{ flexGrow: 1 }}>
                    {sessions.map(session => ( <Tab key={session.id} label={session.label} value={session.id} sx={{ textTransform: 'none' }} /> ))}
                </Tabs>
                <Divider orientation="vertical" flexItem />
                <Tooltip title={isLogPanelVisible ? "Скрыть панель" : "Показать панель"}>
                    <IconButton onClick={onToggleLogPanel} sx={{ mx: 0.5 }}>
                        <TerminalIcon color={isLogPanelVisible ? "primary" : "action"} />
                    </IconButton>
                </Tooltip>
                {/* ИЗМЕНЕНИЕ: Кнопка "Новый чат" удалена отсюда */}
            </Box>

            <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3, minHeight: 0 }}>
                {messages.map(m => (<ChatMessage key={m.id} msg={m} />))}
                {tokenUsage && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
                        <Chip icon={<SpeedIcon />} label={`Запрос стоил: ${tokenUsage.total_tokens} токенов`} variant="outlined" size="small" />
                    </Box>
                )}
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f0f2f5', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Paper sx={{ p: '8px', display: 'flex', flexDirection: 'column', borderRadius: '16px', transition: 'all 0.2s ease-in-out', bgcolor: isFocused ? 'white' : 'transparent', boxShadow: isFocused ? '0 4px 12px rgba(0,0,0,0.1)' : 'none', border: '1px solid', borderColor: isFocused ? 'transparent' : '#e0e0e0' }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, px: 2, pt: 1, pb: projectFileTreeContext || fileContentContext.length > 0 ? 1 : 0 }}>
                        {projectFileTreeContext && (
                            <Chip icon={<FunctionsIcon />} label="Контекст проекта" onDelete={() => setProjectFileTreeContext(null)} color="primary" variant="outlined" size="small" />
                        )}
                        {fileContentContext.map(file => (
                             <Chip key={file.fileName} icon={<ArticleOutlinedIcon />} label={file.fileName} onDelete={() => removeFileFromContext(file.fileName)} color="secondary" variant="outlined" size="small" />
                        ))}
                    </Box>
                    {pastedImage && (<Box sx={{ p: 1, position: 'relative' }}> <IconButton onClick={() => setPastedImage(null)} size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}> <CloseIcon fontSize="small" sx={{ color: 'white' }} /> </IconButton> <Avatar src={pastedImage} variant="rounded" sx={{ width: 80, height: 80 }} /> </Box>)}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField fullWidth variant="standard" placeholder={activeSessionId ? "Введите текст или вставьте изображение..." : "Создайте новый чат или выберите существующий"} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} onPaste={handlePaste} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} multiline maxRows={10} InputProps={{ disableUnderline: true, sx: { py: '4px', pl: 2 } }} disabled={!activeSessionId} />
                        {isLoading
                            ? <Button variant="contained" onClick={stop} sx={{ borderRadius: '20px', p: '6px 16px' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} sx={{ color: 'white' }} />Stop</Box></Button>
                            : <Button onClick={handleSmartSubmit} variant="contained" disabled={!canSubmit} sx={{ borderRadius: '20px', bgcolor: canSubmit ? 'primary.main' : '#e0e0e6', color: canSubmit ? 'white' : 'black', '&:hover': { bgcolor: canSubmit ? 'primary.dark' : '#d1d3d7' } }}> <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}> Run <Typography component="span" sx={{ color: canSubmit ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontWeight: 'bold' }}>Ctrl</Typography> <KeyboardReturnIcon /> </Box> </Button>
                        }
                    </Box>
                </Paper>
            </Box>
        </Box>
    );
};