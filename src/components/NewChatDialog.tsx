// File Name: src/components/NewChatDialog.tsx

import { useState, useMemo, useRef, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";

interface NewChatDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (fileName: string) => void;
}

export const NewChatDialog = ({ open, onClose, onCreate }: NewChatDialogProps) => {
    const [fileName, setFileName] = useState('');
    // ИЗМЕНЕНИЕ: Создаем ref для поля ввода
    const inputRef = useRef<HTMLInputElement>(null);

    // ИЗМЕНЕНИЕ: useEffect для установки фокуса при открытии
    useEffect(() => {
        if (open) {
            // Небольшая задержка, чтобы фокус сработал после анимации открытия диалога
            setTimeout(() => {
                inputRef.current?.focus();
            }, 50);
        }
    }, [open]);

    const canCreate = useMemo(() => fileName.trim().length > 0, [fileName]);

    const handleCreate = () => {
        if (!canCreate) return;

        const finalName = fileName.trim().endsWith('.md')
            ? fileName.trim()
            : `${fileName.trim()}.md`;

        onCreate(finalName);
        onClose();
        setFileName('');
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleCreate();
        }
    };
    
    // ИЗМЕНЕНИЕ: Обработчик закрытия, который также сбрасывает имя файла
    const handleClose = () => {
        onClose();
        setFileName('');
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Создать новый чат</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Введите имя для нового файла чата. Расширение `.md` будет добавлено автоматически.
                </DialogContentText>
                <TextField
                    inputRef={inputRef} // Привязываем ref
                    margin="dense"
                    id="name"
                    label="Имя файла"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Отмена</Button>
                <Button onClick={handleCreate} variant="contained" disabled={!canCreate}>
                    Создать
                </Button>
            </DialogActions>
        </Dialog>
    );
};