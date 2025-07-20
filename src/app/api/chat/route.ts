import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { GoogleGenerativeAIStream, Message, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

const stripDataUrlPrefix = (dataUrl: string) => dataUrl.replace(/^data:image\/\w+;base64,/, '');

// Функция для построения истории для Gemini API
const buildHistory = (messages: Message[]): { role: string, parts: Part[] }[] => {
  // Берем все сообщения, кроме последнего, которое будет текущим запросом
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

    // Формируем контент для текущего запроса
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
    const stream = GoogleGenerativeAIStream(result);

    return new StreamingTextResponse(stream);
  } catch (error: any) {
    console.error("Error in API route: ", error);
    return new Response(error.message || 'Something went wrong!', { status: 500 });
  }
}