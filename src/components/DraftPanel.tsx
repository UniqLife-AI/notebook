import { Box, IconButton, Typography } from "@mui/material";
import React from 'react'; // Импортируем React

// ПРИНИМАЕМ children
export const DraftPanel = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Студия</Typography>
            {/* РЕНДЕРИМ КНОПКУ ЗДЕСЬ */}
            {children}
        </Box>
    </Box>
);