export interface IComment {
  id: number;
  diaryId: number;
  writerUserId: number;
  content: string;
  mentionedUserId: number;
  createdAt: Date;
}
