// File Name: src/store/useChatSessionStore.ts

import { create } from 'zustand';
import { fileSystemService } from '@/services/FileSystemService';
import { parserService, type ChatSession } from '@/services/ParserService';
import { type Message } from 'ai/react';

export interface FileContentContext {
    fileName: string;
    content: string;
}

interface ChatSessionState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isProjectOpen: boolean;
    projectName: string | null;
    projectFileTreeContext: string | null;
    fileContentContext: FileContentContext[];

    loadSessions: () => Promise<void>;
    setActiveSessionId: (id: string | null) => void;
    getActiveSession: () => ChatSession | undefined;
    updateSessionMessages: (sessionId: string, messages: Message[]) => void;
    createNewSession: (fileName: string) => Promise<void>;
    updateNoteContent: (sessionId: string, newContent: string) => Promise<void>;

    openProject: () => Promise<void>;
    closeProject: () => Promise<void>;
    setProjectFileTreeContext: (context: string | null) => void;
    addFileToContext: (file: FileContentContext) => void;
    removeFileFromContext: (fileName: string) => void;
    clearFileContext: () => void;
}

export const useChatSessionStore = create<ChatSessionState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    isProjectOpen: false,
    projectName: null,
    projectFileTreeContext: null,
    fileContentContext: [],

    loadSessions: async () => {
        try {
            const fileList = await fileSystemService.listFiles();
            const loadedSessions: ChatSession[] = [];
            for (const file of fileList) {
                if (file.kind === 'file' && file.name.endsWith('.md')) {
                    const content = await fileSystemService.readFile(file.name);
                    const session = parserService.parseFile(file.name, content);
                    loadedSessions.push(session);
                }
            }

            const currentActiveId = get().activeSessionId;
            const newActiveIdIsValid = loadedSessions.some(s => s.id === currentActiveId);

            set({
                sessions: loadedSessions,
                isProjectOpen: fileSystemService.isProjectOpen(),
                projectName: fileSystemService.getCurrentDirectoryName(),
                activeSessionId: newActiveIdIsValid
                    ? currentActiveId
                    : (loadedSessions.length > 0 ? loadedSessions[0].id : null)
            });

        } catch (error) {
            console.error("Failed to load sessions:", error);
            set({ sessions: [], activeSessionId: null, projectName: null, isProjectOpen: false });
        }
    },

    setActiveSessionId: (id) => set({ activeSessionId: id }),

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    },

    updateSessionMessages: async (sessionId, messages) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        // Создаем обновленную сессию для консистентности данных
        const updatedSession: ChatSession = {
            ...session,
            messages,
            // Обновляем rawContent на основе новых сообщений
            rawContent: parserService.stringifySession({ ...session, messages })
        };

        set(state => ({
            sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s)
        }));
        
        await fileSystemService.writeFile(sessionId, updatedSession.rawContent);
    },

    createNewSession: async (fileName) => {
        const newFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
        if (get().sessions.some(s => s.id === newFileName)) {
            set({ activeSessionId: newFileName });
            return;
        }
        
        // ИСПРАВЛЕНИЕ: Создаем объект, который будет корректно распознан парсером
        const initialContent = '### User\n\n';
        const initialMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: '' // Пустой контент для нового чата
        };

        const newSession: ChatSession = {
            id: newFileName,
            label: newFileName.replace('.md', ''),
            type: 'chat',
            rawContent: initialContent,
            metadata: {},
            messages: [initialMessage],
        };

        set(state => ({
            sessions: [...state.sessions, newSession],
            activeSessionId: newFileName
        }));
        
        await fileSystemService.writeFile(newFileName, initialContent);
    },

    updateNoteContent: async (sessionId, newContent) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.type !== 'note') return;
        const updatedSession = { ...session, rawContent: newContent };
        set(state => ({
            sessions: state.sessions.map(s => s.id === sessionId ? updatedSession : s)
        }));
        await fileSystemService.writeFile(sessionId, newContent);
    },

    openProject: async () => {
        await fileSystemService.openProjectDirectory();
        await get().loadSessions();
    },

    closeProject: async () => {
        fileSystemService.closeProjectDirectory();
        set({ projectFileTreeContext: null });
        await get().loadSessions();
    },

    setProjectFileTreeContext: (context) => set({ projectFileTreeContext: context }),
    
    addFileToContext: (file) => set(state => ({
        fileContentContext: state.fileContentContext.some(f => f.fileName === file.fileName)
            ? state.fileContentContext
            : [...state.fileContentContext, file]
    })),
    removeFileFromContext: (fileName) => set(state => ({
        fileContentContext: state.fileContentContext.filter(f => f.fileName !== fileName)
    })),
    clearFileContext: () => set({ fileContentContext: [] }),
}));