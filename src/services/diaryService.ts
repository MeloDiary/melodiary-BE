// 일기 관련 서비스
import dbPool from '../config/dbConfig.js';
import MusicModel from '../models/musicModel.js';
import WeatherModel from '../models/weatherModel.js';
import ImageModel from '../models/imageModel.js';
import { generateGetPresignedUrl } from '../utils/s3Utils.js';
import { IPostDiary } from '../types/diary.js';
import Diary from '../models/diaryModel.js';

export const checkTodayPost = async (userId: number) => {
    const dbConnection = await dbPool.getConnection();
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식으로 오늘 날짜 생성
      const diaryQuery = `SELECT * FROM diary WHERE user_id=? AND DATE(created_at)= ?`;
      const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
        diaryQuery,
        [userId, today]
      );
  
      return diaryRows.length > 0;
    } catch (error) {
      throw new Error('Database query error: ' + error.message);
    } finally {
      dbConnection.release();
    }
  };
  
export const checkAccessAuth = async (
    userId: string | number,
    writerId: string | number,
    privacy: string
  ) => {
    if (writerId == userId || privacy == 'public') {
      return true;
    } else if (privacy == 'private') {
      return false;
    }
    // (row.privacy == 'mate')
  
    const dbConnection = await dbPool.getConnection();
    try {
      const mateQuery = `SELECT * FROM mate WHERE status='accepted' AND ((requested_user_id = ? AND received_user_id = ?) OR (requested_user_id = ? AND received_user_id = ?) )`;
      const [mateRows] = await dbConnection.execute<RowDataPacket[]>(mateQuery, [
        userId,
        writerId,
        writerId,
        userId
      ]);
      if (mateRows.length == 0) {
        return false;
      } else {
        return true;
      }
    } catch {
      throw new Error('mate 테이블 참조 불가 오류 발생');
    } finally {
      dbConnection.release();
    }
  };
  
export  const convertDiaryInfo = async (row: any) => {
    const profileImgURL = row.profile_img_url
      ? await generateGetPresignedUrl(row.profile_img_url)
      : null;
  
    const diaryImgUrls = row.img_urls
      ? await Promise.all(
          row.img_urls.split(',').map((url: string) => {
            return generateGetPresignedUrl(url);
          })
        )
      : [];
  
    const result = {
      id: row.id,
      user_profile: {
        user_id: row.user_id,
        profile_img_url: profileImgURL,
        nickname: row.nickname
      },
      like_count: row.like_count,
      created_at: row.created_at,
      body: {
        title: row.title,
        content: row.content,
        img_urls: diaryImgUrls,
        mood: row.mood,
        emoji: row.emoji,
        privacy: row.privacy,
        music: row.music_url
          ? {
              music_url: row.music_url,
              title: row.music_title,
              artist: row.music_artist
            }
          : null,
        weather: row.location
          ? {
              location: row.location,
              icon: row.weather_icon,
              avg_temperature: row.avg_temperature
            }
          : null,
        background_color: row.background_color
      },
      liked: Boolean(row.liked)
    };
  
    return result;
  };
  
export const getUserProfile = async(row:any) => {

}

export const postDiaryService = async({
    title,
    content,
    img_urls,
    mood,
    emoji,
    privacy,
    background_color,
    music,
    weather
  }: IPostDiary,userId:number) => {
    const dbConnection = await dbPool.getConnection();
    try{
        await dbConnection.beginTransaction();
    const diary = await Diary.post({
        title,
        content,
        img_urls,
        mood,
        emoji,
        privacy,
        background_color,
        music,
        weather
      },userId,dbConnection)
    
    if(music)
        await MusicModel.post(diary.insertId,music,dbConnection)

    if(weather)
        await WeatherModel.post(diary.insertId,weather,dbConnection)
    if (img_urls && img_urls.length > 0) {
        for (let i = 0; i < img_urls.length; i++) {
          await ImageModel.post(diary.insertId, img_urls[i], i,dbConnection);
        }
        }

    await dbConnection.commit();
    }
    catch(error){
        await dbConnection.rollback();
    }
    finally{
        dbConnection.release();
    }
}