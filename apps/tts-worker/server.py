import os
import io
import time
import wave
import asyncio
import logging
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from piper import PiperVoice

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("voiceflow-tts-worker")

# Environment & Default Configurations
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"

TTS_HOST = os.environ.get("TTS_HOST", "0.0.0.0")
TTS_PORT = int(os.environ.get("TTS_PORT", "8001"))
TTS_MODEL_PATH = Path(
    os.environ.get(
        "TTS_MODEL_PATH",
        str(MODELS_DIR / "en_US-lessac-medium.onnx"),
    )
)
TTS_CONFIG_PATH = Path(
    os.environ.get(
        "TTS_CONFIG_PATH",
        str(MODELS_DIR / "en_US-lessac-medium.onnx.json"),
    )
)
TTS_MAX_TEXT_LENGTH = int(os.environ.get("TTS_MAX_TEXT_LENGTH", "2000"))
TTS_MAX_CONCURRENCY = int(os.environ.get("TTS_MAX_CONCURRENCY", "1"))

# Global State
voice_model: Optional[PiperVoice] = None
concurrency_semaphore: Optional[asyncio.Semaphore] = None


def load_model() -> Optional[PiperVoice]:
    """Loads the Piper voice model once during startup."""
    if not TTS_MODEL_PATH.exists():
        logger.error(f"TTS model file not found at: {TTS_MODEL_PATH}")
        logger.error("Please run scripts/download-model.sh to download the required voice model.")
        return None

    if not TTS_CONFIG_PATH.exists():
        logger.error(f"TTS config file not found at: {TTS_CONFIG_PATH}")
        return None

    logger.info(f"Loading Piper voice model from: {TTS_MODEL_PATH}")
    start_time = time.perf_counter()
    try:
        voice = PiperVoice.load(
            model_path=str(TTS_MODEL_PATH),
            config_path=str(TTS_CONFIG_PATH),
            use_cuda=False,
        )
        elapsed = time.perf_counter() - start_time
        logger.info(f"Piper voice model loaded successfully in {elapsed:.3f}s")
        return voice
    except Exception as e:
        logger.exception(f"Failed to load Piper voice model: {e}")
        return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan context manager for startup and shutdown events."""
    global voice_model, concurrency_semaphore
    logger.info("Initializing VoiceFlow TTS Worker...")
    concurrency_semaphore = asyncio.Semaphore(TTS_MAX_CONCURRENCY)
    voice_model = load_model()

    if voice_model is None:
        logger.warning("Worker started in UNREADY state: Model is not loaded.")
    else:
        logger.info(
            f"Worker ready on {TTS_HOST}:{TTS_PORT} (concurrency limit: {TTS_MAX_CONCURRENCY}, max text: {TTS_MAX_TEXT_LENGTH} chars)"
        )

    yield

    logger.info("Shutting down VoiceFlow TTS Worker...")


app = FastAPI(
    title="VoiceFlow Text-to-Speech Worker",
    description="Local CPU-based text-to-speech worker using Piper TTS",
    version="0.1.0",
    lifespan=lifespan,
)


class SynthesizeRequest(BaseModel):
    text: str = Field(
        ...,
        description="Text content to convert into speech",
        examples=["Hello, welcome to VoiceFlow."],
    )


@app.get("/health")
async def health_check():
    """Health and readiness probe."""
    is_ready = voice_model is not None

    payload = {
        "status": "ok" if is_ready else "error",
        "service": "voiceflow-tts-worker",
        "ready": is_ready,
        "model": TTS_MODEL_PATH.stem if is_ready else None,
    }

    if not is_ready:
        payload["detail"] = "TTS model is not loaded or missing"
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=payload,
        )

    return payload


def _synthesize_wav_in_memory(voice: PiperVoice, text: str) -> bytes:
    """CPU-bound synthesis writing WAV audio directly to an in-memory buffer."""
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        voice.synthesize_wav(text, wav_file)
    return buffer.getvalue()


@app.post(
    "/synthesize",
    responses={
        200: {
            "content": {"audio/wav": {}},
            "description": "Synthesized audio in WAV format",
        },
        400: {"description": "Invalid or empty input text"},
        503: {"description": "TTS model unavailable"},
        500: {"description": "Internal synthesis error"},
    },
)
async def synthesize_speech(request: SynthesizeRequest):
    """
    Synthesizes input text into a high-quality 22.05kHz/24kHz WAV audio stream.
    Protects CPU with bounded concurrency and performs in-memory synthesis.
    """
    # 1. Validation: Empty or whitespace-only
    raw_text = request.text
    if not raw_text or not raw_text.strip():
        logger.warning("Rejected synthesis request: empty or whitespace-only text")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty or whitespace only",
        )

    # 2. Validation: Upper bound length
    text_length = len(raw_text)
    if text_length > TTS_MAX_TEXT_LENGTH:
        logger.warning(
            f"Rejected synthesis request: text length {text_length} exceeds limit of {TTS_MAX_TEXT_LENGTH}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Text exceeds maximum allowed length of {TTS_MAX_TEXT_LENGTH} characters (received {text_length})",
        )

    # 3. Readiness check
    if voice_model is None:
        logger.error("Synthesis requested but voice model is not loaded")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TTS model is not loaded or unavailable",
        )

    clean_text = raw_text.strip()
    # Log length only to protect user privacy
    logger.info(f"Received synthesis request: {len(clean_text)} characters")

    # 4. Concurrency protection & threadpool offload
    if concurrency_semaphore is None:
        concurrency_limiter = asyncio.Semaphore(TTS_MAX_CONCURRENCY)
    else:
        concurrency_limiter = concurrency_semaphore

    async with concurrency_limiter:
        start_time = time.perf_counter()
        try:
            wav_bytes = await asyncio.to_thread(
                _synthesize_wav_in_memory,
                voice_model,
                clean_text,
            )
        except Exception as e:
            logger.exception(f"Synthesis failed during Piper execution: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to synthesize speech",
            )

        duration = time.perf_counter() - start_time
        output_bytes = len(wav_bytes)
        logger.info(
            f"Synthesis completed in {duration:.3f}s: generated {output_bytes} bytes"
        )

    # 5. Return raw audio/wav response
    return Response(
        content=wav_bytes,
        media_type="audio/wav",
        headers={
            "Content-Type": "audio/wav",
            "Content-Length": str(output_bytes),
            "Content-Disposition": 'inline; filename="synthesized.wav"',
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "server:app",
        host=TTS_HOST,
        port=TTS_PORT,
        log_level="info",
    )
