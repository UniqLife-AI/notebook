"use client";
import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Box } from '@mui/material';
import '@xterm/xterm/css/xterm.css';

import { EventsOn } from '../../wailsjs/runtime/runtime';
import { WriteToShell } from '../../wailsjs/go/main/App';

const TerminalComponent = () => {
    const boxRef = useRef<HTMLDivElement>(null);
    const termRef = useRef<Terminal | null>(null);
    const isInitialized = useRef(false);
    // This will now track the user's current input line.
    const currentInput = useRef('');

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
        term.focus();

        const unsubscribe = EventsOn("shell-output", (data: string) => {
            if (termRef.current) {
                termRef.current.write(data);
            }
        });

        const onDataDisposable = term.onData(data => {
            if (!termRef.current) return;

            const code = data.charCodeAt(0);

            // Handle Enter key
            if (code === 13) { // Carriage return
                if (currentInput.current.length > 0) {
                    WriteToShell(currentInput.current + '\r\n');
                } else {
                    // Send an empty line if user just presses enter
                    WriteToShell('\r\n');
                }
                currentInput.current = '';
                term.write('\r\n'); // Visually move to the next line immediately
                return;
            }

            // Handle Backspace key
            if (code === 127) { // Backspace
                if (currentInput.current.length > 0) {
                    // Remove the last character from our input buffer
                    currentInput.current = currentInput.current.slice(0, -1);
                    // Visually delete the character
                    term.write('\b \b');
                }
                return;
            }
            
            // Handle printable characters
            if (code >= 32 && code <= 254) {
                currentInput.current += data;
                term.write(data); // Echo character locally
            }
        });

        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
        });
        resizeObserver.observe(boxRef.current);

        return () => {
            unsubscribe();
            onDataDisposable.dispose();
            resizeObserver.disconnect();
            if (termRef.current) {
                termRef.current.dispose();
            }
            isInitialized.current = false;
        };
    }, []);

    return <Box ref={boxRef} sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', p: 1 }} />;
};

export default TerminalComponent;