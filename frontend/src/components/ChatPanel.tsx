import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useChatSessionStore } from '../store/useChatSessionStore';

// @interface ChatPanelProps
// @description Компонент принимает ID сессии для отображения
interface ChatPanelProps {
	sessionId: string;
}

/**
 * @component ChatPanel
 * @description Временная read-only версия для отображения сообщений из стора.
 * Это первый шаг для проверки работы `useChatSessionStore`.
 */
export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId }) => {
	// Подписываемся на изменения конкретной сессии в сторе
	const session = useChatSessionStore((state) => state.sessions[sessionId]);

	// Если сессия по какой-то причине не найдена, показываем заглушку
	if (!session) {
		return (
			<Box p={2}>
				<Typography>Session not found.</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
			{/* Заголовок с метаданными */}
			<Box mb={2}>
				<Typography variant="h5">{session.title}</Typography>
				<Typography variant="caption" color="text.secondary">
					Model: {session.model} | Temp: {session.temperature} | Tokens: {session.totalTokenCount}
				</Typography>
			</Box>

			{/* Область для сообщений */}
			<Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
				{session.messages.length === 0 ? (
					<Typography>No messages yet.</Typography>
				) : (
					session.messages.map((msg) => (
						<Paper 
							key={msg.id} 
							elevation={1} 
							sx={{ 
								p: 1.5, 
								mb: 1.5,
								bgcolor: msg.role === 'user' ? 'primary.light' : 'background.paper',
							}}
						>
							<Typography variant="body2" sx={{ fontWeight: 'bold' }}>
								{msg.role} (Turn: {msg.turn})
							</Typography>
							<Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
								{msg.content}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								Tokens: {msg.tokenCount}
							</Typography>
						</Paper>
					))
				)}
			</Box>
		</Box>
	);
};