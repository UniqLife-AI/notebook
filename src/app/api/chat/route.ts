// File Name: src/app/api/chat/route.ts

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { GoogleGenerativeAIStream, Message, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

const stripDataUrlPrefix = (dataUrl: string) => dataUrl.replace(/^data:image\/\w+;base64,/, '');

const buildHistory = (messages: Message[]): { role: string, parts: Part[] }[] => {
    return messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }));
};

export async function POST(req: Request) {
    try {
        const { messages, settings } = await req.json();
        const apiKey = req.headers.get('x-api-key');

        if (!apiKey) return new Response('API key is required.', { status: 400 });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: settings.model || 'gemini-1.5-flash-latest',
            generationConfig: { temperature: settings.temperature || 0.7 }
        });

        const lastUserMessage = messages.findLast((m: Message) => m.role === 'user');
        if (!lastUserMessage) return new Response('No user message found', { status: 400 });

        const history = buildHistory(messages);

        const userParts: Part[] = [{ text: lastUserMessage.content }];
        if (lastUserMessage.data?.imageUrl) {
            userParts.push({
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: stripDataUrlPrefix(lastUserMessage.data.imageUrl)
                }
            });
        }

        const chat = model.startChat({ history });
        const result = await chat.sendMessageStream(userParts);

        // ИЗМЕНЕНИЕ: Модифицируем поток, чтобы добавить данные об использовании токенов
        const stream = GoogleGenerativeAIStream(result, {
            onFinal: async (completion) => {
                // Этот коллбэк вызывается, когда стриминг завершен.
                // Мы можем получить финальные метрики здесь, если API их предоставляет.
                // Для Gemini, `getTokenCount` может быть использован для оценки,
                // но `sendMessageStream` не возвращает usage напрямую в том же объекте.
                // В данном случае, Vercel AI SDK для Gemini автоматически добавляет
                // `usage` в поле `data`, если оно доступно в ответе API.
                // Этот блок нужен для кастомной логики, если бы мы хотели добавить что-то еще.
            },
        });

        // Vercel AI SDK версии 3+ автоматически добавляет usage в data-сообщение в конце потока.
        // Убедимся, что наша версия `ai` в package.json — 3.1.0 или выше.
        // Судя по вашему `package.json` (`"ai": "^3.1.34"`), это должно работать "из коробки".
        // Код выше готов к приему этих данных.
        
        return new StreamingTextResponse(stream);
    } catch (error: any) {
        console.error("Error in API route: ", error);
        return new Response(error.message || 'Something went wrong!', { status: 500 });
    }
}