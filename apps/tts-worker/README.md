# VoiceFlow — Local Text-to-Speech (TTS) Worker

Lightweight, high-performance, local text-to-speech worker powered by [Piper TTS](https://github.com/rhasspy/piper) and FastAPI.

Synthesizes high-fidelity, natural speech audio on CPU using the `en_US-lessac-medium` ONNX voice model.

---

## Features

* **100% Offline & Private:** Runs entirely on CPU with zero cloud dependencies or external API calls.
* **Low Latency:** Synthesizes speech faster than real time (Real-Time Factor < 0.1x) via optimized ONNX Runtime.
* **In-Memory Streaming:** Audio is synthesized directly into memory without temporary disk artifacts.
* **Process Isolation:** Runs as an independent microservice on port `8001`, decoupled from the NestJS API and transcription worker.
* **Bounded Concurrency:** Protects CPU cores from saturation during traffic bursts.
* **Privacy-Preserving Logging:** Logs request character count, latency, and byte output without exposing user text in logs.

---

## Requirements

* **Python:** 3.10 – 3.12
* **Operating System:** Linux / macOS / Windows (x86_64 or ARM64)
* **Hardware:** CPU-only (no GPU or CUDA required)
* **RAM:** ~150 MB

---

## Setup

### 1. Create Virtual Environment

```bash
cd apps/tts-worker
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Download Voice Model

Download the pre-trained `en_US-lessac-medium` Piper model (~61 MB) and configuration file:

```bash
./scripts/download-model.sh
```

Model files are placed under `models/` (ignored by Git):
* `models/en_US-lessac-medium.onnx`
* `models/en_US-lessac-medium.onnx.json`

---

## Running the Worker

Activate the virtual environment and start the Uvicorn server:

```bash
source .venv/bin/activate
python server.py
```

By default, the server starts on `http://0.0.0.0:8001`.

---

## Configuration

The worker can be configured using environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TTS_HOST` | `0.0.0.0` | Host IP interface to bind to |
| `TTS_PORT` | `8001` | TCP port for the worker |
| `TTS_MODEL_PATH` | `models/en_US-lessac-medium.onnx` | Path to the ONNX voice model file |
| `TTS_CONFIG_PATH` | `models/en_US-lessac-medium.onnx.json` | Path to the ONNX config JSON file |
| `TTS_MAX_TEXT_LENGTH` | `2000` | Maximum character limit for input text |
| `TTS_MAX_CONCURRENCY` | `1` | Maximum simultaneous CPU synthesis operations |

---

## API Endpoints

### 1. Health & Readiness Probe

```http
GET /health
```

#### Response (Healthy & Ready):

```json
{
  "status": "ok",
  "service": "voiceflow-tts-worker",
  "ready": true,
  "model": "en_US-lessac-medium"
}
```

If the model is missing or failed to load, returns `HTTP 503 Service Unavailable` with `ready: false`.

---

### 2. Speech Synthesis

```http
POST /synthesize
Content-Type: application/json
```

#### Request:

```json
{
  "text": "Hello, welcome to VoiceFlow text to speech."
}
```

#### Response:
* **Status:** `200 OK`
* **Content-Type:** `audio/wav`
* **Body:** Raw binary WAV audio data (22.05 kHz, 16-bit mono PCM).

#### Error Codes:
* `400 Bad Request`: Empty text, whitespace-only, or text exceeds `TTS_MAX_TEXT_LENGTH` (2,000 characters).
* `503 Service Unavailable`: TTS model is not loaded or unavailable.
* `500 Internal Server Error`: Synthesis runtime failure.

---

## Testing with cURL

### Health check:
```bash
curl -i http://localhost:8001/health
```

### Synthesize speech to file:
```bash
curl -X POST http://localhost:8001/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello, welcome to VoiceFlow."}' \
  --output test.wav
```

### Inspect the output:
```bash
file test.wav
# Expected output: test.wav: RIFF (little-endian) data, WAVE audio, Microsoft PCM, 16 bit, mono 22050 Hz
```
