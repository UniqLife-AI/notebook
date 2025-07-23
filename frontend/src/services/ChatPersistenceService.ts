import yaml from 'js-yaml';
// ИСПРАВЛЕНИЕ: Импортируем типы из нового, единого хранилища useAppStore.
import { ChatSession, Message } from '../store/useAppStore';

const FRONTMATTER_REGEX = /---\n([\s\S]*?)\n---/;
const MESSAGE_REGEX = /### (\d+):(user|assistant)(?: @ (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z))?\n([\s\S]*?)(?=\n###|$)/g;
const TOKEN_COUNT_REGEX = /\(Токенов: (\d+)\)$/;

/**
 * Сервис для работы с персистентностью чатов.
 * Намерение: инкапсулировать логику преобразования между объектом ChatSession в памяти
 * и его текстовым представлением в формате Markdown с YAML Frontmatter для хранения на диске.
 */
class ChatPersistenceService {
	/**
	 * Парсит сырое содержимое .md файла в объект ChatSession.
	 * Намерение: восстановить состояние чата из файла. Метод должен быть устойчив
	 * к ошибкам формата и отсутствию некоторых полей.
	 */
	public static parse(id: string, rawContent: string): ChatSession | null {
		try {
			const match = rawContent.match(FRONTMATTER_REGEX);
			if (!match || !match[1]) { return null; }
			const metadata = yaml.load(match[1]) as Omit<ChatSession, 'id' | 'messages' | 'totalTokenCount'>;
			const messagesContent = rawContent.substring(match[0].length).trim();
			const messages: Message[] = [];
			let messageMatch;
			let totalTokenCount = 0;
			while ((messageMatch = MESSAGE_REGEX.exec(messagesContent)) !== null) {
				const [, turn, role, createdAtISO, contentBlock] = messageMatch;
				const tokenMatch = contentBlock.match(TOKEN_COUNT_REGEX);
				const tokenCount = tokenMatch ? parseInt(tokenMatch[1], 10) : 0;
				const content = contentBlock.replace(TOKEN_COUNT_REGEX, '').trim();
				messages.push({
					id: `msg-${id}-${turn}-${role}`,
					turn: parseInt(turn, 10),
					role: role as 'user' | 'assistant',
					content,
					tokenCount,
					createdAt: createdAtISO || new Date().toISOString(),
				});
				totalTokenCount += tokenCount;
			}
			return { id, ...metadata, messages, totalTokenCount };
		} catch (error) {
			console.error(`Ошибка парсинга сессии чата из ${id}:`, error);
			return null;
		}
	}

	/**
	 * Сериализует объект ChatSession в строку для сохранения в .md файл.
	 * Намерение: преобразовать состояние чата в памяти в человекочитаемый и
	 * машиночитаемый формат, который может быть сохранен на диск.
	 */
	public static serialize(session: ChatSession): string {
		const { id, messages, totalTokenCount, ...metadata } = session;
		const frontmatter = yaml.dump(metadata);
		const messagesContent = messages.map((msg: Message) => 
			`### ${msg.turn}:${msg.role} @ ${msg.createdAt}\n${msg.content}\n\n(Токенов: ${msg.tokenCount})`
		).join('\n\n');
		return `---\n${frontmatter.trim()}\n---\n\n${messagesContent.trim()}`;
	}
}

export default ChatPersistenceService;