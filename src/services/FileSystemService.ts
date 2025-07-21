// File Name: src/services/FileSystemService.ts

import { get, set, del } from 'idb-keyval';

const DEFAULT_HANDLE_KEY = 'default-directory-handle';

class FileSystemService {
    private defaultDirectoryHandle: FileSystemDirectoryHandle | null = null;
    private projectDirectoryHandle: FileSystemDirectoryHandle | null = null;

    async initialize(): Promise<boolean> {
        const handle = await get<FileSystemDirectoryHandle>(DEFAULT_HANDLE_KEY);
        if (!handle) {
            console.log('No default handle found. User needs to select a directory.');
            return false;
        }

        const permissionStatus = await handle.queryPermission({ mode: 'readwrite' });
        if (permissionStatus === 'granted') {
            console.log('Permission already granted for default handle.');
            this.defaultDirectoryHandle = handle;
            return true;
        }

        console.log(`Initial permission status is '${permissionStatus}'. A user action is required to request permission.`);
        this.defaultDirectoryHandle = handle;
        return false;
    }

    async promptAndSetDirectory(): Promise<FileSystemDirectoryHandle | null> {
        try {
            const handle = await window.showDirectoryPicker();
            if (await this.requestPermission(handle)) {
                this.defaultDirectoryHandle = handle;
                await set(DEFAULT_HANDLE_KEY, handle);
                // При смене основной директории, закрываем текущий проект
                this.closeProjectDirectory();
                return handle;
            }
            return null;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return null;
            }
            console.error('Error picking default directory:', error);
            return null;
        }
    }

    async openProjectDirectory(): Promise<FileSystemDirectoryHandle | null> {
        try {
            const handle = await window.showDirectoryPicker();
            if (await this.requestPermission(handle)) {
                this.projectDirectoryHandle = handle;
                return handle;
            }
            return null;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                return null;
            }
            console.error('Error picking project directory:', error);
            return null;
        }
    }

    private async requestPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
        const options = { mode: 'readwrite' as const };
        const status = await handle.queryPermission(options);
        if (status === 'granted') {
            return true;
        }
        if ((await handle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    }

    closeProjectDirectory(): void {
        this.projectDirectoryHandle = null;
    }

    getCurrentDirectoryName(): string | null {
        // Приоритет у имени проекта
        if (this.projectDirectoryHandle) {
            return this.projectDirectoryHandle.name;
        }
        if (this.defaultDirectoryHandle) {
            return this.defaultDirectoryHandle.name;
        }
        return null;
    }

    isProjectOpen(): boolean {
        return this.projectDirectoryHandle !== null;
    }
    
    // Новый приватный метод для получения текущей рабочей директории (либо глобальной, либо папки .ai-notebook/chats в проекте)
    private async getActiveDirectoryHandle(create = false): Promise<FileSystemDirectoryHandle> {
        if (this.projectDirectoryHandle) {
            // В режиме проекта работаем с .ai-notebook/chats
            const aiNotebookHandle = await this.projectDirectoryHandle.getDirectoryHandle('.ai-notebook', { create });
            return await aiNotebookHandle.getDirectoryHandle('chats', { create });
        }
        if (this.defaultDirectoryHandle) {
            // В глобальном режиме работаем с корневой папкой
            return this.defaultDirectoryHandle;
        }
        throw new Error('No active directory selected');
    }

    private async buildTree(dirHandle: FileSystemDirectoryHandle, prefix: string, ignore: Set<string>): Promise<string> {
        let tree = '';
        const entries: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];
        for await (const entry of dirHandle.values()) {
            if (!ignore.has(entry.name)) {
                entries.push(entry);
            }
        }

        entries.sort((a, b) => {
            if (a.kind === b.kind) return a.name.localeCompare(b.name);
            return a.kind === 'directory' ? -1 : 1;
        });

        for (const [index, entry] of entries.entries()) {
            const isLast = index === entries.length - 1;
            tree += `${prefix}${isLast ? '└── ' : '├── '}${entry.name}\n`;
            if (entry.kind === 'directory') {
                tree += await this.buildTree(entry, `${prefix}${isLast ? '    ' : '│   '}`, ignore);
            }
        }
        return tree;
    }

    async getProjectFileTree(): Promise<string | null> {
        // Дерево строится всегда от корня проекта, а не от папки чатов
        const handle = this.projectDirectoryHandle || this.defaultDirectoryHandle;
        if (!handle) {
            console.warn('No active directory to build file tree from.');
            return null;
        }
        const ignore = new Set(['.git', 'node_modules', '.DS_Store', '.vscode', 'dist', 'build', '.next', 'out', '.ai-notebook']);
        try {
            const tree = await this.buildTree(handle, '', ignore);
            return `\`\`\`\n${handle.name}/\n${tree}\`\`\``;
        } catch (error) {
            console.error('Failed to build file tree:', error);
            return null;
        }
    }

    async listFiles(): Promise<(FileSystemFileHandle | FileSystemDirectoryHandle)[]> {
        // Проверяем права на корневую папку, а не на папку чатов
        const rootHandle = this.projectDirectoryHandle || this.defaultDirectoryHandle;
        if (!rootHandle || (await rootHandle.queryPermission({mode: 'readwrite'})) !== 'granted') {
            return [];
        }
        try {
            // Получаем папку чатов (она будет создана, если не существует)
            const chatDir = await this.getActiveDirectoryHandle(true);
            const files: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];
            for await (const entry of chatDir.values()) {
                files.push(entry);
            }
            return files;
        } catch (e) {
            // Если папки .ai-notebook/chats еще нет, возвращаем пустой массив
            if (e instanceof DOMException && e.name === 'NotFoundError') {
                return [];
            }
            console.error("Error listing files:", e);
            return [];
        }
    }

    async readFile(fileName: string): Promise<string> {
        const chatDir = await this.getActiveDirectoryHandle(false);
        const fileHandle = await chatDir.getFileHandle(fileName, { create: false });
        const file = await fileHandle.getFile();
        return await file.text();
    }

    async writeFile(fileName: string, content: string): Promise<void> {
        const chatDir = await this.getActiveDirectoryHandle(true);
        const fileHandle = await chatDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async createDirectory(dirName: string): Promise<void> {
        const chatDir = await this.getActiveDirectoryHandle(true);
        await chatDir.getDirectoryHandle(dirName, { create: true });
    }

    async removeEntry(name: string, recursive: boolean): Promise<void> {
        const chatDir = await this.getActiveDirectoryHandle(false);
        await chatDir.removeEntry(name, { recursive });
    }
}

export const fileSystemService = new FileSystemService();