
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const { initLogCapture } = await import('./lib/log-capture');
        initLogCapture();
    }
}
