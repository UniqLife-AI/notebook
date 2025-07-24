// File: frontend/src/services/ChatPersistenceService.ts
// Намерение: Полностью переписать логику парсинга и сериализации для
// поддержки нового, надежного формата хранения метаданных сообщения.
// Это устранит баг с дублированием информации о токенах.

import yaml from 'js-yaml';
import { ChatSession, Message } from '../store/useAppStore';

// ИЗМЕНЕНИЕ: Новый, более сложный и надежный регекс для парсинга сообщений.
const MESSAGE_REGEX = /^### (\d+):(user|assistant)\n---\s*\|\s*tokens:\s*(\d+)\s*\|\s*created:\s*([^\n]+)\n([\s\S]*?)(?=\n###|$)/gm;
const FRONTMATTER_REGEX = /---\n([\s\S]*?)\n---/;

class ChatPersistenceService {
    public static parse(id: string, rawContent: string): ChatSession | null {
        try {
            const frontmatterMatch = rawContent.match(FRONTMATTER_REGEX);
            if (!frontmatterMatch || !frontmatterMatch[1]) {
                console.error(`Ошибка парсинга: Frontmatter не найден в файле ${id}`);
                return null;
            }
            const metadata = yaml.load(frontmatterMatch[1]) as Omit<ChatSession, 'id' | 'messages' | 'totalTokenCount'>;
            const messagesContent = rawContent.substring(frontmatterMatch[0].length);
            
            const messages: Message[] = [];
            let totalTokenCount = 0;
            let messageMatch;

            while ((messageMatch = MESSAGE_REGEX.exec(messagesContent)) !== null) {
                const [, turn, role, tokenCountStr, createdAt, content] = messageMatch;
                const tokens = parseInt(tokenCountStr, 10);
                
                messages.push({
                    id: `msg-${id}-${turn}-${role}`,
                    turn: parseInt(turn, 10),
                    role: role as 'user' | 'assistant',
                    content: content.trim(),
                    tokenCount: tokens,
                    createdAt: createdAt.trim(),
                });
                totalTokenCount += tokens;
            }
            
            return { id, ...metadata, messages, totalTokenCount };
        } catch (error) {
            console.error(`Критическая ошибка парсинга сессии чата из ${id}:`, error);
            return null;
        }
    }

    public static serialize(session: ChatSession): string {
        const { id, messages, totalTokenCount, ...metadata } = session;
        const frontmatter = yaml.dump(metadata);

        const messagesContent = messages.map(msg => {
            // ИЗМЕНЕНИЕ: Формируем новую, надежную структуру сообщения.
            const header = `### ${msg.turn}:${msg.role}`;
            const metaLine = `--- | tokens: ${msg.tokenCount} | created: ${msg.createdAt}`;
            return `${header}\n${metaLine}\n${msg.content.trim()}`;
        }).join('\n\n');

        return `---\n${frontmatter.trim()}\n---\n\n${messagesContent.trim()}`;
    }
}

export default ChatPersistenceService;