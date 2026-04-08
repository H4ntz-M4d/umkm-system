import {
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseFilePipe,
  FileValidator,
} from '@nestjs/common';

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

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_SIZE = 1024 * 1024 * 2; // 2MB

export const IMAGE_VALIDATOR = (isRequired = false) =>
  new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({
        maxSize: MAX_SIZE, // 2MB
        message: 'Ukuran file terlalu besar. Maksimal 2MB.',
      }),
      new MimeTypeValidator(ALLOWED_MIME_TYPES),
    ],
    fileIsRequired: isRequired,
  });

export const validateImageFiles = (
  files?: Express.Multer.File[],
  maxCount = 10,
) => {
  if (!files || files.length === 0) return;

  if (files.length > maxCount) {
    throw new Error(`Maksimal ${maxCount} file.`);
  }

  for (const file of files) {
    if (file.size > MAX_SIZE) {
      throw new Error(`File ${file.originalname} terlalu besar. Maksimal 2MB.`);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.trim())) {
      throw new Error(`File ${file.originalname} tipe tidak didukung.`);
    }
  }
};
