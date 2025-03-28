export interface FileFilterOptions {
  mimeTypes: string[];
  maxSize?: number; // Bytes
}

export interface UploadOptions {
  destination: string;
  fileFilter?: FileFilterOptions;
}
