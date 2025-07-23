import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

// Интерфейсы Message и ChatSession остаются без изменений

export interface Message {
	id: string;
	turn: number;
	role: 'user' | 'assistant';
	content: string;
	tokenCount: number;
}

export interface ChatSession {
	id: string;
	title: string;
	model: string;
	temperature: number;
	messages: Message[];
	totalTokenCount: number;
	createdAt: string;
}

interface ChatSessionState {
	sessions: Record<string, ChatSession>;
	activeSessionId: string | null;

	// --- Функции для управления сессиями ---
	addSession: (sessionData: Omit<ChatSession, 'messages' | 'totalTokenCount'>) => ChatSession;
	setActiveSessionId: (id: string | null) => void;
	closeSession: (sessionId: string) => void; // <-- ДОБАВЛЕНО
	
	// --- Функции для управления сообщениями ---
	addMessage: (sessionId: string, messageData: Omit<Message, 'id'>) => void;
	editMessage: (sessionId: string, messageId: string, newContent: string) => void;
	deleteMessage: (sessionId: string, messageId: string) => void;
	deleteTurn: (sessionId: string, turn: number) => void;
	
	// --- Вспомогательные функции ---
	updateTokenCount: (sessionId: string, messageId: string, count: number) => void;
}

export const useChatSessionStore = create<ChatSessionState>((set) => ({
	// --- Начальное состояние ---
	sessions: {},
	activeSessionId: null,

	// --- Реализация функций ---

	setActiveSessionId: (id) => set({ activeSessionId: id }),

	addSession: (sessionData) => {
		const newSession: ChatSession = {
			...sessionData,
			messages: [],
			totalTokenCount: 0,
		};
		set((state) => ({
			sessions: {
				...state.sessions,
				[newSession.id]: newSession,
			},
			activeSessionId: newSession.id,
		}));
		return newSession;
	},

	// --- НОВАЯ ФУНКЦИЯ ---
	closeSession: (sessionId) => set(state => {
		const { [sessionId]: _, ...remainingSessions } = state.sessions;
		
		// Если закрываемая вкладка была активной, сбрасываем активный ID
		// В будущем можно делать активной соседнюю вкладку
		const newActiveId = state.activeSessionId === sessionId ? null : state.activeSessionId;

		return {
			sessions: remainingSessions,
			activeSessionId: newActiveId,
		};
	}),

	// Остальные функции без изменений...
	addMessage: (sessionId, messageData) => set((state) => {
		const session = state.sessions[sessionId];
		if (!session) return {};

		const newMessage: Message = { ...messageData, id: uuidv4() };
		
		const updatedSession: ChatSession = {
			...session,
			messages: [...session.messages, newMessage],
			totalTokenCount: session.totalTokenCount + newMessage.tokenCount,
		};

		return {
			sessions: { ...state.sessions, [sessionId]: updatedSession },
		};
	}),

	editMessage: (sessionId, messageId, newContent) => set(state => {
		const session = state.sessions[sessionId];
		if (!session) return {};
		const updatedMessages = session.messages.map(msg => 
			msg.id === messageId ? { ...msg, content: newContent } : msg
		);
		return {
			sessions: { ...state.sessions, [sessionId]: { ...session, messages: updatedMessages } },
		};
	}),

	deleteMessage: (sessionId, messageId) => set(state => {
		const session = state.sessions[sessionId];
		if (!session) return {};
		const messageToDelete = session.messages.find(m => m.id === messageId);
		if (!messageToDelete) return {};
		const updatedMessages = session.messages.filter(msg => msg.id !== messageId);
		return {
			sessions: { 
				...state.sessions, 
				[sessionId]: { 
					...session, 
					messages: updatedMessages,
					totalTokenCount: session.totalTokenCount - messageToDelete.tokenCount,
				} 
			},
		};
	}),

	deleteTurn: (sessionId, turn) => set(state => {
		const session = state.sessions[sessionId];
		if (!session) return {};
		const messagesToKeep = session.messages.filter(msg => msg.turn !== turn);
		const messagesToDelete = session.messages.filter(msg => msg.turn === turn);
		const deletedTokens = messagesToDelete.reduce((sum, msg) => sum + msg.tokenCount, 0);
		return {
			sessions: { 
				...state.sessions, 
				[sessionId]: { 
					...session, 
					messages: messagesToKeep,
					totalTokenCount: session.totalTokenCount - deletedTokens,
				} 
			},
		};
	}),

	updateTokenCount: (sessionId, messageId, count) => set(state => {
		const session = state.sessions[sessionId];
		if (!session) return {};
		let oldTokenCount = 0;
		const updatedMessages = session.messages.map(msg => {
			if (msg.id === messageId) {
				oldTokenCount = msg.tokenCount;
				return { ...msg, tokenCount: count };
			}
			return msg;
		});
		const tokenDiff = count - oldTokenCount;
		return {
			sessions: { 
				...state.sessions, 
				[sessionId]: { 
					...session, 
					messages: updatedMessages,
					totalTokenCount: session.totalTokenCount + tokenDiff,
				} 
			},
		};
	}),
}));