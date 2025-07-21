// File Name: src/components/MainView.tsx

"use client";
import { useChatSessionStore } from "@/store/useChatSessionStore";
import { ChatPanel } from "./ChatPanel";
import { NoteEditor } from "./NoteEditor";
import { Box, Typography } from "@mui/material";

// ИЗМЕНЕНИЕ: Убираем onNewChat из пропсов
interface MainViewProps {
    isLogPanelVisible: boolean;
    onToggleLogPanel: () => void;
    onOpenSettings: () => void;
}

export const MainView = (props: MainViewProps) => {
    const activeSession = useChatSessionStore(state => state.getActiveSession());

    if (!activeSession) {
        return (
            <Box sx={{p: 4, textAlign: 'center'}}>
                <Typography color="text.secondary">Выберите чат или заметку из списка слева, либо создайте новый чат.</Typography>
            </Box>
        );
    }

    if (activeSession.type === 'note') {
        return <NoteEditor />;
    }

    // ИЗМЕНЕНИЕ: Больше не передаем onNewChat в ChatPanel
    return <ChatPanel {...props} />;
};