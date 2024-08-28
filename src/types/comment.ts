import { RowDataPacket } from 'mysql2';

export interface IComment extends RowDataPacket {
  id: number;
  diary_id: number;
  writer_user_id: number;
  content: string;
  mentioned_user_id: number;
  created_at: Date;
}

export interface IPostComment {
  content: string;
  mentioned_user_id: number;
}

export interface IUserProfile{
  user_id: number;
  nickname: string;
  profile_img_url?: string | null;
}

export interface IUserProfileRowDataPacket extends RowDataPacket, IUserProfile{}