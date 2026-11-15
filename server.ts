import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';

type AllowedVoice = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

const ALLOWED_VOICES = new Set<AllowedVoice>(['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr']);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        apiVersion: 'v1beta',
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const ttsCache = new Map<string, Buffer>();
const inFlight = new Map<string, Promise<Buffer>>();

async function synthesizeTtsWav(
  text: string,
  voiceName: AllowedVoice,
  style: string
): Promise<Buffer> {
  const cacheKey = `${voiceName}::${style}::${text}`;
  const cached = ttsCache.get(cacheKey);
  if (cached) return cached;

  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const job = (async () => {
    if (!ai) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
    } catch {
      // Fallback without speechMetadata if an upstream environment rejects it
      response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: `Speak in ${style}: ${text}`,
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });
    }

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error('Gemini TTS returned no audio payload');
    }

    const wavBuffer = Buffer.from(base64Audio, 'base64');
    if (ttsCache.size > 64) {
      const oldestKey = ttsCache.keys().next().value;
      if (oldestKey) ttsCache.delete(oldestKey);
    }
    ttsCache.set(cacheKey, wavBuffer);
    return wavBuffer;
  })();

  inFlight.set(cacheKey, job);
  try {
    return await job;
  } finally {
    inFlight.delete(cacheKey);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '16kb' }));

  app.post('/api/tts', async (req, res) => {
    try {
      const rawText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
      if (!rawText || rawText.length > 600) {
        res.status(400).json({ error: 'Invalid TTS text' });
        return;
      }

      const rawVoice = typeof req.body?.voiceName === 'string' ? req.body.voiceName : 'Charon';
      const voiceName: AllowedVoice = ALLOWED_VOICES.has(rawVoice as AllowedVoice)
        ? (rawVoice as AllowedVoice)
        : 'Charon';

      const style =
        typeof req.body?.style === 'string' && req.body.style.trim().length > 0
          ? req.body.style.trim().slice(0, 180)
          : 'Crisp aircraft pilot radio voiceover, calm professional NASA mission control tone';

      const wav = await synthesizeTtsWav(rawText, voiceName, style);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(wav);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'TTS generation failed';
      const isAuthOrBilling =
        message.includes('GEMINI_API_KEY') ||
        message.includes('PERMISSION_DENIED') ||
        message.includes('403') ||
        message.includes('billing');
      if (isAuthOrBilling) {
        res.status(200).json({ available: false, reason: message });
        return;
      }
      res.status(503).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

void startServer();
