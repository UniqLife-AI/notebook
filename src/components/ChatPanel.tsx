"use client";
import { useState, useRef, useLayoutEffect } from 'react';
import { useChat, type Message } from 'ai/react';
import { useApiKeyStore } from '@/store/useApiKeyStore';
import { useChatSettingsStore } from '@/store/useChatSettingsStore';
import { Box, Paper, TextField, IconButton, Typography, Button, CircularProgress, Menu, MenuItem, ListItemIcon, ListItemText, Avatar, Dialog, DialogContent } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined';
import CloseIcon from '@mui/icons-material/Close';
import StopIcon from '@mui/icons-material/Stop';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import DataObjectIcon from '@mui/icons-material/DataObject';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import MicIcon from '@mui/icons-material/Mic';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import YouTubeIcon from '@mui/icons-material/YouTube';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChatSettingsDialog } from './ChatSettingsDialog';

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const handleCopy = () => { navigator.clipboard.writeText(codeString); setCopied(true); setTimeout(() => setCopied(false), 2000); };
    return !inline && match ? (
        <Paper sx={{ my: 2, bgcolor: '#2d2d2d', color: 'white', overflow: 'hidden', border: '1px solid #424242' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#3c3c3c', px: 2, py: 1 }}><Typography variant="caption" sx={{ textTransform: 'uppercase' }}>{match[1]}</Typography><IconButton onClick={handleCopy} size="small">{copied ? <CheckIcon sx={{ color: 'lightgreen' }} fontSize="small" /> : <ContentCopyIcon sx={{ color: 'white' }} fontSize="small" />}</IconButton></Box>
            <Box sx={{ p: 2, overflowX: 'auto' }}><SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>{codeString}</SyntaxHighlighter></Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', bgcolor: '#3c3c3c', px: 2, py: 0.5, borderTop: '1px solid #424242' }}><Button onClick={handleCopy} size="small" startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />} sx={{ color: copied ? 'lightgreen' : 'white', textTransform: 'none' }}>{copied ? 'Copied' : 'Copy code'}</Button></Box>
        </Paper>
    ) : (<code className={className} {...props}>{children}</code>);
};

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });

const ChatMessage = ({ msg, onDelete, onBranch }: { msg: Message, onDelete: (id: string) => void, onBranch: (id: string) => void }) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const messageData = msg.data as { imageUrl?: string | null };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const handleDelete = () => { onDelete(msg.id); handleMenuClose(); };
    const handleBranch = () => { onBranch(msg.id); handleMenuClose(); };
    const handleCopyText = () => { navigator.clipboard.writeText(msg.content); handleMenuClose(); };

    return (
        <Box sx={{ mb: 2, '&:hover .message-actions': { opacity: 1 } }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5', position: 'relative' }}>
                <IconButton size="small" onClick={handleMenuOpen} className="message-actions" sx={{ position: 'absolute', top: 8, right: 8, opacity: 0, transition: 'opacity 0.2s' }}>
                    <MoreVertIcon fontSize="small" />
                </IconButton>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>{msg.role === 'user' ? 'Вы' : 'AI'}</Typography>
                {messageData?.imageUrl && <IconButton onClick={() => setModalImage(messageData.imageUrl || null)} sx={{ p: 0 }}><Avatar src={messageData.imageUrl} variant="rounded" sx={{ width: 120, height: 120, mb: 1 }} /></IconButton>}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
            </Paper>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={handleDelete}><ListItemIcon><DeleteOutlineIcon fontSize="small" /></ListItemIcon><ListItemText>Delete</ListItemText></MenuItem>
                <MenuItem onClick={handleBranch}><ListItemIcon><CallSplitIcon fontSize="small" /></ListItemIcon><ListItemText>Branch from here</ListItemText></MenuItem>
                <MenuItem onClick={handleCopyText}><ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon><ListItemText>Copy text</ListItemText></MenuItem>
                <MenuItem onClick={handleCopyText}><ListItemIcon><DataObjectIcon fontSize="small" /></ListItemIcon><ListItemText>Copy markdown</ListItemText></MenuItem>
            </Menu>
            <Dialog open={Boolean(modalImage)} onClose={() => setModalImage(null)} maxWidth="lg" PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}><DialogContent sx={{ p: 1 }}><img src={modalImage || ''} alt="Enlarged content" style={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }} /></DialogContent></Dialog>
        </Box>
    );
};


