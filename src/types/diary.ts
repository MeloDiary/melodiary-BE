import { RowDataPacket } from 'mysql2';

export interface IDiary {
  id: number;
  title: string;
  content: string;
  userId: number;
  mood?: string | null;
  emoji?: string | null;
  privacy: 'public' | 'mate' | 'private';
  likeCount: number;
  createdAt: Date;
  backgroundColor?: string | null;
}

export interface IPostDiary {
  title: string;
  content: string;
  user_id: number;
  img_urls?: string[] | null;
  mood?: string | null;
  emoji?: string | null;
  privacy: 'public' | 'mate' | 'private';
  background_color?: string | null;
  music?: IPostMusic | null;
  weather?: IPostWeather | null;
}

interface IPostMusic {
  musicUrl: string;
  title: string;
  artist: string;
}

interface IPostWeather {
  location: string;
  icon: string;
  avgTemperature: number;
}
