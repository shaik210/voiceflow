#!/usr/bin/env bash
set -euo pipefail

# Determine script and models directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODELS_DIR="${SCRIPT_DIR}/../models"

mkdir -p "${MODELS_DIR}"

MODEL_NAME="en_US-lessac-medium"
BASE_URL="https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium"

ONNX_FILE="${MODELS_DIR}/${MODEL_NAME}.onnx"
JSON_FILE="${MODELS_DIR}/${MODEL_NAME}.onnx.json"

echo "Checking Piper voice model: ${MODEL_NAME}..."

# Check if model already exists and is non-empty
if [ -s "${ONNX_FILE}" ] && [ -s "${JSON_FILE}" ]; then
  echo "Model files already present in ${MODELS_DIR}:"
  echo "  - ${ONNX_FILE} ($(du -h "${ONNX_FILE}" | cut -f1))"
  echo "  - ${JSON_FILE} ($(du -h "${JSON_FILE}" | cut -f1))"
  echo "Model is ready for use."
  exit 0
fi

echo "Downloading ${MODEL_NAME} ONNX model and config from Hugging Face..."

# Download .onnx model safely to temporary file
TMP_ONNX="${ONNX_FILE}.tmp"
echo "Fetching ${MODEL_NAME}.onnx..."
curl -fSL --progress-bar "${BASE_URL}/${MODEL_NAME}.onnx" -o "${TMP_ONNX}"
mv "${TMP_ONNX}" "${ONNX_FILE}"

# Download .onnx.json config safely to temporary file
TMP_JSON="${JSON_FILE}.tmp"
echo "Fetching ${MODEL_NAME}.onnx.json..."
curl -fSL --progress-bar "${BASE_URL}/${MODEL_NAME}.onnx.json" -o "${TMP_JSON}"
mv "${TMP_JSON}" "${JSON_FILE}"

echo "Model downloaded successfully:"
echo "  - ${ONNX_FILE} ($(du -h "${ONNX_FILE}" | cut -f1))"
echo "  - ${JSON_FILE} ($(du -h "${JSON_FILE}" | cut -f1))"
