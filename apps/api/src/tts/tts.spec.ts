import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  BadRequestException,
  ServiceUnavailableException,
  InternalServerErrorException,
  BadGatewayException,
  GatewayTimeoutException,
} from '@nestjs/common';
import { LocalPiperProvider } from './providers/local-piper.provider';
import { TTSService } from './tts.service';
import { TextToSpeechProvider, TTSInput, TTSResult } from './interfaces/tts-provider.interface';

describe('VoiceFlow TTS Module Suite (Step 10.3)', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  describe('LocalPiperProvider', () => {
    test('1. Valid text sends the correct request to Piper and receives valid audio Buffer', async () => {
      const mockString = 'RIFF_MOCK_WAV_BINARY_DATA';
      let capturedUrl = '';
      let capturedMethod = '';
      let capturedHeaders: Record<string, string> = {};
      let capturedBody = '';

      globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
        capturedUrl = input.toString();
        capturedMethod = init?.method || '';
        capturedHeaders = init?.headers as Record<string, string>;
        capturedBody = init?.body as string;

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'audio/wav' }),
          arrayBuffer: async () => new TextEncoder().encode(mockString).buffer,
        } as unknown as Response;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();
      const result = await provider.synthesize({ text: 'Hello, welcome to VoiceFlow.' });

      // Verify request format
      assert.strictEqual(capturedUrl, 'http://localhost:8001/synthesize');
      assert.strictEqual(capturedMethod, 'POST');
      assert.strictEqual(capturedHeaders['Content-Type'], 'application/json');
      assert.deepStrictEqual(JSON.parse(capturedBody), { text: 'Hello, welcome to VoiceFlow.' });

      // Verify response structure
      assert.ok(Buffer.isBuffer(result.audio), '3. WAV response must be a Buffer');
      assert.strictEqual(result.audio.toString(), mockString);
      assert.strictEqual(result.mimeType, 'audio/wav', '4. Returned mimeType must be audio/wav');
      assert.strictEqual(result.voice, 'en_US-lessac-medium', '5. Returned voice must be en_US-lessac-medium');
      assert.strictEqual(result.model, 'piper', '6. Returned model must be piper');
    });

    test('2. Piper URL and model come from environment configuration', async () => {
      process.env.LOCAL_TTS_URL = 'http://custom-piper-host:9999';
      process.env.TTS_MODEL = 'custom-voice-high';

      let requestedUrl = '';
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        requestedUrl = input.toString();
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'audio/wav' }),
          arrayBuffer: async () => Buffer.from('RIFF_DATA').buffer,
        } as unknown as Response;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();
      const result = await provider.synthesize({ text: 'Testing custom configuration.' });

      assert.strictEqual(requestedUrl, 'http://custom-piper-host:9999/synthesize');
      assert.strictEqual(result.voice, 'custom-voice-high');
    });

    test('7. Empty text is rejected with BadRequestException', async () => {
      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: '' });
        },
        (err: unknown) => {
          assert.ok(err instanceof BadRequestException);
          assert.strictEqual((err as BadRequestException).message, 'Text cannot be empty or whitespace only');
          return true;
        },
      );
    });

    test('8. Whitespace-only text is rejected with BadRequestException', async () => {
      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: '    \n\t   ' });
        },
        (err: unknown) => {
          assert.ok(err instanceof BadRequestException);
          assert.strictEqual((err as BadRequestException).message, 'Text cannot be empty or whitespace only');
          return true;
        },
      );
    });

    test('9. Piper 500 becomes a clean application error (InternalServerErrorException)', async () => {
      globalThis.fetch = (async () => {
        return {
          ok: false,
          status: 500,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ detail: 'Failed to synthesize speech' }),
        } as unknown as Response;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: 'Hello crash' });
        },
        (err: unknown) => {
          assert.ok(err instanceof InternalServerErrorException);
          assert.strictEqual((err as InternalServerErrorException).message, 'Failed to synthesize speech');
          return true;
        },
      );
    });

    test('10. Piper 503 becomes a clean application error (ServiceUnavailableException)', async () => {
      globalThis.fetch = (async () => {
        return {
          ok: false,
          status: 503,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ detail: 'TTS model is not loaded or unavailable' }),
        } as unknown as Response;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: 'Hello unready' });
        },
        (err: unknown) => {
          assert.ok(err instanceof ServiceUnavailableException);
          assert.strictEqual((err as ServiceUnavailableException).message, 'TTS model is not loaded or unavailable');
          return true;
        },
      );
    });

    test('11. Timeout becomes a clean application error (GatewayTimeoutException)', async () => {
      globalThis.fetch = (async () => {
        const timeoutErr = new Error('The operation was aborted due to timeout');
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: 'Hello timeout' });
        },
        (err: unknown) => {
          assert.ok(err instanceof GatewayTimeoutException);
          assert.strictEqual((err as GatewayTimeoutException).message, 'Local TTS service timed out');
          return true;
        },
      );
    });

    test('12. Invalid content type is rejected with BadGatewayException', async () => {
      globalThis.fetch = (async () => {
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'text/html' }),
          arrayBuffer: async () => Buffer.from('<html>Error</html>').buffer,
        } as unknown as Response;
      }) as typeof fetch;

      const provider = new LocalPiperProvider();

      await assert.rejects(
        async () => {
          await provider.synthesize({ text: 'Hello invalid format' });
        },
        (err: unknown) => {
          assert.ok(err instanceof BadGatewayException);
          assert.ok((err as BadGatewayException).message.includes('Unexpected content type'));
          return true;
        },
      );
    });
  });

  describe('TTSService', () => {
    test('13. TTSService correctly uses the configured provider', async () => {
      let providerCalledWith: TTSInput | null = null;
      const mockResult: TTSResult = {
        audio: Buffer.from('MOCK_AUDIO_BUFFER'),
        mimeType: 'audio/wav',
        voice: 'en_US-lessac-medium',
        model: 'piper',
      };

      const mockProvider: TextToSpeechProvider = {
        synthesize: async (input: TTSInput) => {
          providerCalledWith = input;
          return mockResult;
        },
      };

      const service = new TTSService(mockProvider);
      const res = await service.synthesize({ text: 'Synthesize via TTSService delegation' });

      assert.deepStrictEqual(providerCalledWith, {
        text: 'Synthesize via TTSService delegation',
        voice: undefined,
      });
      assert.deepStrictEqual(res, mockResult);
    });

    test('14. TTSService rejects empty and whitespace-only text before calling provider', async () => {
      let providerCalled = false;
      const mockProvider: TextToSpeechProvider = {
        synthesize: async () => {
          providerCalled = true;
          return {} as TTSResult;
        },
      };

      const service = new TTSService(mockProvider);

      await assert.rejects(async () => {
        await service.synthesize({ text: '    ' });
      }, BadRequestException);

      assert.strictEqual(providerCalled, false, 'Provider must not be called on invalid input');
    });
  });
});
