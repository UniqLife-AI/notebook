// File Name: src/services/FileSystemService.ts

import { get, set, del } from 'idb-keyval';

const DEFAULT_HANDLE_KEY = 'default-directory-handle';

class FileSystemService {
    private defaultDirectoryHandle: FileSystemDirectoryHandle | null = null;
    private projectDirectoryHandle: FileSystemDirectoryHandle | null = null;

    private get activeHandle(): FileSystemDirectoryHandle | null {
        return this.projectDirectoryHandle || this.defaultDirectoryHandle;
    }

    // ИЗМЕНЕНИЕ: Логика инициализации теперь только проверяет права, а не запрашивает их.
    async initialize(): Promise<boolean> {
        const handle = await get<FileSystemDirectoryHandle>(DEFAULT_HANDLE_KEY);
        if (!handle) {
            console.log('No default handle found. User needs to select a directory.');
            return false;
        }

        // Проверяем текущий статус разрешений без запроса
        const permissionStatus = await handle.queryPermission({ mode: 'readwrite' });
        if (permissionStatus === 'granted') {
            console.log('Permission already granted for default handle.');
            this.defaultDirectoryHandle = handle;
            return true;
        }

        // Если права не предоставлены (prompt или denied), мы не можем их запросить при загрузке.
        // Пользователь должен будет инициировать действие сам.
        console.log(`Initial permission status is '${permissionStatus}'. A user action is required to request permission.`);
        // Мы можем сохранить хэндл, но приложение не будет полностью функционально до получения прав.
        this.defaultDirectoryHandle = handle;
        // Возвращаем false, т.к. приложение не готово к полноценной работе.
        // Это заставит пользователя увидеть диалог SetupDirectoryDialog, если он снова откроет приложение.
        // Или мы можем вернуть true и обрабатывать отсутствие прав в UI.
        // Для нашей логики, если прав нет, лучше показать начальный диалог.
        return false;
    }

    // Этот метод вызывается по клику, поэтому он может запрашивать права.
    async promptAndSetDirectory(): Promise<FileSystemDirectoryHandle | null> {
        try {
            const handle = await window.showDirectoryPicker();
            if (await this.requestPermission(handle)) {
                this.defaultDirectoryHandle = handle;
                await set(DEFAULT_HANDLE_KEY, handle);
                return handle;
            }
            return null;
        } catch (error) {
            // Ошибки, когда пользователь закрывает окно выбора, можно игнорировать
            if (error instanceof DOMException && error.name === 'AbortError') {
                return null;
            }
            console.error('Error picking default directory:', error);
            return null;
        }
    }

    // Этот метод тоже вызывается по клику.
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

    // Внутренний метод для запроса прав, вызывается только после действия пользователя.
    private async requestPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
        const options = { mode: 'readwrite' as const };
        const status = await handle.queryPermission(options);
        if (status === 'granted') {
            return true;
        }
        // Этот вызов требует активации пользователем.
        if ((await handle.requestPermission(options)) === 'granted') {
            return true;
        }
        return false;
    }

    closeProjectDirectory(): void {
        this.projectDirectoryHandle = null;
    }

    getCurrentDirectoryName(): string | null {
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
    
    // ... остальные методы без изменений ...

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
        if (!this.activeHandle) {
            console.warn('No active directory to build file tree from.');
            return null;
        }
        const ignore = new Set(['.git', 'node_modules', '.DS_Store', '.vscode', 'dist', 'build', '.next', 'out', '.ai-notebook']);
        try {
            const tree = await this.buildTree(this.activeHandle, '', ignore);
            return `\`\`\`\n${this.activeHandle.name}/\n${tree}\`\`\``;
        } catch (error) {
            console.error('Failed to build file tree:', error);
            return null;
        }
    }

    private async getChatDirectoryHandle(create = false): Promise<FileSystemDirectoryHandle> {
        if (!this.activeHandle) throw new Error('No active directory selected');

        if (this.projectDirectoryHandle) {
            const aiNotebookHandle = await this.projectDirectoryHandle.getDirectoryHandle('.ai-notebook', { create });
            return await aiNotebookHandle.getDirectoryHandle('chats', { create });
        }
        return this.activeHandle;
    }

    async listFiles(): Promise<(FileSystemFileHandle | FileSystemDirectoryHandle)[]> {
        if (!this.activeHandle || (await this.activeHandle.queryPermission({mode: 'readwrite'})) !== 'granted') {
            return [];
        }
        try {
            const chatDir = await this.getChatDirectoryHandle(false);
            const files: (FileSystemFileHandle | FileSystemDirectoryHandle)[] = [];
            for await (const entry of chatDir.values()) {
                files.push(entry);
            }
            return files;
        } catch (e) {
            return [];
        }
    }

    async readFile(fileName: string): Promise<string> {
        if (!this.activeHandle) throw new Error("No active directory to read from.");
        const chatDir = await this.getChatDirectoryHandle(false);
        const fileHandle = await chatDir.getFileHandle(fileName, { create: false });
        const file = await fileHandle.getFile();
        return await file.text();
    }

    async writeFile(fileName: string, content: string): Promise<void> {
        if (!this.activeHandle) throw new Error("No active directory to write to.");
        const chatDir = await this.getChatDirectoryHandle(true);
        const fileHandle = await chatDir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    }

    async createDirectory(dirName: string): Promise<void> {
        if (!this.activeHandle) throw new Error("No active directory to create a directory in.");
        const chatDir = await this.getChatDirectoryHandle(true);
        await chatDir.getDirectoryHandle(dirName, { create: true });
    }

    async removeEntry(name: string, recursive: boolean): Promise<void> {
        if (!this.activeHandle) throw new Error("No active directory to remove from.");
        const chatDir = await this.getChatDirectoryHandle(false);
        await chatDir.removeEntry(name, { recursive });
    }
}

export const fileSystemService = new FileSystemService();