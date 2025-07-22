// File Name: src/components/NoteEditor.tsx

"use client";
import { useChatSessionStore } from "@/store/useChatSessionStore";
import { TextareaAutosize } from "@mui/material"; 
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

export const NoteEditor = () => {
    const activeSession = useChatSessionStore(state => state.getActiveSession());
    const updateNoteContent = useChatSessionStore(state => state.updateNoteContent);
    
    const [content, setContent] = useState(activeSession?.rawContent || '');
    // ИЗМЕНЕНИЕ: Состояние для переключения между режимами
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        setContent(activeSession?.rawContent || '');
    }, [activeSession]);

    useEffect(() => {
        if (!activeSession || content === activeSession.rawContent) {
            return;
        }
        const handler = setTimeout(() => {
            updateNoteContent(activeSession.id, content);
        }, 500);
        return () => {
            clearTimeout(handler);
        };
    }, [content, activeSession, updateNoteContent]);

    const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(event.target.value);
    };

    if (!activeSession) {
        return null;
    }

    return (
        <Box sx={{ position: 'relative', height: '100%' }}>
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1 }}>
                <Tooltip title={editMode ? "Режим предпросмотра" : "Режим редактирования"}>
                    <IconButton onClick={() => setEditMode(!editMode)}>
                        {editMode ? <VisibilityIcon /> : <EditIcon />}
                    </IconButton>
                </Tooltip>
            </Box>

            {editMode ? (
                <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
                    <TextareaAutosize
                        minRows={20}
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Начните писать..."
                        style={{
                            boxSizing: 'border-box',
                            width: '100%',
                            height: '100%',
                            padding: '16px',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            fontFamily: 'Roboto, sans-serif',
                            fontSize: '16px',
                            lineHeight: 1.7,
                            resize: 'none',
                        }}
                    />
                </Box>
            ) : (
                <Box sx={{ p: 4, height: '100%', overflowY: 'auto', '& p': {my: 1}, '& h1, & h2, & h3': {mt: 2, mb: 1, pb: 0.5, borderBottom: '1px solid #eee'} }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {content}
                    </ReactMarkdown>
                </Box>
            )}
        </Box>
    );
};