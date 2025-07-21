// File Name: src/components/BacklinksDisplay.tsx

"use client";

import { useChatSessionStore } from "@/store/useChatSessionStore";
import { Box, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider } from "@mui/material";
import LinkIcon from '@mui/icons-material/Link';
import React from "react";

interface BacklinksDisplayProps {
    noteName: string;
}

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
        // ИСПРАВЛЕНИЕ: Передаем null в качестве второго аргумента для заголовка
        openOrCreateNoteByName(backlinkName, null);
    };

    return (
        <Box sx={{ mt: 6, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper' }}>
            <Typography variant="overline" color="text.secondary">
                Упоминания ({backlinks.length})
            </Typography>
            <List dense>
                {backlinks.map(backlink => (
                    <ListItem key={backlink} disablePadding>
                        <ListItemButton onClick={() => handleLinkClick(backlink)}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <LinkIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={backlink} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};