// File Name: src/store/useChatSessionStore.ts

import { create } from 'zustand';
import { fileSystemService } from '@/services/FileSystemService';
import { parserService, type ChatSession } from '@/services/ParserService';
import { type Message } from 'ai/react';

export interface FileContentContext {
    fileName: string;
    content: string;
}

const sanitizeFileName = (name: string): string => {
    return name.replace(/[<>:"/\\|?*]/g, '').trim();
};

const WIKI_LINK_REGEX = /\[\[([^|\]\n]+)(?:\|([^\]\n]+))?\]\]/g;

const buildBacklinksIndex = (sessions: ChatSession[]): Map<string, Set<string>> => {
    const index = new Map<string, Set<string>>();
    
    for (const session of sessions) {
        if (session.type !== 'note') continue;

        const links = [...session.rawContent.matchAll(WIKI_LINK_REGEX)];
        
        for (const match of links) {
            const linkedNoteName = sanitizeFileName(match[1]);
            if (!linkedNoteName) continue;

            const currentNoteName = session.label;

            // ИСПРАВЛЕНИЕ: Приводим ключ к нижнему регистру для регистронезависимости
            const key = linkedNoteName.toLowerCase();

            if (!index.has(key)) {
                index.set(key, new Set());
            }
            index.get(key)!.add(currentNoteName);
        }
    }
    return index;
};


interface ChatSessionState {
    sessions: ChatSession[];
    activeSessionId: string | null;
    isProjectOpen: boolean;
    projectName: string | null;
    projectFileTreeContext: string | null;
    fileContentContext: FileContentContext[];
    backlinksIndex: Map<string, Set<string>>;

    loadSessions: () => Promise<void>;
    setActiveSessionId: (id: string | null) => void;
    getActiveSession: () => ChatSession | undefined;
    updateSessionMessages: (sessionId: string, messages: Message[]) => void;
    createNewSession: (fileName:string) => Promise<void>;
    updateNoteContent: (sessionId: string, newContent: string) => Promise<void>;

    createNewNote: (fileName: string) => Promise<void>;
    openOrCreateNoteByName: (noteName: string) => Promise<void>;
    doesNoteExist: (noteName: string) => boolean;
    getBacklinksForNote: (noteName: string) => string[];

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
    backlinksIndex: new Map(),

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

            const newIndex = buildBacklinksIndex(loadedSessions);

            const currentActiveId = get().activeSessionId;
            const newActiveIdIsValid = loadedSessions.some(s => s.id === currentActiveId);

            set({
                sessions: loadedSessions,
                backlinksIndex: newIndex,
                isProjectOpen: fileSystemService.isProjectOpen(),
                projectName: fileSystemService.getCurrentDirectoryName(),
                activeSessionId: newActiveIdIsValid
                    ? currentActiveId
                    : (loadedSessions.length > 0 ? loadedSessions[0].id : null)
            });

        } catch (error) {
            console.error("Failed to load sessions:", error);
            set({ sessions: [], activeSessionId: null, projectName: null, isProjectOpen: false, backlinksIndex: new Map() });
        }
    },

    setActiveSessionId: (id) => set({ activeSessionId: id }),

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    },
    
    getBacklinksForNote: (noteName) => {
        const index = get().backlinksIndex;
        const sanitizedName = sanitizeFileName(noteName);
        // ИСПРАВЛЕНИЕ: Ищем по ключу в нижнем регистре
        const key = sanitizedName.toLowerCase();
        return index.has(key) ? Array.from(index.get(key)!) : [];
    },

    updateSessionMessages: async (sessionId, messages) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        const updatedSession: ChatSession = {
            ...session,
            messages,
            rawContent: parserService.stringifySession({ ...session, messages })
        };
        
        const newSessions = get().sessions.map(s => s.id === sessionId ? updatedSession : s);
        const newIndex = buildBacklinksIndex(newSessions);

        set({ sessions: newSessions, backlinksIndex: newIndex });
        
        await fileSystemService.writeFile(sessionId, updatedSession.rawContent);
    },

    createNewSession: async (fileName) => {
        const sanitizedName = sanitizeFileName(fileName);
        const newFileName = sanitizedName.endsWith('.md') ? sanitizedName : `${sanitizedName}.md`;
        if (get().sessions.some(s => s.id === newFileName)) {
            set({ activeSessionId: newFileName });
            return;
        }
        
        const initialContent = '### User\n\n';
        const newSession = parserService.parseFile(newFileName, initialContent);

        const newSessions = [...get().sessions, newSession];
        const newIndex = buildBacklinksIndex(newSessions);

        set({
            sessions: newSessions,
            activeSessionId: newFileName,
            backlinksIndex: newIndex
        });
        
        await fileSystemService.writeFile(newFileName, initialContent);
    },

    createNewNote: async (fileName) => {
        const sanitizedName = sanitizeFileName(fileName);
        const newFileName = sanitizedName.endsWith('.md') ? sanitizedName : `${sanitizedName}.md`;
        if (get().sessions.some(s => s.id === newFileName)) {
            set({ activeSessionId: newFileName });
            return;
        }

        const initialContent = '';
        const newSession = parserService.parseFile(newFileName, initialContent);
        
        const newSessions = [...get().sessions, newSession];
        const newIndex = buildBacklinksIndex(newSessions);

        set({
            sessions: newSessions,
            activeSessionId: newFileName,
            backlinksIndex: newIndex
        });

        await fileSystemService.writeFile(newFileName, initialContent);
    },
    
    doesNoteExist: (noteName) => {
        const sanitizedName = sanitizeFileName(noteName);
        return get().sessions.some(
            s => s.label.toLowerCase() === sanitizedName.toLowerCase()
        );
    },

    openOrCreateNoteByName: async (noteName) => {
        const sanitizedName = sanitizeFileName(noteName);
        if (!sanitizedName) return;

        if (get().doesNoteExist(sanitizedName)) {
            const existingSession = get().sessions.find(
                s => s.label.toLowerCase() === sanitizedName.toLowerCase()
            );
            if (existingSession) {
                set({ activeSessionId: existingSession.id });
            }
        } else {
            const newFileName = `${sanitizedName}.md`;
            await get().createNewNote(newFileName);
        }
    },

    updateNoteContent: async (sessionId, newContent) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.type !== 'note') return;
        
        const updatedSession = { ...session, rawContent: newContent };
        const newSessions = get().sessions.map(s => s.id === sessionId ? updatedSession : s);
        const newIndex = buildBacklinksIndex(newSessions);

        set({ sessions: newSessions, backlinksIndex: newIndex });
        
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