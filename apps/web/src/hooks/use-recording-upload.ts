import { useState, useCallback } from 'react';
import { uploadRecording } from '@/lib/api/recordings';

interface UseRecordingUploadResult {
  isUploading: boolean;
  isUploaded: boolean;
  uploadError: string | null;
  uploadedMetadata: any | null;
  upload: (blob: Blob) => Promise<void>;
  resetUpload: () => void;
}

export const useRecordingUpload = (): UseRecordingUploadResult => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedMetadata, setUploadedMetadata] = useState<any | null>(null);

  const upload = useCallback(async (blob: Blob) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const result = await uploadRecording(blob);
      setUploadedMetadata(result.recording);
      setIsUploaded(true);
    } catch (err: any) {
      setUploadError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  }, []);

  const resetUpload = useCallback(() => {
    setIsUploading(false);
    setIsUploaded(false);
    setUploadError(null);
    setUploadedMetadata(null);
  }, []);

  return {
    isUploading,
    isUploaded,
    uploadError,
    uploadedMetadata,
    upload,
    resetUpload,
  };
};
