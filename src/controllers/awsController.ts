// AWS 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import { presignedUrlService } from '../services/awsService.js';

// 프리사인드 url 생성 controller
export const presignedUrlController = async (req: Request, res: Response) => {
  try {
    const { file_name: fileName, file_type: fileType } = req.body;

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!fileName || !fileType) {
      return res.status(400).json({ message: 'Bad request' });
    }

    const result = await presignedUrlService(fileName, fileType);

    // 프리사인드 URL 생성 성공한 경우 200 코드와 프리사인드 URL 리턴함
    return res.status(200).json({ presigned_url: result });
  } catch (error) {
    console.error('Error in presignedUrlController');
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};
