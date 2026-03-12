import { MaxFileSizeValidator, FileTypeValidator, ParseFilePipe, FileValidator } from '@nestjs/common';

export class MimeTypeValidator extends FileValidator {
  constructor(private allowedMimeTypes: string[]) {
    super({});
  }

  isValid(file: Express.Multer.File): boolean {
    return this.allowedMimeTypes.includes(file.mimetype.trim());
  }

  buildErrorMessage(): string {
    return `Tipe file tidak didukung. Gunakan: ${this.allowedMimeTypes.join(', ')}`;
  }
}


export const IMAGE_VALIDATOR = (isRequired = false) => new ParseFilePipe({
  validators: [
    new MaxFileSizeValidator({ 
      maxSize: 1024 * 1024 * 2, // 2MB
      message: 'Ukuran file terlalu besar. Maksimal 2MB.' 
    }),
    new MimeTypeValidator(['image/png', 'image/jpeg', 'image/webp']),
  ],
  fileIsRequired: isRequired,
});