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
        music.music_url,
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
      const imgQuery = `INSERT INTO image (diary_id, image_url) VALUES (?, ?)`;
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
  } finally {
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
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId, userId]
    );
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
        music.music_url,
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
  } finally {
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
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId, userId]
    );
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
  } finally {
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
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
      diaryQuery,
      [diaryId]
    );

    if (diaryRows.length === 0) {
      return res.status(404).send('Diary 항목을 찾을 수 없습니다');
    }

    const diary = diaryRows[0];
    // Retrieve associated music entry
    const musicQuery = `
      SELECT music_url, title, artist FROM music WHERE diary_id = ?`;
    const [musicRows] = await dbConnection.execute<RowDataPacket[]>(
      musicQuery,
      [diaryId]
    );
    const music = musicRows.length > 0 ? musicRows[0] : null;

    // Retrieve associated weather entry
    const weatherQuery = `
      SELECT location, icon, avg_temperature FROM weather WHERE diary_id = ?`;
    const [weatherRows] = await dbConnection.execute<RowDataPacket[]>(
      weatherQuery,
      [diaryId]
    );
    const weather = weatherRows.length > 0 ? weatherRows[0] : null;

    const imageQuery = `
      SELECT url FROM image WHERE diary_id = ?`;
    const [imageRows] = await dbConnection.execute<RowDataPacket[]>(
      imageQuery,
      [diaryId]
    );

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
  } finally {
    dbConnection.release();
  }
};

export const getLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { diaryId } = req.params;

    await dbConnection.beginTransaction();

    const query = `SELECT user_id FROM likes WHERE diary_id = ?`;

    const [rows] = await dbConnection.execute<RowDataPacket[]>(query, [
      diaryId
    ]);
    const userIds = rows.map((row) => row.user_id);
    const userQuery = `SELECT id AS user_id, nickname, profile_img_url FROM user WHERE id IN (?)`;
    const [userRows] = await dbConnection.execute(userQuery, userIds);
    await dbConnection.commit();

    res.status(200).json(userRows);
  } catch (error) {
    await dbConnection.rollback();
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};

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
  } finally {
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
  } finally {
    dbConnection.release();
  }
};

export const getCalendar = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;
    const { userID: mateId, month } = req.query;

    await dbConnection.beginTransaction();
    const startDate = `${month}-01`;
    const endDate = `${month}-31 23:59:59`; // 28일 또는 29일이 아닌 31일로 설정해서 안전하게 다 포함
    const query = `SELECT created_at AS date, id AS diary_id, emoji FROM diary WHERE user_id = ? AND created_at BETWEEN ? AND ?`;

    const [result] = await dbConnection.execute<ResultSetHeader>(query, [
      mateId,
      startDate,
      endDate
    ]);

    await dbConnection.commit();
    res.status(200).json(result);
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};

//페이지네이션 필요, 음악 등 첨부
export const getMatefeeds = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();
    const mateQuery = `SELECT received_user_id AS mate_id FROM mate WHERE status = 'accepted' AND requested_user_id = ?`;

    const [mateRows] = await dbConnection.execute<RowDataPacket[]>(mateQuery, [
      userId
    ]);
    const mateIds = mateRows.map((row) => row.mate_id);

    let diaryRows: any[] = [];
    if (mateIds.length > 0) {
      const diaryQuery = `SELECT * FROM diary WHERE user_id IN (?) AND privacy IN ('mate','public') ORDER BY created_at DESC`;
      [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
        diaryQuery,
        mateIds
      );
    }

    await dbConnection.commit();
    res.status(200).json(diaryRows);
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};

//페이지네이션 필요, 음악 등 첨부
export const getExplore = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    const diaryQuery = `SELECT * FROM diary WHERE privacy ='public' ORDER BY created_at DESC`;
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(diaryQuery);

    await dbConnection.commit();
    res.status(200).json(diaryRows);
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};
//페이지네이션, 음악 등 첨부
export const getMypost = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    const diaryQuery = `SELECT * FROM diary WHERE user_id = ? ORDER BY created_at DESC`;
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
      diaryQuery,
      [userId]
    );

    await dbConnection.commit();
    res.status(200).json(diaryRows);
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};

export const getMymoods = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const { userId } = req.user as JwtPayload;
    const { month } = req.query;

    await dbConnection.beginTransaction();
    const startDate = `${month}-01`;
    const endDate = `${month}-31 23:59:59`; // 28일 또는 29일이 아닌 31일로 설정해서 안전하게 다 포함
    const query = `SELECT created_at AS date, id AS diary_id, mood FROM diary WHERE user_id = ? AND created_at BETWEEN ? AND ?`;

    const [result] = await dbConnection.execute<ResultSetHeader>(query, [
      userId,
      startDate,
      endDate
    ]);

    await dbConnection.commit();
    res.status(200).json(result);
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};
