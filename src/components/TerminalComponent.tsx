// File Name: src/components/TerminalComponent.tsx

"use client";
import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Box } from '@mui/material';

const WEBSOCKET_URL = 'ws://localhost:9001/ws';

const TerminalComponent = () => {
    const boxRef = useRef<HTMLDivElement>(null);
    // Этот ref будет хранить все инстансы, чтобы их можно было очистить
    const terminalInstances = useRef<{
        term: Terminal;
        fitAddon: FitAddon;
        socket: WebSocket;
        onDataDisposable: { dispose: () => void };
    } | null>(null);

    useEffect(() => {
        const container = boxRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            // Если терминал уже создан, просто меняем размер
            if (terminalInstances.current) {
                try {
                    terminalInstances.current.fitAddon.fit();
                } catch (e) {
                    console.warn("Minor resize error ignored:", e);
                }
                return;
            }

            // Инициализируем терминал только если у контейнера есть реальный размер
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                const term = new Terminal({
                    cursorBlink: true,
                    fontFamily: 'monospace',
                    fontSize: 14,
                    theme: {
                        background: '#1e1e1e',
                        foreground: '#d4d4d4',
                        cursor: '#d4d4d4',
                    },
                });

                const fitAddon = new FitAddon();
                term.loadAddon(fitAddon);
                term.open(container);
                term.focus();
                fitAddon.fit();

                term.writeln('Welcome to the Integrated Terminal.');
                term.writeln('Connecting to shell backend...');

                const socket = new WebSocket(WEBSOCKET_URL);

                socket.onopen = () => {
                    term.writeln('\r\n\x1b[32mConnection established.\x1b[0m');
                    fitAddon.fit();
                };

                socket.onmessage = (event) => {
                    term.write(event.data);
                };

                socket.onclose = () => {
                    term.writeln('\r\n\x1b[31mConnection closed.\x1b[0m');
                };

                socket.onerror = (error) => {
                    console.error('WebSocket Error:', error);
                    term.writeln('\r\n\x1b[31mFailed to connect to shell backend. Is the sidecar running?\x1b[0m');
                };

                const onDataDisposable = term.onData(data => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(data);
                    }
                });

                // Сохраняем все созданные инстансы в ref для последующей очистки
                terminalInstances.current = { term, fitAddon, socket, onDataDisposable };
            }
        });

        resizeObserver.observe(container);

        // Функция очистки
        return () => {
            resizeObserver.disconnect();
            if (terminalInstances.current) {
                terminalInstances.current.onDataDisposable.dispose();
                terminalInstances.current.socket.close();
                terminalInstances.current.term.dispose();
                terminalInstances.current = null;
            }
        };
    }, []);

    return (
        <Box
            ref={boxRef}
            sx={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                bgcolor: '#1e1e1e',
                p: 1,
            }}
        />
    );
};

export default TerminalComponent;