# Local Transcription Worker

This is a lightweight local speech-to-text worker using `faster-whisper`. It allows VoiceFlow to perform transcription without requiring paid API credits to external services.

## Prerequisites

1. Python 3.9+
2. **ffmpeg**: Must be installed on your system.
   - Ubuntu/Debian: `sudo apt update && sudo apt install ffmpeg`
   - MacOS: `brew install ffmpeg`

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv .venv
   ```

2. Activate the virtual environment:
   ```bash
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Worker

Start the FastAPI server:

```bash
python server.py
```

The server will run on `http://0.0.0.0:8000`.

**Note:** On the very first run, `faster-whisper` will download the transcription model (defaults to `base` model). This may take a few minutes depending on your internet connection.

## VoiceFlow Configuration

To tell VoiceFlow to use this local worker, set the following environment variables in the root `.env` file of the monorepo:

```env
TRANSCRIPTION_PROVIDER=local
LOCAL_TRANSCRIPTION_URL=http://localhost:8000
LOCAL_WHISPER_MODEL=base
```
