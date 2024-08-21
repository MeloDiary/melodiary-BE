// aws 관련 service
import axios from 'axios';
import { generatePutPresignedUrl } from '../utils/s3Utils.js';

// S3 버킷 이미지 업로드 service
export const s3ImageUploadUrlService = async (
  filenames: string[],
  files: Express.Multer.File[]
): Promise<string[]> => {
  try {
    const uploadResults = await Promise.all(
      files.map(async (file, index) => {
        const url = await generatePutPresignedUrl(
          filenames[index],
          file.mimetype
        );

        await axios.put(url, file.buffer, {
          headers: {
            'Content-Type': file.mimetype
          }
        });

        return filenames[index];
      })
    );

    return uploadResults;
  } catch (error) {
    console.error('Error in s3ImageUploadUrlService', error);
    throw error;
  }
};
