export interface IFileUploadService {
  prepareUploadDestination(destinationPath: string): string;
  generateUniqueFilename(originalFilename: string): string;
  validateUploadedFile(file: Express.Multer.File): boolean;
}
