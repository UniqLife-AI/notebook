// File Name: src/components/NoteEditor.tsx

"use client";
import { useChatSessionStore } from "@/store/useChatSessionStore";
import { TextareaAutosize, Link } from "@mui/material"; 
import { Box, IconButton, Tooltip } from "@mui/material";
import React, { useEffect, useState, useMemo } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';

// ИЗМЕНЕНИЕ: Выносим компонент ссылки для лучшей читаемости и функциональности
const WikiLink = ({ noteName, displayText }: { noteName: string, displayText: string }) => {
    const { openOrCreateNoteByName, doesNoteExist } = useChatSessionStore(state => ({
        openOrCreateNoteByName: state.openOrCreateNoteByName,
        doesNoteExist: state.doesNoteExist,
    }));

    const noteExists = useMemo(() => doesNoteExist(noteName), [noteName, doesNoteExist]);

    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        openOrCreateNoteByName(noteName);
    };

    return (
        <Link 
            href="#" 
            onClick={handleClick}
            sx={{
                color: noteExists ? 'primary.main' : 'text.secondary',
                textDecoration: 'none',
                borderBottom: '1px dotted',
                borderColor: noteExists ? 'primary.light' : 'text.secondary',
                p: '0 2px',
                mx: '1px',
                borderRadius: '3px',
                opacity: noteExists ? 1 : 0.7,
                '&:hover': {
                    backgroundColor: noteExists ? 'rgba(66, 133, 244, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    textDecoration: 'none',
                    borderBottom: '1px solid',
                    borderColor: noteExists ? 'primary.main' : 'text.primary',
                }
            }}
        >
            {displayText}
        </Link>
    );
};


export const NoteEditor = () => {
    const { activeSession, updateNoteContent } = useChatSessionStore(state => ({
        activeSession: state.getActiveSession(),
        updateNoteContent: state.updateNoteContent,
    }));
    
    const [content, setContent] = useState(activeSession?.rawContent || '');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const newContent = activeSession?.rawContent || '';
        setContent(newContent);
        
        // ИЗМЕНЕНИЕ: Автоматически переключаемся в режим редактирования, если заметка новая и пустая
        if (activeSession && newContent.trim() === '' && activeSession.type === 'note') {
            setEditMode(true);
        }

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
                        placeholder="Начните писать... Используйте [[Имя Заметки]] или [[Имя Заметки|текст ссылки]] для создания ссылок."
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
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        // ИЗМЕНЕНИЕ: Улучшенный рендерер для обработки wiki-ссылок, включая псевдонимы
                        components={{
                            p: (props) => {
                                const { children } = props;
                                const newChildren = React.Children.toArray(children).flatMap((child: any, index: number) => {
                                    if (typeof child !== 'string') {
                                        return child;
                                    }
                                    
                                    // Умный парсер, который может обработать [[note]] и [[note|alias]]
                                    const wikiLinkRegex = /\[\[([^|\]\n]+)(?:\|([^\]\n]+))?\]\]/g;
                                    const parts = child.split(wikiLinkRegex);

                                    return parts.map((part, i) => {
                                        // part будет чередоваться: текст, имя_заметки, псевдоним, текст, ...
                                        if (i % 3 === 1) { // Это имя_заметки
                                            const noteName = part;
                                            const alias = parts[i + 1]; // Следующий элемент - псевдоним
                                            const displayText = alias || noteName;
                                            return <WikiLink key={`${noteName}-${index}-${i}`} noteName={noteName} displayText={displayText} />;
                                        }
                                        if (i % 3 === 2) { // Это псевдоним, он уже обработан
                                            return null;
                                        }
                                        return part; // Это обычный текст
                                    }).filter(Boolean);
                                });
                                return <p>{newChildren}</p>;
                            }
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </Box>
            )}
        </Box>
    );
};