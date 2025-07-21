// File Name: src/components/BacklinksDisplay.tsx

"use client";

import { useChatSessionStore, Backlink } from "@/store/useChatSessionStore";
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Chip, ChipProps } from "@mui/material";
import LinkIcon from '@mui/icons-material/Link';
import React from "react";

interface BacklinksDisplayProps {
    noteName: string;
}

// ИЗМЕНЕНИЕ: Функция для определения цвета чипа (аналогично NoteEditor)
const getChipColor = (type?: string | null): ChipProps['color'] => {
    if (!type) return 'default';
    const lowerType = type.toLowerCase();
    if (lowerType === 'supports') return 'success';
    if (lowerType === 'refutes') return 'error';
    return 'default';
};

export const BacklinksDisplay = ({ noteName }: BacklinksDisplayProps) => {
    const { getBacklinksForNote, openOrCreateNoteByName } = useChatSessionStore(state => ({
        getBacklinksForNote: state.getBacklinksForNote,
        openOrCreateNoteByName: state.openOrCreateNoteByName,
    }));

    const backlinks = getBacklinksForNote(noteName);

    if (!backlinks || backlinks.length === 0) {
        return null;
    }

    const handleLinkClick = (backlinkName: string) => {
        openOrCreateNoteByName(backlinkName, null);
    };

    return (
        <Box sx={{ mt: 6, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="overline" color="text.secondary">
                Упоминания ({backlinks.length})
            </Typography>
            <List dense>
                {backlinks.map((backlink: Backlink, index: number) => (
                    <ListItem 
                        key={`${backlink.sourceNote}-${index}`} 
                        disablePadding
                        secondaryAction={
                            backlink.type && 
                            <Chip 
                                label={backlink.type} 
                                size="small" 
                                variant="outlined" 
                                // ИЗМЕНЕНИЕ: Применяем цветовое кодирование
                                color={getChipColor(backlink.type)}
                                sx={{ mr: 1 }} 
                            />
                        }
                    >
                        <ListItemButton onClick={() => handleLinkClick(backlink.sourceNote)}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <LinkIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={backlink.sourceNote} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};