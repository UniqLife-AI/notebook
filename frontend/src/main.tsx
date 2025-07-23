// File: frontend/src/main.tsx
// Намерение: Этот файл теперь является ЕДИНСТВЕННОЙ точкой входа и местом
// для инициализации глобальных контекстов. Он оборачивает все приложение
// в провайдеры темы и уведомлений, устраняя дублирование и возможные конфликты.

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ThemeRegistry from './components/ThemeRegistry';
import { NotificationsProvider } from './components/NotificationsProvider';
import TokenizerService from './services/TokenizerService';
import './style.css';

// Намерение: Инициализировать сервис токенизатора при самом старте приложения.
TokenizerService.init().catch(error => {
    console.error("Ошибка инициализации сервиса токенизатора:", error);
});

const container = document.getElementById('root');
const root = createRoot(container!);

// Намерение: Отрендерить приложение с правильной иерархией.
// App теперь является дочерним элементом для глобальных провайдеров.
root.render(
    <React.StrictMode>
        <ThemeRegistry>
            <NotificationsProvider>
                <App />
            </NotificationsProvider>
        </ThemeRegistry>
    </React.StrictMode>
);