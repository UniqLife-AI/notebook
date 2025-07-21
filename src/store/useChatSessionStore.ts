// File Name: src/store/useChatSessionStore.ts

import { create } from 'zustand';
import { fileSystemService } from '@/services/FileSystemService';
import { parserService, type ChatSession } from '@/services/ParserService';
import { type Message } from 'ai/react';

export interface FileContentContext {
    fileName: string;
    content: string;
}

export interface Backlink {
    sourceNote: string;
    type: string | null;
}

const sanitizeFileName = (name: string): string => {
    return name.replace(/[<>:"/\\|?*]/g, '').trim();
};

const WIKI_LINK_REGEX = /\[\[(?:([a-zA-Z\s]+)::)?([^|#\]\n]+)(?:#([^|\]\n]+))?(?:\|([^\]\n]+))?\]\]/g;

const buildBacklinksIndex = (sessions: ChatSession[]): Map<string, Set<Backlink>> => {
    const index = new Map<string, Set<Backlink>>();
    
    for (const session of sessions) {
        if (session.type !== 'note') continue;

        const links = [...session.rawContent.matchAll(WIKI_LINK_REGEX)];
        
        for (const match of links) {
            const semanticType = match[1]?.trim() || null;
            const linkedNoteName = sanitizeFileName(match[2]);
            if (!linkedNoteName) continue;

            const currentNoteName = session.label;
            const key = linkedNoteName.toLowerCase();

            if (!index.has(key)) {
                index.set(key, new Set());
            }
            index.get(key)!.add({ sourceNote: currentNoteName, type: semanticType });
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
    backlinksIndex: Map<string, Set<Backlink>>;
    scrollToHeading: string | null;

    loadSessions: () => Promise<void>;
    setActiveSessionId: (id: string | null) => void;
    getActiveSession: () => ChatSession | undefined;
    updateSessionMessages: (sessionId: string, messages: Message[]) => void;
    // ИЗМЕНЕНИЕ: Сигнатура изменена для опционального имени файла
    createNewSession: (fileName?: string) => Promise<void>;
    updateNoteContent: (sessionId: string, newContent: string) => Promise<void>;

    createNewNote: (fileName: string) => Promise<void>;
    openOrCreateNoteByName: (noteName: string, heading: string | null) => Promise<void>;
    doesNoteExist: (noteName: string) => boolean;
    getBacklinksForNote: (noteName: string) => Backlink[];
    clearScrollToHeading: () => void;

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
    scrollToHeading: null,

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

    setActiveSessionId: (id) => set({ activeSessionId: id, scrollToHeading: null }),

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    },
    
    getBacklinksForNote: (noteName) => {
        const index = get().backlinksIndex;
        const sanitizedName = sanitizeFileName(noteName);
        const key = sanitizedName.toLowerCase();
        return index.has(key) ? Array.from(index.get(key)!) : [];
    },

    clearScrollToHeading: () => set({ scrollToHeading: null }),

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

    // ИЗМЕНЕНИЕ: Логика создания чата полностью переработана
    createNewSession: async (fileName) => {
        let newFileName = fileName;

        // Если имя не предоставлено, генерируем его
        if (!newFileName) {
            let i = 1;
            do {
                newFileName = `Chat-${i}.md`;
                i++;
            } while (get().sessions.some(s => s.id === newFileName));
        } else {
            newFileName = newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`;
        }
        
        const sanitizedName = sanitizeFileName(newFileName);
        if (get().sessions.some(s => s.id === sanitizedName)) {
            set({ activeSessionId: sanitizedName });
            return;
        }
        
        // ИСПРАВЛЕНИЕ: Чат создается пустым, без начальных сообщений
        const initialContent = '';
        const newSession: ChatSession = {
            id: sanitizedName,
            label: sanitizedName.replace('.md', ''),
            type: 'chat',
            rawContent: initialContent,
            metadata: {},
            messages: [], // Пустой массив сообщений
        };

        const newSessions = [...get().sessions, newSession];
        const newIndex = buildBacklinksIndex(newSessions);

        set({
            sessions: newSessions,
            activeSessionId: sanitizedName,
            backlinksIndex: newIndex
        });
        
        await fileSystemService.writeFile(sanitizedName, initialContent);
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

    openOrCreateNoteByName: async (noteName, heading) => {
        const sanitizedName = sanitizeFileName(noteName);
        if (!sanitizedName) return;

        const slug = heading 
            ? heading.trim().toLowerCase().replace(/\s+/g, '-') 
            : null;

        if (get().doesNoteExist(sanitizedName)) {
            const existingSession = get().sessions.find(
                s => s.label.toLowerCase() === sanitizedName.toLowerCase()
            );
            if (existingSession) {
                set({ activeSessionId: existingSession.id, scrollToHeading: slug });
            }
        } else {
            const newFileName = `${sanitizedName}.md`;
            await get().createNewNote(newFileName);
            set({ scrollToHeading: null });
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