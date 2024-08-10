// 사용자 관련 인터페이스 정의 모듈
export interface IUser {
  id: number;
  email: string;
  nickname: string;
  profileImgURL: string;
  createdAt: Date;
}

export interface IUserInfo {
  id: number;
  profileImgURL: string | null;
  profileBackgroundImgURL: string | null;
  nickname: string;
  email: string;
  mateCnt: number;
  diaryCnt: number;
}

export interface IAuthRequest {
  serviceProvider: 'google' | 'naver' | 'kakao';
  authorizationCode: string;
  state: string;
}
