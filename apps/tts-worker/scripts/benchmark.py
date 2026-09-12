import urllib.request
import json
import time
import wave
import io

benchmarks = [
    (
        "~20 words",
        "VoiceFlow transforms speech into structured text and intelligent AI responses instantly using modern open-source models on local hardware."
    ),
    (
        "~100 words",
        "Welcome to the VoiceFlow intelligent audio platform. In modern voice engineering, real-time performance and private data processing are crucial. By deploying local neural network models for automatic speech recognition, large language understanding, and neural speech synthesis, applications achieve high security, zero cloud fees, and deterministic response times. Whether you are dictating meeting minutes, drafting emails on the go, or asking questions to an offline voice assistant, local processing keeps your private thoughts completely secure on your personal workstation without sending sensitive recordings to external cloud vendors."
    ),
    (
        "~300 words",
        "Speech technology has advanced rapidly over the past few years, evolving from robotic concatenative synthesizers into expressive neural acoustic models capable of rendering human intonation, natural breathing, and clear pacing. In traditional architectures, developer teams relied entirely on third-party cloud application programming interfaces to handle transcription and speech generation. While convenient for prototyping, cloud solutions introduce recurring usage costs, unpredictable latency spikes, privacy risks, and vendor lock-in. VoiceFlow demonstrates that modern workstations equipped with multi-core central processing units have more than enough computing capacity to run full-stack voice intelligence completely offline. By pairing faster-whisper for speech-to-text recognition, quantized local large language models for intelligent query processing, and Piper neural text-to-speech for vocal output, users can record their thoughts, receive structured insights, and listen to synthesized spoken responses in seconds. Because synthetic audio generation operates with a real-time factor below one tenth, paragraphs of text are turned into broadcast-quality audio files faster than the human ear can listen to them. This opens up opportunities for privacy-conscious organizations, legal professionals, healthcare practitioners, and software engineers who demand confidentiality without sacrificing modern user experience. As we continue hardening the VoiceFlow pipeline, modular microservice boundaries, centralized rate limiting, and relational user ownership ensure the architecture scales cleanly from a personal development laptop to horizontally distributed multi-server clusters."
    )
]

header = f"{'Tier':<12} | {'Words':<6} | {'Chars':<6} | {'Gen Time':<10} | {'Audio Dur':<10} | {'RTF':<8} | {'Bytes':<10}"
print(header)
print("-" * len(header))

for name, text in benchmarks:
    words = len(text.split())
    chars = len(text)
    data = json.dumps({"text": text}).encode("utf-8")
    
    t0 = time.perf_counter()
    req = urllib.request.Request(
        "http://localhost:8001/synthesize",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        wav_bytes = resp.read()
    gen_time = time.perf_counter() - t0
    
    # Parse WAV duration
    with wave.open(io.BytesIO(wav_bytes), "rb") as w:
        frames = w.getnframes()
        rate = w.getframerate()
        audio_dur = frames / float(rate)
    
    rtf = gen_time / audio_dur
    size_bytes = len(wav_bytes)
    
    row = f"{name:<12} | {words:<6} | {chars:<6} | {gen_time:>8.3f}s | {audio_dur:>8.2f}s | {rtf:>7.3f}x | {size_bytes:>8} B"
    print(row)
