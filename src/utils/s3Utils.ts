import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import s3Client from '../config/awsConfig.js';

// S3에 파일 업로드를 위한 프리사인드 URL을 생성하는 함수
export const generatePutPresignedUrl = async (
  fileName: string,
  fileType: string
): Promise<string> => {
  try {
    const command = new PutObjectCommand({
      Bucket: 'melodiary-bucket', // S3 버킷 이름
      Key: fileName, // 파일명
      ContentType: fileType, // 파일의 MIME 타입
      ACL: 'private' // 파일 접근 권한
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // URL은 10분 동안 유효
    return url;
  } catch (error) {
    console.error('Error generating put presigned URL:', error);
    throw new Error('Could not generate put presigned URL');
  }
};

// S3에서 파일 다운로드를 위한 프리사인드 URL을 생성하는 함수
export const generateGetPresignedUrl = async (
  fileName: string
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: 'melodiary-bucket', // S3 버킷 이름
      Key: fileName // 파일 경로
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 600 }); // URL은 10분 동안 유효
    return url;
  } catch (error) {
    console.error('Error generating get presigned URL:', error);
    throw new Error('Could not generate get presigned URL');
  }
};
