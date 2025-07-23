import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Box } from '@mui/material';
import '@xterm/xterm/css/xterm.css';

import { TerminalCommand } from '../../wailsjs/go/main/App';

/**
 * @component TerminalComponent
 * @description Исправлена логика обработки ввода для поддержки кириллических
 * и других Unicode-символов.
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
			// @comment: Эта опция позволяет корректно обрабатывать Unicode
			allowProposedApi: true, 
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
						// Ошибки от Go теперь тоже могут содержать кириллицу, выводим их как есть.
						term.write(`\r\nError: ${error}\r\n`);
					}
				}
				currentInput = '';
				term.write('> '); // Приглашение к вводу
				return;
			}

			if (code === 127) { // Backspace
				if (currentInput.length > 0) {
					// Корректная обработка Backspace для многобайтовых символов
					currentInput = currentInput.slice(0, -1);
					term.write('\b \b');
				}
				return;
			}
			
			// ИЗМЕНЕНО: Условие для фильтрации символов.
			// Теперь мы пропускаем все печатные символы (код >= 32),
			// что включает латиницу, кириллицу и другие символы Unicode.
			if (code >= 32) {
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