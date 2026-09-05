import os
import shutil
import tempfile
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from faster_whisper import WhisperModel
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

model_size = os.environ.get("LOCAL_WHISPER_MODEL", "base")
logger.info(f"Loading faster-whisper model: {model_size}")
# Using CPU by default for maximum compatibility across environments.
# Uses int8 for lighter memory footprint.
model = WhisperModel(model_size, device="cpu", compute_type="int8")
logger.info("Model loaded successfully")

@app.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    if not audio.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")

    # Generate a unique temporary filename
    ext = os.path.splitext(audio.filename)[1] or ".tmp"
    temp_filename = os.path.join(tempfile.gettempdir(), f"transcribe_{uuid.uuid4().hex}{ext}")

    try:
        # Save uploaded file safely
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
            
        logger.info(f"Starting transcription for {temp_filename}")
        
        # Whisper auto-detects language and transcribes
        segments, info = model.transcribe(temp_filename, beam_size=5)
        
        text = " ".join([segment.text for segment in segments]).strip()
        
        logger.info("Transcription completed successfully")
        return {"text": text}
    
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to transcribe audio")
    
    finally:
        # Ensure temporary file is deleted even if transcription fails
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                logger.warning(f"Failed to cleanup temporary file {temp_filename}: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