export const ChatPanel = () => {
    const { apiKey } = useApiKeyStore();
    const settings = useChatSettingsStore();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [tokenUsage, setTokenUsage] = useState({ completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 });
    const [pastedImage, setPastedImage] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const chatContainerRef = useRef<HTMLDivElement>(null);

    const { messages, input, handleInputChange, isLoading, reload, setMessages, append, stop, setInput } = useChat({
        headers: { 'x-api-key': apiKey || '' },
        api: '/api/chat',
        body: { settings },
        onFinish: (message: Message & { usage?: any }) => { if (message.usage) setTokenUsage(message.usage); },
        onError: (error) => alert(`Произошла ошибка: ${error.message}`),
    });

    useLayoutEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSmartSubmit = () => {
        if (!apiKey) { setSettingsOpen(true); return; }
        if (!input.trim() && !pastedImage) return;
        append({ role: 'user', content: input, data: { imageUrl: pastedImage } });
        setInput('');
        setPastedImage(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); handleSmartSubmit(); } };
    const handlePaste = async (e: React.ClipboardEvent) => { const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/')); if (item) { const file = item.getAsFile(); if (file) setPastedImage(await fileToDataUrl(file)); } };
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const hasInput = input.trim().length > 0;
    const canSubmit = !isLoading && (hasInput || pastedImage);

    const handleDeleteMessage = (id: string) => setMessages(messages.filter(m => m.id !== id));
    const handleBranchMessage = (id: string) => console.log("Branching from message ID:", id);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: 'white' }}>
            <ChatSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
            <Box sx={{ p: '12px 24px', borderBottom: '1px solid #e0e0e0', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>Чат</Typography>
                <Box>
                    <IconButton onClick={() => setMessages([])} title="Новый чат"><AddCommentOutlinedIcon /></IconButton>
                    <Button variant="text" startIcon={<RefreshIcon />} sx={{ color: 'text.primary', mr: 1 }} onClick={() => reload()}>Обновить</Button>
                    <IconButton onClick={() => setSettingsOpen(true)}><TuneIcon /></IconButton>
                </Box>
            </Box>

            <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 3, minHeight: 0 }}>
                {messages.map(m => (
                    <ChatMessage
                        key={m.id}
                        msg={m}
                        onDelete={handleDeleteMessage}
                        onBranch={handleBranchMessage}
                    />
                ))}
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f0f2f5', borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Paper sx={{ p: '8px', display: 'flex', flexDirection: 'column', borderRadius: '16px', transition: 'all 0.2s ease-in-out', bgcolor: isFocused ? 'white' : 'transparent', boxShadow: isFocused ? '0 4px 12px rgba(0,0,0,0.1)' : 'none', border: '1px solid', borderColor: isFocused ? 'transparent' : '#e0e0e0' }}>
                    {pastedImage && (<Box sx={{ p: 1, position: 'relative' }}><IconButton onClick={() => setPastedImage(null)} size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}><CloseIcon fontSize="small" sx={{ color: 'white' }} /></IconButton><Avatar src={pastedImage} variant="rounded" sx={{ width: 80, height: 80 }} /></Box>)}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField fullWidth variant="standard" placeholder="Введите текст или вставьте изображение (Ctrl+V)" value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} onPaste={handlePaste} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} multiline maxRows={10} InputProps={{ disableUnderline: true, sx: { py: '4px', pl: 2 } }} />
                        <IconButton sx={{ p: '10px' }} onClick={handleMenuClick}><AddIcon /></IconButton>
                        {isLoading
                            ? <Button variant="contained" onClick={stop} sx={{ borderRadius: '20px', p: '6px 16px' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CircularProgress size={20} sx={{ color: 'white' }} />Stop</Box></Button>
                            : <Button onClick={handleSmartSubmit} variant="contained" disabled={!canSubmit} sx={{ borderRadius: '20px', bgcolor: canSubmit ? 'primary.main' : '#e0e2e6', color: canSubmit ? 'white' : 'black', '&:hover': { bgcolor: canSubmit ? 'primary.dark' : '#d1d3d7' } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>Run<Typography component="span" sx={{ color: canSubmit ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontWeight: 'bold' }}>Ctrl</Typography><KeyboardReturnIcon /></Box>
                            </Button>
                        }
                    </Box>
                </Paper>
                {tokenUsage.total_tokens > 0 && <Box sx={{ textAlign: 'center', mt: 1.5 }}><Typography variant="caption" color="text.secondary">Последний ответ: {tokenUsage.total_tokens} токенов</Typography></Box>}
            </Box>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}><MenuItem disabled><ListItemText>Добавление контекста:</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><DriveFolderUploadIcon fontSize="small" /></ListItemIcon><ListItemText>My Drive</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><FileUploadIcon fontSize="small" /></ListItemIcon><ListItemText>Upload File</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><MicIcon fontSize="small" /></ListItemIcon><ListItemText>Record Audio</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><CameraAltIcon fontSize="small" /></ListItemIcon><ListItemText>Camera</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><YouTubeIcon fontSize="small" /></ListItemIcon><ListItemText>YouTube Video</ListItemText></MenuItem><MenuItem onClick={handleMenuClose}><ListItemIcon><PermMediaIcon fontSize="small" /></ListItemIcon><ListItemText>Sample Media</ListItemText></MenuItem></Menu>
        </Box>
    );
};