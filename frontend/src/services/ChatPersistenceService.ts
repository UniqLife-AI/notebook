import yaml from 'js-yaml';
import { ChatSession, Message } from '../store/useChatSessionStore';

const FRONTMATTER_REGEX = /---\n([\s\S]*?)\n---/;
const MESSAGE_REGEX = /### (\d+):(user|assistant)\n([\s\S]*?)(?=\n### \d+:(?:user|assistant)|$)/g;
// ИСПРАВЛЕНИЕ: Корректное определение регулярного выражения
const TOKEN_COUNT_REGEX = /\(Токенов: (\d+)\)$/;;


class ChatPersistenceService {
	public static parse(id: string, rawContent: string): ChatSession | null {
		try {
			const match = rawContent.match(FRONTMATTER_REGEX);
			if (!match || !match[1]) {
				console.warn(`Некорректный frontmatter в файле чата: ${id}`);
				return null;
			}

			const metadata = yaml.load(match[1]) as Omit<ChatSession, 'id' | 'messages'>;
			
			const messagesContent = rawContent.substring(match[0].length).trim();
			const messages: Message[] = [];
			let messageMatch;
			
			while ((messageMatch = MESSAGE_REGEX.exec(messagesContent)) !== null) {
				const [, turn, role, contentBlock] = messageMatch;
				
				const tokenMatch = contentBlock.match(TOKEN_COUNT_REGEX);
				const tokenCount = tokenMatch ? parseInt(tokenMatch[1], 10) : 0;
				const content = contentBlock.replace(TOKEN_COUNT_REGEX, '').trim();

				messages.push({
					id: `msg-${id}-${turn}-${role}`,
					turn: parseInt(turn, 10),
					role: role as 'user' | 'assistant',
					content,
					tokenCount,
				});
			}

			return {
				id,
				...metadata,
				messages,
			};

		} catch (error) {
			console.error(`Ошибка парсинга сессии чата из ${id}:`, error);
			return null;
		}
	}

	public static serialize(session: ChatSession): string {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { id, messages, ...metadata } = session;
		const frontmatter = yaml.dump(metadata);

		const messagesContent = messages.map(msg => 
			`### ${msg.turn}:${msg.role}\n${msg.content}\n`
		).join('\n\n');

		return `---\n${frontmatter.trim()}\n---\n\n${messagesContent.trim()}`;
	}
}

export default ChatPersistenceService;