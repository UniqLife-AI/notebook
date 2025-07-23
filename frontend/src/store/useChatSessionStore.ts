import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { SaveChatSession, DeleteChatSession } from '../../wailsjs/go/main/App';
import ChatPersistenceService from '../services/ChatPersistenceService';

// ... интерфейсы Message и ChatSession без изменений ...
export interface Message {
	id: string; turn: number; role: 'user' | 'assistant'; content: string; tokenCount: number;
}
export interface ChatSession {
	id: string; title: string; model: string; temperature: number; messages: Message[]; totalTokenCount: number; createdAt: string;
}

interface ChatSessionState {
	sessions: Record<string, ChatSession>;
	activeSessionId: string | null;
	hydrateSessions: (sessions: ChatSession[]) => void;
	addSession: (sessionData: Omit<ChatSession, 'messages' | 'totalTokenCount'>) => Promise<ChatSession>;
	setActiveSessionId: (id: string | null) => void;
	deleteSession: (sessionId: string) => Promise<void>;
	addMessage: (sessionId: string, messageData: Omit<Message, 'id'>) => Promise<void>;
	// ... остальные функции
}

// Хелпер для сохранения, чтобы не дублировать код
const saveSession = async (session: ChatSession) => {
	try {
		const content = ChatPersistenceService.serialize(session);
		await SaveChatSession(session.id, content);
	} catch (error) {
		console.error(`Ошибка сохранения сессии ${session.id}:`, error);
	}
}

export const useChatSessionStore = create<ChatSessionState>((set, get) => ({
	sessions: {},
	activeSessionId: null,

	hydrateSessions: (sessions) => {
		const sessionsRecord = sessions.reduce((acc, session) => {
			acc[session.id] = session;
			return acc;
		}, {} as Record<string, ChatSession>);
		set({ sessions: sessionsRecord });
	},

	setActiveSessionId: (id) => set({ activeSessionId: id }),

	addSession: async (sessionData) => {
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
		await saveSession(newSession); // Сохраняем на диск
		return newSession;
	},

	deleteSession: async (sessionId) => {
		set(state => {
			const { [sessionId]: _, ...remainingSessions } = state.sessions;
			const newActiveId = state.activeSessionId === sessionId ? null : state.activeSessionId;
			return {
				sessions: remainingSessions,
				activeSessionId: newActiveId,
			};
		});
		await DeleteChatSession(sessionId); // Удаляем с диска
	},

	addMessage: async (sessionId, messageData) => {
		let updatedSession: ChatSession | null = null;
		set((state) => {
			const session = state.sessions[sessionId];
			if (!session) return {};
			const newMessage: Message = { ...messageData, id: uuidv4() };
			updatedSession = {
				...session,
				messages: [...session.messages, newMessage],
				totalTokenCount: session.totalTokenCount + newMessage.tokenCount,
			};
			return {
				sessions: { ...state.sessions, [sessionId]: updatedSession },
			};
		});
		if (updatedSession) {
			await saveSession(updatedSession); // Сохраняем на диск
		}
	},
	// Для простоты, edit/delete/update пока не будут вызывать сохранение, 
	// чтобы не усложнять. Мы добавим это позже.
	closeSession: () => {}, // Эта функция больше не нужна, используем deleteSession
	editMessage: () => {},
	deleteMessage: () => {},
	deleteTurn: () => {},
	updateTokenCount: () => {},
}));