export interface IComment {
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
