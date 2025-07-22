import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Box } from '@mui/material';
import '@xterm/xterm/css/xterm.css';

// ИСПРАВЛЕНО: Импортируем нашу реальную Go-функцию. WriteToShell и EventsOn удалены.
import { TerminalCommand } from '../../wailsjs/go/main/App';

/**
 * @component TerminalComponent
 * @description Адаптирован под текущую реализацию бэкенда.
 * Вместо интерактивного stdin/stdout, он теперь отправляет команду целиком
 * по нажатию Enter и выводит результат. Это временное решение для компиляции.
 */
const TerminalComponent = () => {
    const boxRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const isInitialized = useRef(false);

    useEffect(() => {
        if (!boxRef.current || isInitialized.current) {
            return;
        }
        isInitialized.current = true;

        const term = new Terminal({
            cursorBlink: true,
            fontFamily: 'monospace',
            fontSize: 14,
            theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
        });
        termRef.current = term;

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(boxRef.current);
        fitAddon.fit();
        term.write('Welcome to the integrated terminal.\r\n> ');
        term.focus();

        let currentInput = '';

        const onDataDisposable = term.onData(async (data) => {
            if (!termRef.current) return;

            const code = data.charCodeAt(0);

            if (code === 13) { // Enter
                term.write('\r\n');
                if (currentInput.trim().length > 0) {
                    try {
                        // Вызываем нашу Go-функцию и ждем результат.
                        const result = await TerminalCommand(currentInput);
                        // Заменяем \n на \r\n для корректного отображения в xterm.
                        const formattedResult = result.replace(/\n/g, '\r\n');
                        term.write(formattedResult);
                    } catch (error) {
                        term.write(`\r\nError: ${error}\r\n`);
                    }
                }
                currentInput = '';
                term.write('> '); // Приглашение к вводу
                return;
            }

            if (code === 127) { // Backspace
                if (currentInput.length > 0) {
                    currentInput = currentInput.slice(0, -1);
                    term.write('\b \b');
                }
                return;
            }
            
            if (code >= 32 && code < 255) {
                currentInput += data;
                term.write(data);
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
        });
        resizeObserver.observe(boxRef.current);

        return () => {
            onDataDisposable.dispose();
            resizeObserver.disconnect();
            if (termRef.current) termRef.current.dispose();
            isInitialized.current = false;
        };
    }, []);

    return <Box ref={boxRef} sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', p: 1 }} />;
};

export default TerminalComponent;