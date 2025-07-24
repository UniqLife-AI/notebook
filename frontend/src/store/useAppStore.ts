// File: frontend/src/store/useAppStore.ts
// Намерение: Восстановить недостающие определения интерфейсов и экспортировать их,
// чтобы исправить все ошибки компиляции типов.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { SaveChatSession, DeleteChatSession } from 'wailsjs/go/main/App.js';
import ChatPersistenceService from '@/services/ChatPersistenceService';

// ИСПРАВЛЕНИЕ: Добавлены недостающие определения интерфейсов и ключевое слово `export`.
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
    closeChatView: (viewId: string) => void;
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

            closeChatView: (viewId) => {
                set(state => {
                    const remainingViews = state.openViews.filter((v) => v.id !== viewId);
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
                    return { sessions: remainingSessions, openViews: remainingViews, activeViewId: nextActiveId };
                });
            },

            hydrateSessions: (newlyLoadedSessions) => {
                set(state => {
                    const newSessionsRecord = newlyLoadedSessions.reduce((acc, session) => { acc[session.id] = session; return acc; }, {} as Record<string, ChatSession>);
                    const newChatViews = newlyLoadedSessions.map(session => ({ id: session.id, type: 'chat' as const, title: session.title }));
                    const existingFileViews = state.openViews.filter(view => view.type === 'file');
                    const combinedViews = [...existingFileViews, ...newChatViews];
                    let nextActiveId = state.activeViewId;
                    if (!nextActiveId && combinedViews.length > 0) {
                        nextActiveId = combinedViews[0].id;
                    } else if (nextActiveId && !combinedViews.find(v => v.id === nextActiveId)) {
                        nextActiveId = combinedViews.length > 0 ? combinedViews[0].id : null;
                    }
                    return { sessions: newSessionsRecord, openViews: combinedViews, activeViewId: nextActiveId };
                });
            },

            addSession: async (sessionData) => {
                const newSession: ChatSession = { ...sessionData, messages: [], contextFilePaths: [], totalTokenCount: 0 };
                set((state) => ({ sessions: { ...state.sessions, [newSession.id]: newSession } }));
                await _saveSession(newSession);
                return newSession;
            },

            addMessage: async (sessionId, messageData) => {
                const session = get().sessions[sessionId];
                if (!session) return;
                const newMessage: Message = { ...messageData, id: uuidv4(), createdAt: new Date().toISOString() };
                const updatedSession = { ...session, messages: [...session.messages, newMessage], totalTokenCount: (session.totalTokenCount || 0) + newMessage.tokenCount };
                set((state) => ({ sessions: { ...state.sessions, [sessionId]: updatedSession } }));
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