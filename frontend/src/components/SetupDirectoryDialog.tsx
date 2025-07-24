import React from 'react';
import { Button, Typography, Box, Paper } from '@mui/material';
import { SelectDirectory } from '../../wailsjs/go/main/App';
import { useSettingsStore } from '../store/useSettingsStore';

const SetupDirectoryDialog: React.FC = () => {
	const setWorkspaceDir = useSettingsStore((state) => state.setWorkspaceDir);

	const handleSelectDirectory = async () => {
		try {
			// ИСПРАВЛЕНИЕ: Передаем пустую строку в качестве аргумента по умолчанию.
			const path = await SelectDirectory('');
			if (path) {
				setWorkspaceDir(path);
			}
		} catch (error) {
			console.error('Ошибка выбора каталога:', error);
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
					Добро пожаловать в ваш LLM-блокнот
				</Typography>
				<Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
					Для начала работы, пожалуйста, выберите основной рабочий каталог. Все ваши общие заметки и чаты будут храниться локально в этой папке.
				</Typography>
				<Button
					variant="contained"
					color="primary"
					size="large"
					onClick={handleSelectDirectory}
				>
					Выбрать основной каталог
				</Button>
			</Paper>
		</Box>
	);
};

export default SetupDirectoryDialog;