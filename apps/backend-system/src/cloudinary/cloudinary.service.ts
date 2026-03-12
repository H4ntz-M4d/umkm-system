import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier'
import { CloudinaryFolder } from './dto/dto.cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

@Injectable()
export class CloudinaryService {
    async uploadImage(
        file: Express.Multer.File,
        folders: CloudinaryFolder = CloudinaryFolder.PRODUCTS
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream({
                folder: folders,
                allowed_formats: ['png', 'jpg', 'webp']
            }, (error, result: UploadApiResponse) => {
                if (error) {
                    console.error('Cloudinary error:', error); // <-- tambah ini
                    return reject(error);
                }
                resolve(result.secure_url);
            });

            if (!file.buffer) {
                console.error('File buffer kosong!'); // <-- tambah ini
                return reject(new Error('File buffer is empty'));
            }

            const stream = streamifier.createReadStream(file.buffer);
            stream.pipe(upload);
        });
    }
    
    async deleteImage(imageUrl: string): Promise<any> {
        const urlParts = imageUrl.split("/");
        const fileNameWithExt = urlParts[urlParts.length - 1];
        const filename = fileNameWithExt.split('.')[0];
        const folder = urlParts[urlParts.length - 2]
        const publicId = `${folder}/${filename}`

        await cloudinary.uploader.destroy(publicId)
    }
}
