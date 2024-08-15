// aws 관련 service

import { generatePutPresignedUrl } from '../utils/s3Utils.js';

// 프리사인드 URL 생성 service
export const presignedUrlService = async (
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    return await generatePutPresignedUrl(fileName, fileType);
  } catch (error) {
    console.error('Error in presignedUrlService', error);
    throw error;
  }
};
