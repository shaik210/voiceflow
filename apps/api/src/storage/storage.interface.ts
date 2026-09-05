export interface StorageUploadParams {
  key: string;
  body: Buffer;
  mimeType: string;
}

export interface StorageObject {
  body: Buffer;
  mimeType: string;
}

export interface ObjectStorage {
  upload(params: StorageUploadParams): Promise<void>;
  delete(key: string): Promise<void>;
  get(key: string): Promise<StorageObject>;
}
