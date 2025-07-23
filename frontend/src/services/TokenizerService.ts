import { Tiktoken, get_encoding } from 'tiktoken'; // <-- ИСПРАВЛЕНО: getEncoding -> get_encoding

/**
 * @class TokenizerService
 * @description Инкапсулирует логику работы с токенизатором tiktoken.
 * Предоставляет статические методы для инициализации и подсчета токенов.
 */
class TokenizerService {
	private static tokenizer: Tiktoken | null = null;

	/**
	 * @method init
	 * @description Асинхронно загружает и инициализирует токенизатор.
	 * Должен быть вызван один раз при старте приложения.
	 */
	public static async init(): Promise<void> {
		try {
			if (this.tokenizer) {
				console.log('Tokenizer already initialized.');
				return;
			}
			console.log('Initializing tokenizer...');
			// ИСПОЛЬЗУЕМ КОРРЕКТНОЕ ИМЯ ФУНКЦИИ
			this.tokenizer = await get_encoding('cl100k_base'); // <-- ИСПРАВЛЕНО
			console.log('Tokenizer initialized successfully.');
		} catch (error) {
			console.error('Failed to initialize tokenizer:', error);
		}
	}

	/**
	 * @method countTokens
	 * @param text - Входная строка для подсчета токенов.
	 * @returns {number} - Количество токенов в строке.
	 * @description Подсчитывает токены. Если токенизатор еще не готов,
	 * временно возвращает 0, чтобы избежать ошибок.
	 */
	public static countTokens(text: string): number {
		if (!this.tokenizer) {
			return 0;
		}
		return this.tokenizer.encode(text).length;
	}
}

export default TokenizerService;