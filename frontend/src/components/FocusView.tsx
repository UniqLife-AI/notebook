import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { useSettingsStore } from '../store/useSettingsStore';
import NoteEditor from './NoteEditor';

// Wails-функция для листинга файлов. Ее импорт закомментирован,
// так как мы еще не реализовали ее на бэкенде в main.go.
// import { ListFiles } from '../../wailsjs/go/main/App';

/**
 * @component FocusView
 * @description Основной компонент-контейнер для центральной части приложения.
 * В будущем здесь будет отображаться либо список файлов/заметок, либо редактор активной заметки.
 * Его главная задача - реагировать на изменение rootDirectory и загружать соответствующий контент.
 */
const FocusView: React.FC = () => {
  // Получаем rootDirectory из глобального хранилища. App.tsx гарантирует,
  // что этот компонент рендерится только ПОСЛЕ того, как rootDirectory был установлен.
  const rootDirectory = useSettingsStore((state) => state.rootDirectory);

  // Локальное состояние для управления отображаемыми файлами и активным файлом.
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [files, setFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * @effect
   * @description Этот хук будет отвечать за загрузку списка файлов из выбранной директории.
   * Он срабатывает, когда компонент монтируется и rootDirectory уже доступен.
   */
  useEffect(() => {
    if (rootDirectory) {
      // ЗАГЛУШКА: Это место для будущей логики.
      // Когда мы реализуем `ListFiles` в Go, мы раскомментируем вызов здесь.
      console.log('FocusView: Root directory is set. File loading logic will be implemented here.');
      // setIsLoading(true);
      // ListFiles(rootDirectory).then(setFiles).finally(() => setIsLoading(false));
    }
  }, [rootDirectory]); // Зависимость от rootDirectory гарантирует, что эффект сработает один раз при инициализации.

  // Рендерим основной UI.
  // Защитная проверка на rootDirectory здесь больше не нужна, так как App.tsx
  // уже выполняет эту логику, но она не помешает.
  return (
    <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">Focus View</Typography>
        {/* TODO: Здесь будет компонент для отображения списка файлов (files) */}
      </Box>
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
        {activeFile ? (
          // Если файл выбран, показываем редактор
          <NoteEditor filePath={activeFile} />
        ) : (
          // Если файл не выбран, показываем сообщение-плейсхолдер
          <Typography color="text.secondary">
            Select a note to begin editing. (File listing needs to be implemented).
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

// Экспортируем по умолчанию. Это стандарт для компонентов-страниц в нашей структуре.
export default FocusView;