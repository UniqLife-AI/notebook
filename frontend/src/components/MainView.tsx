import React from 'react';
import { Box, Typography } from "@mui/material";

// Импортируем наши главные компоненты для панелей
import { SourcesPanel } from './SourcesPanel';
import NoteEditor from "./NoteEditor";

// Импортируем наш стор, чтобы знать, какой файл активен
import { useFileStore } from '../store/useFileStore';

/**
 * @interface MainViewProps
 * @description Этот интерфейс не меняется, так как App.tsx все еще передает эти props.
 */
interface MainViewProps {
    isLogPanelVisible: boolean;
    onToggleLogPanel: () => void;
    onOpenSettings: () => void;
    onNewChat: () => void;
}

/**
 * @component MainView
 * @description Это новая версия, которая создает главный интерфейс приложения.
 * Она размещает `SourcesPanel` слева, а в центре показывает либо редактор,
 * либо сообщение-приветствие, в зависимости от того, выбран ли файл.
 */
export const MainView = (props: MainViewProps) => {
    // Мы по-прежнему получаем активный файл из глобального хранилища.
    const activeFilePath = useFileStore((state) => state.activeFilePath);

    return (
        // Главный контейнер, который использует Flexbox для расположения панелей в ряд.
        <Box sx={{ display: 'flex', height: '100vh', width: '100vw' }}>
            
            {/* Левая панель: Наш файловый проводник */}
            <Box sx={{ width: '300px', flexShrink: 0 }}>
                <SourcesPanel />
            </Box>

            {/* Центральная панель: Редактор или сообщение-заглушка */}
            <Box sx={{ flexGrow: 1, p: 2 }}>
                {activeFilePath ? (
                    // Если пользователь кликнул на файл в SourcesPanel, показываем редактор.
                    <NoteEditor filePath={activeFilePath} />
                ) : (
                    // Если файл еще не выбран, показываем приветствие.
                    <Box sx={{p: 4, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <Typography color="text.secondary">
                            Select a file from the explorer panel to view or edit it.
                        </Typography>
                    </Box>
                )}
            </Box>

        </Box>
    );
};