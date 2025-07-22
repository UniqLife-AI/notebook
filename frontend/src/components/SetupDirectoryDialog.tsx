import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
// ИСПРАВЛЕНО: Путь к сгенерированным файлам Wails не должен начинаться со слеша.
import { SelectDirectory } from '../../wailsjs/go/main/App';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * @component SetupDirectoryDialog
 * @description Этот компонент отвечает за первоначальный выбор рабочей директории.
 * Он использует Go-функцию `SelectDirectory` и сохраняет результат в Zustand store.
 * Этот компонент в полном порядке, исправлена только одна строка с импортом.
 */
const SetupDirectoryDialog: React.FC = () => {
  const setRootDirectory = useSettingsStore((state) => state.setRootDirectory);

  const handleSelectDirectory = async () => {
    try {
      const path = await SelectDirectory();
      if (path) {
        console.log('Selected directory:', path);
        setRootDirectory(path);
      } else {
        console.log('Directory selection was cancelled.');
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          padding: 4,
          textAlign: 'center',
          maxWidth: '500px',
        }}
      >
        <Typography variant="h5" gutterBottom>
          Welcome to Your LLM Notebook
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          To get started, please select a root directory for your notes and projects. All your data will be stored locally in this folder.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleSelectDirectory}
        >
          Select Project Directory
        </Button>
      </Paper>
    </Box>
  );
};

export default SetupDirectoryDialog;