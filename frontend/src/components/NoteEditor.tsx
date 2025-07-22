import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip, TextareaAutosize } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useDebounce } from 'use-debounce';

// Импортируем наши новые, реальные функции из сгенерированных байндингов Wails.
import { ReadFile, WriteFile } from '../../wailsjs/go/main/App';

/**
 * @interface NoteEditorProps
 * @description Свойства для компонента редактора. Теперь он зависит от пути к файлу.
 */
interface NoteEditorProps {
  filePath: string;
}

/**
 * @component NoteEditor
 * @description Адаптированная версия редактора.
 * Теперь он работает напрямую с файловой системой через Wails/Go.
 * Он принимает `filePath`, загружает, отображает, и автоматически сохраняет файл.
 */
const NoteEditor: React.FC<NoteEditorProps> = ({ filePath }) => {
  const [content, setContent] = useState('');
  const [debouncedContent] = useDebounce(content, 1000);
  const [editMode, setEditMode] = useState(true); // По умолчанию в режиме редактирования

  /**
   * @effect Загрузка файла
   * @description Срабатывает при изменении `filePath`.
   * Вызывает Go-функцию `ReadFile` для получения содержимого файла.
   */
  useEffect(() => {
    if (!filePath) return;

    const loadFile = async () => {
      try {
        const fileContent = await ReadFile(filePath);
        setContent(fileContent);
      } catch (error) {
        console.error(`Failed to load file: ${filePath}`, error);
        setContent(`# Error\n\nCould not load file: ${filePath}`);
      }
    };

    loadFile();
  }, [filePath]);

  /**
   * @effect Автосохранение файла
   * @description Срабатывает при изменении `debouncedContent`.
   * Вызывает Go-функцию `WriteFile` для сохранения изменений на диск.
   */
  useEffect(() => {
    // Не сохраняем, если контент пустой или не изменился с момента загрузки
    if (!filePath || content === '') return;

    const saveFile = async () => {
      try {
        await WriteFile(filePath, debouncedContent);
      } catch (error) {
        console.error(`Failed to save file: ${filePath}`, error);
      }
    };

    saveFile();
  }, [debouncedContent, filePath]);

  return (
    <Box sx={{ position: 'relative', height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
        <Tooltip title={editMode ? "Preview Mode" : "Edit Mode"}>
          <IconButton onClick={() => setEditMode(!editMode)} size="small">
            {editMode ? <VisibilityIcon /> : <EditIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {editMode ? (
        <TextareaAutosize
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            boxSizing: 'border-box',
            width: '100%',
            height: '100%',
            padding: '16px',
            paddingTop: '48px', // Оставляем место для кнопки
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontFamily: 'monospace',
            fontSize: '14px',
            lineHeight: 1.6,
            resize: 'none',
          }}
        />
      ) : (
        <Box
          component={ReactMarkdown}
          remarkPlugins={[remarkGfm]}
          sx={{
            p: 4,
            pt: 6, // Оставляем место для кнопки
            height: '100%',
            overflowY: 'auto',
            '& p': { my: 1 },
            '& h1, & h2, & h3, & h4': { mt: 2, mb: 1, pb: 0.5, borderBottom: '1px solid', borderColor: 'divider' },
            '& pre': { p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 },
            '& code': { fontFamily: 'monospace' }
          }}
        >
          {content}
        </Box>
      )}
    </Box>
  );
};

// Экспортируем по умолчанию для соответствия нашей архитектуре.
export default NoteEditor;