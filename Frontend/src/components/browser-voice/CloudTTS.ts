/**
 * CloudTTS.ts
 * Direct Browser integration with Microsoft Edge TTS WebSocket.
 * No backend proxy required. Uses client's IP.
 */

export class CloudTTS {
    private static readonly BASE_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E57A7FFEF33D00FA1A3";

    static async synthesize(text: string, voiceName: string): Promise<Blob> {
        return new Promise(async (resolve, reject) => {
            try {
                const token = await this.generateSecMsGec();
                const wsUrl = `${this.BASE_URL}&Sec-MS-GEC=${token}`;
                const socket = new WebSocket(wsUrl);
                const audioChunks: BlobPart[] = [];

                socket.binaryType = "arraybuffer";
                const timestamp = this.getTimestamp();

                socket.onopen = () => {
                    // 1. Send Config
                    const configMsg = `X-Timestamp:${timestamp}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
                    console.log("[CloudTTS] Sending Config:", configMsg);
                    socket.send(configMsg);

                    // 2. Send SSML
                    const requestId = this.uuidv4();
                    const parts = voiceName.split('-');
                    const voiceLang = (parts.length >= 2) ? `${parts[0]}-${parts[1]}` : 'en-US';
                    const escapedText = this.escapeXml(text);

                    // ⚡ SIMPLIFIED SSML 
                    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${voiceLang}'><voice name='${voiceName}'>${escapedText}</voice></speak>`;
                    const ssmlMsg = `X-RequestId:${requestId}\r\nX-Timestamp:${timestamp}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
                    console.log("[CloudTTS] Sending SSML:", ssmlMsg);
                    socket.send(ssmlMsg);
                };

                socket.onmessage = (event) => {
                    if (typeof event.data === "string") {
                        if (event.data.includes("Path:turn.end")) {
                            socket.close();
                            const finalBlob = new Blob(audioChunks, { type: "audio/mpeg" });
                            resolve(finalBlob);
                        }
                    } else if (event.data instanceof ArrayBuffer) {
                        const data = new Uint8Array(event.data);
                        const headerIndex = this.indexOf(data, new Uint8Array([0x50, 0x61, 0x74, 0x68, 0x3a, 0x61, 0x75, 0x64, 0x69, 0x6f]));
                        if (headerIndex !== -1) {
                            const separator = new Uint8Array([0x0D, 0x0A, 0x0D, 0x0A]);
                            const separatorIdx = this.indexOf(data, separator, headerIndex);
                            if (separatorIdx !== -1) {
                                const startOfData = separatorIdx + 4;
                                audioChunks.push(data.slice(startOfData));
                                if (audioChunks.length === 1) console.log("[CloudTTS] Receiving Audio...");
                            }
                        }
                    }
                };

                socket.onerror = (err: any) => {
                    console.error("[CloudTTS] WebSocket Error:", err);
                    socket.close();
                    reject(new Error(`Edge TTS Protocol Error: ${JSON.stringify(err)}`));
                };

                socket.onclose = (e) => {
                    if (audioChunks.length === 0) {
                        console.error("[CloudTTS] WebSocket Closed Early:", e.code, e.reason);
                        reject(new Error(`WebSocket closed early (Code: ${e.code}). Audio not received.`));
                    }
                };

                setTimeout(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.close();
                        reject(new Error("CloudTTS Timeout"));
                    }
                }, 15000);

            } catch (err) {
                reject(err);
            }
        });
    }

    private static uuidv4(): string {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c: any) =>
            (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
        );
    }

    private static indexOf(source: Uint8Array, search: Uint8Array, start: number = 0): number {
        for (let i = start; i <= source.length - search.length; i++) {
            let j = 0;
            while (j < search.length && source[i + j] === search[j]) {
                j++;
            }
            if (j === search.length) return i;
        }
        return -1;
    }

    private static escapeXml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }

    private static getTimestamp(): string {
        const date = new Date();
        return date.toString();
    }

    private static async generateSecMsGec(): Promise<string> {
        const ticks = Math.floor(Date.now() / 1000 / 60);
        const salt = "6A5AA1D4EAFF4E57A7FFEF33D00FA1A3";
        const strToHash = ticks + salt;
        const encoder = new TextEncoder();
        const data = encoder.encode(strToHash);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
}
