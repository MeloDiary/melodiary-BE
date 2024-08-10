import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import { IPostDiary } from '../types/diary';
import { JwtPayload } from 'jsonwebtoken';

export const postDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const {
      title,
      content,
      img_urls,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather
    }: IPostDiary = req.body;

    
    const { userId } = req.user as JwtPayload;


    await dbConnection.beginTransaction();

    // diary 테이블에 데이터 삽입
    const diaryQuery = `INSERT INTO diary (title, content, user_id, mood, emoji, privacy, background_color) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await dbConnection.execute<ResultSetHeader>(diaryQuery, [
      title,
      content,
      userId,
      mood,
      emoji,
      privacy,
      background_color
    ]);

    // 생성된 diary ID 가져오기
    const diaryId = result.insertId;

    // music table
    if (music) {
      const musicQuery = `
      INSERT INTO music (diary_id, music_url, title, artist) 
      VALUES (?, ?, ?, ?)
    `;

      await dbConnection.execute(musicQuery, [
        diaryId,
        music.url,
        music.title,
        music.artist
      ]);
    }

    // weather table
    if (weather) {
      const weatherQuery = `
      INSERT INTO weather (diary_id, location, icon, avg_temperature) 
      VALUES (?, ?, ?, ?)
    `;

      await dbConnection.execute(weatherQuery, [
        diaryId,
        weather.location,
        weather.icon,
        weather.avg_temperature
      ]);
    }

    if (img_urls && img_urls.length > 0) {
      const imgQuery = `INSERT INTO image (diary_id, url) VALUES (?, ?)`;
      for (const img_url of img_urls) {
        await dbConnection.execute(imgQuery, [diaryId, img_url]);
      }
    }

    await dbConnection.commit();
    res.status(201).json({ diary_id: diaryId });
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
  finally{
    dbConnection.release();
  }
};

export const putDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const {
      title,
      content,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather
    }: //img_urls
    IPostDiary = req.body;
    const { userId } = req.user as JwtPayload;
    // 수정하려는 일기의 유저 ID와 현재 유저 ID를 비교한 후, 다르면 403(권한없음) 에러를 리턴합니다.

    dbConnection.beginTransaction();
    const checkQuery = `SELECT * FROM diary WHERE id = ? AND user_id= ?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(checkQuery, [
      diaryId,
      userId
    ]);
    if (checkRows.length == 0) {
      return res
        .status(403)
        .json({ message: 'No permission to access the diary' });
    }
    // Update the diary table
    const diaryQuery = `
      UPDATE diary 
      SET title = ?, content = ?, mood = ?, emoji = ?, privacy = ?, background_color = ?
      WHERE id = ?`;

    await dbConnection.execute<ResultSetHeader>(diaryQuery, [
      title,
      content,
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

      await dbConnection.execute(musicQuery, [
        diaryId,
        music.url,
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

      await dbConnection.execute(weatherQuery, [
        diaryId,
        weather.location,
        weather.icon,
        weather.avg_temperature
      ]);
    }

    //이미지 수정 부분은 우선 제외
    await dbConnection.commit();
    res.status(200).send('Successfully changed the diary');
  } catch (error) {
    await dbConnection.rollback();
    console.error('업데이트 오류:', error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  }  finally{
    dbConnection.release();
  }
};

export const deleteDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diaryId = parseInt(req.params.diaryId, 10);

    const { userId } = req.user as JwtPayload;
    await dbConnection.beginTransaction();
    // 수정하려는 일기의 유저 ID와 현재 유저 ID를 비교한 후, 다르면 403(권한없음) 에러를 리턴합니다.
    const checkQuery = `SELECT * FROM diary WHERE id = ? AND user_id= ?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(checkQuery, [
      diaryId,
      userId
    ]);
    if (checkRows.length == 0) {
      return res
        .status(403)
        .json({ message: 'No permission to access the diary' });
    }

    // Delete from music table first due to foreign key constraints
    const deleteMusicQuery = `
      DELETE FROM music WHERE diary_id = ?`;
    await dbConnection.execute(deleteMusicQuery, [diaryId]);

    // Delete from weather table
    const deleteWeatherQuery = `
      DELETE FROM weather WHERE diary_id = ?`;
    await dbConnection.execute(deleteWeatherQuery, [diaryId]);

    // Delete from Image table

    const deleteImageQuery = `
      DELETE FROM image WHERE diary_id = ?`;
    await dbConnection.execute(deleteImageQuery, [diaryId]);

    // Finally, delete from diary table
    const deleteDiaryQuery = `
      DELETE FROM diary WHERE id = ?`;
    await dbConnection.execute(deleteDiaryQuery, [diaryId]);
    await dbConnection.commit();
    res.status(200).send('Successfully deleted the diary');
  } catch (error) {
    await dbConnection.rollback();
    console.error('삭제 오류:', error);
    res.status(500).send('There is something wrong with the server');
  }
  finally{
    dbConnection.release();
  }
};

export const getDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diaryId = parseInt(req.params.diaryId, 10);

    const { userId } = req.user as JwtPayload;

      dbConnection.beginTransaction();
    // Retrieve diary entry
    const diaryQuery = `
      SELECT * FROM diary WHERE id = ?`;
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(diaryQuery, [
      diaryId
    ]);

    if (diaryRows.length === 0) {
      return res.status(404).send('Diary 항목을 찾을 수 없습니다');
    }

    const diary = diaryRows[0];
    // Retrieve associated music entry
    const musicQuery = `
      SELECT music_url, title, artist FROM music WHERE diary_id = ?`;
    const [musicRows] = await dbConnection.execute<RowDataPacket[]>(musicQuery, [
      diaryId
    ]);
    const music = musicRows.length > 0 ? musicRows[0] : null;

    // Retrieve associated weather entry
    const weatherQuery = `
      SELECT location, icon, avg_temperature FROM weather WHERE diary_id = ?`;
    const [weatherRows] = await dbConnection.execute<RowDataPacket[]>(weatherQuery, [
      diaryId
    ]);
    const weather = weatherRows.length > 0 ? weatherRows[0] : null;

    const imageQuery = `
      SELECT url FROM image WHERE diary_id = ?`;
    const [imageRows] = await dbConnection.execute<RowDataPacket[]>(imageQuery, [
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

    const [likeRows] = await dbConnection.execute<RowDataPacket[]>(likeQuery, [
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
    await dbConnection.commit();
    res.status(200).json(result);
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res.status(500).send('There is something wrong with the server');
  }
  finally{
    dbConnection.release();
  }
};

export const getLike = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;
    const { diaryId } = req.params;

    // diary 테이블에 데이터 삽입
    const query = `SELECT * FROM likes WHERE diary_id = ? AND user_id=?`;

    const [result] = await dbPool.execute<RowDataPacket[]>(query, [
      diaryId,
      userId
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

//한번만 되게 변경해야함.
export const postLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;
    const { diaryId } = req.params;
    
    await dbConnection.beginTransaction();
    // diary 테이블에 데이터 삽입
    const query = `INSERT INTO likes (user_id, diary_id) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), diary_id = VALUES(diary_id)`;
    
    await dbConnection.execute<RowDataPacket[]>(query, [userId, diaryId]);

    const diaryQuery = `
      UPDATE diary 
      SET like_count = like_count+1
      WHERE id = ?`;

    await dbConnection.execute<ResultSetHeader>(diaryQuery, [diaryId]);

    await dbConnection.commit();
    res.status(201).json({ message: 'Successfully posted the like' });
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
  finally{
    dbConnection.release();
  }
};
export const deleteLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const userId = 20;
    //const { userId } = req.user as JwtPayload;
    const { diaryId } = req.params;

    await dbConnection.beginTransaction();
    // diary 테이블에 데이터 삽입
    const query = `DELETE FROM likes WHERE user_id =? AND diary_id= ?`;
    await dbConnection.execute<RowDataPacket[]>(query, [userId, diaryId]);

    const diaryQuery = `
      UPDATE diary 
      SET like_count = like_count-1
      WHERE id = ?`;

    await dbConnection.execute<ResultSetHeader>(diaryQuery, [diaryId]);

    await dbConnection.commit();
    res.status(201).json({ message: 'Successfully canceled the like' });
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  }
  finally{
    dbConnection.release();
  }
};
// export const getCalendar = async (req: Request, res: Response) => {};
// export const getMatefeeds = async (req: Request, res: Response) => {};
// export const getExplore = async (req: Request, res: Response) => {};
// export const getMypost = async (req: Request, res: Response) => {};
// export const getMymoods = async (req: Request, res: Response) => {};
