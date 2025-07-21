// File Name: src/components/AppHeader.tsx

import { AppBar, Avatar, Box, Button, IconButton, Toolbar, Tooltip, Typography } from "@mui/material";
import HubIcon from '@mui/icons-material/Hub';
import SettingsIcon from '@mui/icons-material/Settings';
import AddCommentOutlinedIcon from '@mui/icons-material/AddCommentOutlined'; // ИЗМЕНЕНИЕ: Импортируем иконку

// ИЗМЕНЕНИЕ: Компонент теперь принимает два обработчика
interface AppHeaderProps {
    onSettingsClick: () => void;
    onNewChatClick: () => void;
}

export const AppHeader = ({ onSettingsClick, onNewChatClick }: AppHeaderProps) => (
    <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.default', borderBottom: '1px solid #e0e0e0', color: 'text.primary' }}>
        <Toolbar>
            <HubIcon sx={{ mr: 1.5 }} />
            <Typography variant="body1" sx={{ fontWeight: 500, flexGrow: 1 }}>Notebook</Typography>
            <Button size="small" variant="outlined" sx={{ color: 'inherit', borderColor: '#e0e0e0', mr: 1 }}>PRO</Button>
            
            {/* ИЗМЕНЕНИЕ: Добавлена глобальная кнопка "Новый чат" */}
            <Tooltip title="Новый чат">
                <IconButton onClick={onNewChatClick} sx={{ mr: 1 }}>
                    <AddCommentOutlinedIcon />
                </IconButton>
            </Tooltip>

            <Tooltip title="Настройки">
                <IconButton onClick={onSettingsClick} sx={{ mr: 1 }}>
                    <SettingsIcon />
                </IconButton>
            </Tooltip>

            <Avatar sx={{ bgcolor: '#9c27b0', width: 32, height: 32 }}>V</Avatar>
        </Toolbar>
    </AppBar>
);