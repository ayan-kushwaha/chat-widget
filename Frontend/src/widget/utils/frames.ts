/** Sends a postMessage to every iframe on the page. */
export function broadcastToFrames(msg: object): void {
    document.querySelectorAll<HTMLIFrameElement>('iframe').forEach(f => {
        if (f.contentWindow) f.contentWindow.postMessage(msg, '*');
    });
}
