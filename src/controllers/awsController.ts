// AWS 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import { s3ImageUploadUrlService } from '../services/awsService.js';

// S3 버킷 이미지 업로드 controller
export const s3ImageUploadController = async (req: Request, res: Response) => {
  try {
    let filenames = req.body['filenames'];
    const files = req.files as Express.Multer.File[];

    // 이미지 하나만 업로드하는 경우 파일명을 배열로 변환
    if (typeof filenames === 'string') {
      filenames = [filenames];
    }

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!Array.isArray(filenames) || filenames.length !== files.length) {
      return res.status(400).json({ message: 'Bad request' });
    }

    const result = await s3ImageUploadUrlService(filenames, files);

    // 프리사인드 URL 생성 성공한 경우 200 코드와 이미지 URL 리턴함
    return res.status(200).json({ image_urls: result });
  } catch (error) {
    console.error('Error in s3ImageUploadController');
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};
