// File Name: src/components/LogPanel.tsx

"use client";
import { Box } from '@mui/material';
// ИЗМЕНЕНИЕ: Убраны лишние импорты
import dynamic from 'next/dynamic';

// Компонент остается динамическим, чтобы избежать SSR
const DynamicTerminal = dynamic(
    () => import('./TerminalComponent'),
    { ssr: false }
);

// ИЗМЕНЕНИЕ: Компонент максимально упрощен
export const LogPanel = () => {
    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                bgcolor: '#1e1e1e',
            }}
        >
            <DynamicTerminal />
        </Box>
    );
};