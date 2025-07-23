// File: frontend/src/store/useAppStore.ts
// Намерение: Добавить ключевые отладочные логи в экшен closeChatView,
// чтобы увидеть, как меняется состояние `openViews` до и после удаления.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { SaveChatSession, DeleteChatSession } from '../../wailsjs/go/main/App';
import ChatPersistenceService from '../services/ChatPersistenceService';

export interface Message {
    id: string;
    turn: number;
    role: 'user' | 'assistant';
    content: string;
    tokenCount: number;
    createdAt: string;
}

export interface ChatSession {
    id: string;
    title: string;
    model: string;
    temperature: number;
    messages: Message[];
    createdAt: string;
    contextFilePaths: string[];
    totalTokenCount: number;
}

export interface View {
    id: string;
    type: 'file' | 'chat';
    title: string;
}

interface AppState {
    openViews: View[];
    activeViewId: string | null;
    sessions: Record<string, ChatSession>;
    openView: (view: View) => void;
    closeFileView: (viewId: string) => void;
    closeChatView: (viewId: string) => Promise<void>;
    setActiveView: (viewId: string | null) => void;
    hydrateSessions: (sessions: ChatSession[]) => void;
    addSession: (sessionData: Omit<ChatSession, 'messages' | 'contextFilePaths' | 'totalTokenCount'>) => Promise<ChatSession>;
    addMessage: (sessionId: string, messageData: Omit<Message, 'id' | 'createdAt'>) => Promise<void>;
}

const _saveSession = async (session: ChatSession) => {
    try {
        const content = ChatPersistenceService.serialize(session);
        await SaveChatSession(session.id, content);
    } catch (error) {
        console.error(`[useAppStore] Ошибка сохранения сессии ${session.id}:`, error);
    }
};

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            openViews: [],
            activeViewId: null,
            sessions: {},

            setActiveView: (viewId) => set({ activeViewId: viewId }),

            openView: (view) => {
                const { openViews } = get();
                if (openViews.find((v) => v.id === view.id)) {
                    set({ activeViewId: view.id });
                    return;
                }
                set((state) => ({
                    openViews: [...state.openViews, view],
                    activeViewId: view.id,
                }));
            },

            closeFileView: (viewId) => set(state => {
                const remainingViews = state.openViews.filter((v) => v.id !== viewId);
                let nextActiveId = state.activeViewId;
                if (state.activeViewId === viewId) {
                    if (remainingViews.length > 0) {
                        const currentIndex = state.openViews.findIndex((v) => v.id === viewId);
                        nextActiveId = remainingViews[Math.max(0, currentIndex - 1)].id;
                    } else {
                        nextActiveId = null;
                    }
                }
                return { openViews: remainingViews, activeViewId: nextActiveId };
            }),

            closeChatView: async (viewId) => {
                // ОТЛАДКА: Шаг 3 - Проверяем, что экшен в сторе был вызван.
                console.log(`[useAppStore] closeChatView вызван для viewId: ${viewId}`);
                try {
                    await DeleteChatSession(viewId);
                } catch (error) {
                    console.error(`Не удалось удалить файл для сессии ${viewId}:`, error);
                } finally {
                    set(state => {
                        // ОТЛАДКА: Шаг 4 - Самый важный лог. Смотрим на состояние ДО изменения.
                        console.log('[useAppStore] Состояние openViews ДО удаления:', JSON.stringify(state.openViews.map(v => v.id)));

                        const remainingViews = state.openViews.filter((v) => v.id !== viewId);
                        
                        // ОТЛАДКА: Шаг 5 - Смотрим на состояние ПОСЛЕ изменения.
                        console.log('[useAppStore] Состояние openViews ПОСЛЕ удаления:', JSON.stringify(remainingViews.map(v => v.id)));

                        const { [viewId]: _, ...remainingSessions } = state.sessions;
                        
                        let nextActiveId = state.activeViewId;
                        if (state.activeViewId === viewId) {
                            if (remainingViews.length > 0) {
                                const currentIndex = state.openViews.findIndex((v) => v.id === viewId);
                                nextActiveId = remainingViews[Math.max(0, currentIndex - 1)].id;
                            } else {
                                nextActiveId = null;
                            }
                        }
                        
                        // ОТЛАДКА: Шаг 6 - Какой ID будет следующим активным.
                        console.log(`[useAppStore] Следующий активный ID: ${nextActiveId}`);

                        return { 
                            sessions: remainingSessions, 
                            openViews: remainingViews, 
                            activeViewId: nextActiveId 
                        };
                    });
                }
            },

            hydrateSessions: (sessions) => {
                const sessionsRecord = sessions.reduce((acc, session) => {
                    acc[session.id] = session;
                    return acc;
                }, {} as Record<string, ChatSession>);
                set({ sessions: sessionsRecord });
            },

            addSession: async (sessionData) => {
                const newSession: ChatSession = {
                    ...sessionData,
                    messages: [],
                    contextFilePaths: [],
                    totalTokenCount: 0,
                };
                set((state) => ({
                    sessions: { ...state.sessions, [newSession.id]: newSession },
                }));
                await _saveSession(newSession);
                return newSession;
            },

            addMessage: async (sessionId, messageData) => {
                const session = get().sessions[sessionId];
                if (!session) return;
                const newMessage: Message = {
                    ...messageData,
                    id: uuidv4(),
                    createdAt: new Date().toISOString(),
                };
                const updatedSession = {
                    ...session,
                    messages: [...session.messages, newMessage],
                    totalTokenCount: (session.totalTokenCount || 0) + newMessage.tokenCount,
                };
                set((state) => ({
                    sessions: { ...state.sessions, [sessionId]: updatedSession },
                }));
                await _saveSession(updatedSession);
            },
        }),
        {
            name: 'app-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ 
                openViews: state.openViews,
                activeViewId: state.activeViewId,
            }),
        }
    )
);