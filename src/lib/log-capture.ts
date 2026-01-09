/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-explicit-any */

declare global {
    var __logBuffer: string[];
}

export function initLogCapture() {
    if (global.__logBuffer) return; // Prevent double init

    global.__logBuffer = [];
    const MAX_LOGS = 200;

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    function addToBuffer(type: string, args: any[]) {
        try {
            const msg = args.map(a =>
                typeof a === 'object' ? JSON.stringify(a) : String(a)
            ).join(' ');

            const timestamp = new Date().toISOString();
            const line = `[${timestamp}] [${type}] ${msg}`;

            global.__logBuffer.push(line);
            if (global.__logBuffer.length > MAX_LOGS) {
                global.__logBuffer.shift();
            }
        } catch {
            // Ignore serialization errors to prevent crash loops
        }
    }

    console.log = (...args) => {
        addToBuffer('INFO', args);
        originalLog.apply(console, args);
    };

    console.error = (...args) => {
        addToBuffer('ERROR', args);
        originalError.apply(console, args);
    };

    console.warn = (...args) => {
        addToBuffer('WARN', args);
        originalWarn.apply(console, args);
    };

    console.log('Log capture initialized');
}

export function getLogs() {
    return global.__logBuffer || [];
}
