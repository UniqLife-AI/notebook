// File Name: src/components/LogPanel.tsx

"use client";
import { Box, Typography } from '@mui/material';

export const LogPanel = () => {
    return (
        <Box 
            sx={{ 
                width: '100%', 
                height: '100%', 
                overflow: 'hidden', 
                bgcolor: '#1e1e1e',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <Typography variant="body2" sx={{color: '#888'}}>
                Панель вывода. Интерактивный терминал будет добавлен в будущих версиях.
            </Typography>
        </Box>
    );
};