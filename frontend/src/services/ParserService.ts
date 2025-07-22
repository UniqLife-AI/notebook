// File Name: src/services/ParserService.ts

import { type Message } from 'ai/react';

const extractFrontmatter = (content: string): Record<string, any> => {
    const match = content.match(/^---\n([\s\S]+?)\n---/);
    return match ? { raw: match[1] } : {};
};

const parseContentToMessages = (content: string): Message[] => {
    const contentWithoutFrontmatter = content.replace(/^---\n[\s\S]+?\n---/, '').trim();
    if (!contentWithoutFrontmatter) {
        return [];
    }
    const lines = contentWithoutFrontmatter.split('\n');
    const messages: Message[] = [];
    let currentMessage: { role: 'user' | 'assistant'; content: string } | null = null;
    for (const line of lines) {
        const userMatch = line.match(/^### (User)$/);
        const assistantMatch = line.match(/^### (Assistant)$/);
        if (userMatch) {
            if (currentMessage) {
                messages.push({ ...currentMessage, id: `msg-${Date.now()}-${messages.length}`, content: currentMessage.content.trim() });
            }
            currentMessage = { role: 'user', content: '' };
        } else if (assistantMatch) {
            if (currentMessage) {
                messages.push({ ...currentMessage, id: `msg-${Date.now()}-${messages.length}`, content: currentMessage.content.trim() });
            }
            currentMessage = { role: 'assistant', content: '' };
        } else if (currentMessage) {
            currentMessage.content += line + '\n';
        }
    }
    if (currentMessage) {
        messages.push({ ...currentMessage, id: `msg-${Date.now()}-${messages.length}`, content: currentMessage.content.trim() });
    }
    return messages;
};

const stringifyMessagesToContent = (messages: Message[]): string => {
    return messages.map(msg => `### ${msg.role === 'user' ? 'User' : 'Assistant'}\n\n${msg.content}`).join('\n\n\n');
};

class ParserService {
    parseFile(filePath: string, fileContent: string): ChatSession {
        const fileName = filePath.split('/').pop() || filePath;
        const label = fileName.endsWith('.md') ? fileName.slice(0, -3) : fileName;
        
        const contentAfterFrontmatter = fileContent.replace(/^---\n[\s\S]+?\n---/, '').trim();
        const isChat = contentAfterFrontmatter.startsWith('### User') || contentAfterFrontmatter.startsWith('### Assistant');
        
        return {
            id: filePath,
            label: label,
            type: isChat ? 'chat' : 'note',
            rawContent: fileContent,
            metadata: extractFrontmatter(fileContent),
            messages: isChat ? parseContentToMessages(fileContent) : [],
        };
    }

    stringifySession(session: ChatSession): string {
        if (session.type === 'note') {
            return session.rawContent;
        }
        const frontmatter = session.metadata.raw ? `---\n${session.metadata.raw}\n---\n\n` : '';
        const content = stringifyMessagesToContent(session.messages);
        return frontmatter + content;
    }
}

export interface ChatSession {
    id: string;
    label: string;
    type: 'chat' | 'note';
    rawContent: string;
    metadata: Record<string, any>;
    messages: Message[];
}

export const parserService = new ParserService();