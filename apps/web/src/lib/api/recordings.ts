const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function uploadRecording(blob: Blob, originalName: string = 'recording.webm') {
  const formData = new FormData();
  formData.append('audio', blob, originalName);

  const response = await fetch(`${API_URL}/api/recordings`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, stick to default error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function transcribeRecording(id: string) {
  const response = await fetch(`${API_URL}/api/recordings/${id}/transcribe`, {
    method: 'POST',
  });

  if (!response.ok) {
    let errorMessage = 'Transcription failed';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If parsing fails, stick to default error
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
