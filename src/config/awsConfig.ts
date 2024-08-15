import { S3Client } from '@aws-sdk/client-s3';

// AWS S3 클라이언트 설정
const s3Client = new S3Client({
  region: process.env.AWS_REGION, // 환경 변수에서 AWS 리전을 가져옵니다.
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // 환경 변수에서 AWS Access Key ID를 가져옵니다.
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY! // 환경 변수에서 AWS Secret Access Key를 가져옵니다.
  }
});

export default s3Client;
