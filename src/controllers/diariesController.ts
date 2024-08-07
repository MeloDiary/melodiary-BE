import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
//import { StatusCodes } from 'http-status-codes';
import dbPool from '../config/dbConfig.js';
import { IDiary, IPostDiary } from '../types/diary';

export const postDiary = async (req: Request, res: Response) => {
  try {
    const {
      title,
      content,
      user_id,
      img_urls,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather
    }: IPostDiary = req.body;

    // diary 테이블에 데이터 삽입
    const diaryQuery = `INSERT INTO diary (title, content, user_id, mood, emoji, privacy, background_color) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await dbPool.execute<ResultSetHeader>(diaryQuery, [
      title,
      content,
      user_id,
      mood,
      emoji,
      privacy,
      background_color
    ]);

    // 생성된 diary ID 가져오기
    const diaryId = result.insertId;

    // Insert into the music table
    if (music) {
      const musicQuery = `
      INSERT INTO music (diary_id, music_url, title, artist) 
      VALUES (?, ?, ?, ?)
    `;

      await dbPool.execute(musicQuery, [
        diaryId,
        music.musicUrl,
        music.title,
        music.artist
      ]);
    }

    // Insert into the weather table
    if (weather) {
      const weatherQuery = `
      INSERT INTO weather (diary_id, location, icon, avg_temperature) 
      VALUES (?, ?, ?, ?)
    `;

      await dbPool.execute(weatherQuery, [
        diaryId,
        weather.location,
        weather.icon,
        weather.avgTemperature
      ]);
    }

    if (img_urls) {
      const imgQuery = `INSERT INTO image (diary_id, url) VALUES (?, ?)`;
      while (img_urls.length > 0) {
        let img_url = img_urls.shift();
        await dbPool.execute(imgQuery, [diaryId, img_url]);
      }
    }

    res.status(201).json({ diary_id: diaryId });
  } catch (error) {
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
};

export const putDiary = async (req: Request, res: Response) => {
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const {
      title,
      content,
      user_id,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather,
      img_urls
    }: IPostDiary = req.body;

    // Update the diary table
    const diaryQuery = `
      UPDATE diary 
      SET title = ?, content = ?, user_id = ?, mood = ?, emoji = ?, privacy = ?, background_color = ?
      WHERE id = ?`;

    await dbPool.execute<ResultSetHeader>(diaryQuery, [
      title,
      content,
      user_id,
      mood,
      emoji,
      privacy,
      background_color,
      diaryId
    ]);

    // Update or insert into the music table
    if (music) {
      const musicQuery = `
        INSERT INTO music (diary_id, music_url, title, artist)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE music_url = VALUES(music_url), title = VALUES(title), artist = VALUES(artist)`;

      await dbPool.execute(musicQuery, [
        diaryId,
        music.musicUrl,
        music.title,
        music.artist
      ]);
    }

    // Update or insert into the weather table
    if (weather) {
      const weatherQuery = `
        INSERT INTO weather (diary_id, location, icon, avg_temperature)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE location = VALUES(location), icon = VALUES(icon), avg_temperature = VALUES(avg_temperature)`;

      await dbPool.execute(weatherQuery, [
        diaryId,
        weather.location,
        weather.icon,
        weather.avgTemperature
      ]);
    }

    //이미지 수정 부분은 우선 제외

    res.status(200).send('Successfully changed the diary');
  } catch (error) {
    console.error('업데이트 오류:', error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  }
};

export const deleteDiary = async (req: Request, res: Response) => {
  try {
    const diaryId = parseInt(req.params.diaryId, 10);

    // Delete from music table first due to foreign key constraints
    const deleteMusicQuery = `
      DELETE FROM music WHERE diary_id = ?`;
    await dbPool.execute(deleteMusicQuery, [diaryId]);

    // Delete from weather table
    const deleteWeatherQuery = `
      DELETE FROM weather WHERE diary_id = ?`;
    await dbPool.execute(deleteWeatherQuery, [diaryId]);

    // Delete from Image table

    const deleteImageQuery = `
      DELETE FROM image WHERE diary_id = ?`;
    await dbPool.execute(deleteImageQuery, [diaryId]);

    // Finally, delete from diary table
    const deleteDiaryQuery = `
      DELETE FROM diary WHERE id = ?`;
    await dbPool.execute(deleteDiaryQuery, [diaryId]);

    res.status(200).send('Successfully deleted the diary');
  } catch (error) {
    console.error('삭제 오류:', error);
    res.status(500).send('There is something wrong with the server');
  }
};

export const getDiary = async (req: Request, res: Response) => {
  try {
    const diaryId = parseInt(req.params.diaryId, 10);

    // Retrieve diary entry
    const diaryQuery = `
      SELECT * FROM diary WHERE id = ?`;
    const [diaryRows] = await dbPool.execute<RowDataPacket[]>(diaryQuery, [
      diaryId
    ]);

    if (diaryRows.length === 0) {
      return res.status(404).send('Diary 항목을 찾을 수 없습니다');
    }

    const diary = diaryRows[0];
    // Retrieve associated music entry
    const musicQuery = `
      SELECT music_url, title, artist FROM music WHERE diary_id = ?`;
    const [musicRows] = await dbPool.execute<RowDataPacket[]>(musicQuery, [
      diaryId
    ]);
    const music = musicRows.length > 0 ? musicRows[0] : null;

    // Retrieve associated weather entry
    const weatherQuery = `
      SELECT location, icon, avg_temperature FROM weather WHERE diary_id = ?`;
    const [weatherRows] = await dbPool.execute<RowDataPacket[]>(weatherQuery, [
      diaryId
    ]);
    const weather = weatherRows.length > 0 ? weatherRows[0] : null;

    const imageQuery = `
      SELECT url FROM image WHERE diary_id = ?`;
    const [imageRows] = await dbPool.execute<RowDataPacket[]>(imageQuery, [
      diaryId
    ]);

    const img_urls =
      imageRows.length > 0 ? imageRows.map((row) => row.url) : null;

    const {
      user_id,
      like_count,
      created_at,
      title,
      content,
      mood,
      emoji,
      privacy,
      background_color
    } = diary;

    const likeQuery = `SELECT * FROM likes WHERE diary_id = ? AND user_id=?`;

    const [likeRows] = await dbPool.execute<RowDataPacket[]>(likeQuery, [
      user_id,
      diaryId
    ]);

    const liked = likeRows.length > 0 ? true : false;

    // Compile the result
    const result = {
      id: diaryId,
      user_id,
      like_count,
      created_at,
      body: {
        title,
        content,
        img_urls,
        mood,
        emoji,
        privacy,
        music,
        weather,
        background_color
      },
      liked
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('조회 오류:', error);
    res.status(500).send('There is something wrong with the server');
  }
};

export const getLike = async (req: Request, res: Response) => {
  try {
    const userID = 1; // JWT에서 가져와야
    const { diaryId } = req.params;

    // diary 테이블에 데이터 삽입
    const query = `SELECT * FROM likes WHERE diary_id = ? AND user_id=?`;

    const [result] = await dbPool.execute<RowDataPacket[]>(query, [
      diaryId,
      userID
    ]);

    if (result.length == 0) {
      res.status(200).json({ has_posts: false });
    } else {
      res.status(200).json({ has_posts: true });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
};
export const postLike = async (req: Request, res: Response) => {
  try {
    const userID = 1; // JWT에서 가져와야
    const { diaryId } = req.params;

    // diary 테이블에 데이터 삽입
    const query = `INSERT INTO likes (user_id, diary_id) VALUES (?, ?)`;

    const [result] = await dbPool.execute<RowDataPacket[]>(query, [
      userID,
      diaryId
    ]);

    const diaryQuery = `
      UPDATE diary 
      SET like_count = like_count+1
      WHERE id = ?`;

    await dbPool.execute<ResultSetHeader>(diaryQuery, [diaryId]);

    res.status(201).json({ message: 'Successfully posted the like' });
  } catch (error) {
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
};
export const deleteLike = async (req: Request, res: Response) => {
  try {
    const userID = 1; // JWT에서 가져와야
    const { diaryId } = req.params;

    // diary 테이블에 데이터 삽입
    const query = `DELETE FROM likes WHERE user_id =? AND diary_id= ?`;
    const [result] = await dbPool.execute<RowDataPacket[]>(query, [
      userID,
      diaryId
    ]);

    const diaryQuery = `
      UPDATE diary 
      SET like_count = like_count-1
      WHERE id = ?`;

    await dbPool.execute<ResultSetHeader>(diaryQuery, [diaryId]);

    res.status(201).json({ message: 'Successfully canceled the like' });
  } catch (error) {
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
};
export const getCalendar = async (req: Request, res: Response) => {};
export const getMatefeeds = async (req: Request, res: Response) => {};
export const getExplore = async (req: Request, res: Response) => {};
export const getMypost = async (req: Request, res: Response) => {};
export const getMymoods = async (req: Request, res: Response) => {};
