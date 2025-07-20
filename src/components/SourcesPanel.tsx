import { Box, Button, Checkbox, List, ListItem, ListItemIcon, ListItemText, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import React from 'react'; // Импортируем React

// ПРИНИМАЕМ children
export const SourcesPanel = ({ children }: { children: React.ReactNode }) => (
    <Box sx={{ p: 2, bgcolor: 'background.paper', height: '100%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>Источники</Typography>
            {/* РЕНДЕРИМ КНОПКУ ЗДЕСЬ */}
            {children} 
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button fullWidth variant="outlined" startIcon={<AddIcon />} sx={{ borderColor: '#e0e0e0', color: 'text.primary' }}>Добавить</Button>
            <Button fullWidth variant="outlined" startIcon={<SearchIcon />} sx={{ borderColor: '#e0e0e0', color: 'text.primary' }}>Найти</Button>
        </Box>
        <List sx={{ flexGrow: 1 }}>
            <ListItem disablePadding><ListItemText primary={<Typography variant="body2" sx={{ fontWeight: 'bold' }}>Выбрать все источники</Typography>} /><Checkbox edge="end" defaultChecked /></ListItem>
            {['all-part-1.md', 'all-part-2.md', 'nlm-all.txt'].map((text) => (
                <ListItem key={text} disablePadding><ListItemIcon sx={{ minWidth: '40px' }}><ArticleOutlinedIcon color="action" /></ListItemIcon><ListItemText primary={text} /><Checkbox edge="end" defaultChecked /></ListItem>
            ))}
        </List>
    </Box>
);