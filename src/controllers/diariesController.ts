import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import { IPostDiary } from '../types/diary';
import { JwtPayload } from 'jsonwebtoken';
import Joi from 'joi';
import {checkAccessAuth,checkTodayPost,convertDiaryInfo}from '../services/diaryService.js'

export const postDiaryController = async (req: Request, res: Response) => {

  try {
    // const {
    //   title,
    //   content,
    //   img_urls,
    //   mood,
    //   emoji,
    //   privacy,
    //   background_color,
    //   music,
    //   weather
    // }: IPostDiary = req.body;

    const diarySchema = Joi.object({
      title: Joi.string().required(),
      content: Joi.string().required(),
      img_urls: Joi.array().items(Joi.string()).optional(),
      mood: Joi.string().optional(),
      emoji: Joi.string().optional(),
      privacy: Joi.string().valid('public', 'private', 'mate').optional(),
      background_color: Joi.string().optional(),
      music: Joi.object({
        title: Joi.string().required(),
        artist: Joi.string().required(),
        music_url: Joi.string().uri().optional()
      }).optional(), // Example schema for the music object
      weather: Joi.object({
        icon: Joi.string().required(),
        avg_temperature: Joi.number().required(),
        location: Joi.string().required()
      }).optional() // Example schema for the weather object
    });

    const { error } = diarySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { userId } = req.user as JwtPayload;
    const has_posts = await checkTodayPost(userId);
    if (has_posts) {
      return res.status(409).json({ message: 'Already posted diary today' });
    }


    res.status(201).json({ diary_id: diaryId });
  } catch (error) {
    await dbConnection.rollback();
    console.error(error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const putDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diarySchema = Joi.object({
      title: Joi.string().required(),
      content: Joi.string().required(),
      img_urls: Joi.array().items(Joi.string().uri()).optional(),
      mood: Joi.string().optional(),
      emoji: Joi.string().optional(),
      privacy: Joi.string().valid('public', 'private', 'mate').optional(),
      background_color: Joi.string().optional(),
      music: Joi.object({
        title: Joi.string().required(),
        artist: Joi.string().required(),
        music_url: Joi.string().uri().optional()
      }).optional(), // Example schema for the music object
      weather: Joi.object({
        icon: Joi.string().required(),
        avg_temperature: Joi.number().required(),
        location: Joi.string().required()
      }).optional() // Example schema for the weather object
    });

    const { error } = diarySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const diaryId = parseInt(req.params.diaryId, 10);
    const {
      title,
      content,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather,
      img_urls
    }: IPostDiary = req.body;
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();
    // 수정하려는 일기의 유저 ID와 현재 유저 ID를 비교한 후, 다르면 403(권한없음) 에러를 리턴합니다.
    const checkQuery = `SELECT * FROM diary WHERE id = ?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Not Found that diary' });
    }
    if (checkRows[0].user_id != userId) {
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

    if (img_urls && img_urls.length > 0) {
      const imgCheckQuery = `SELECT * FROM image WHERE diary_id = ?`;
      const [imgCheckRows] = await dbConnection.execute<RowDataPacket[]>(
        imgCheckQuery,
        [diaryId]
      );

      const imgQuery = `INSERT INTO image 
      (diary_id, image_url,image_order) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE image_url = VALUES(image_url);
      `;
      for (let i = 0; i < img_urls.length; i++) {
        await dbConnection.execute(imgQuery, [diaryId, img_urls[i], i]);
      }

      if (imgCheckRows.length > img_urls.length) {
        const deleteQuery = `
            DELETE FROM image 
            WHERE diary_id = ? AND image_order > ?;
        `;
        await dbConnection.execute(deleteQuery, [diaryId, img_urls.length - 1]);
      }
    }

    await dbConnection.commit();
    res.status(200).json({ message: 'Successfully changed the diary' });
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
    const diarySchema = Joi.object({
      diaryId: Joi.number().required()
    });
    const diaryId = parseInt(req.params.diaryId, 10);

    const { error } = diarySchema.validate({ diaryId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { userId } = req.user as JwtPayload;
    await dbConnection.beginTransaction();

    // 수정하려는 일기의 유저 ID와 현재 유저 ID를 비교한 후, 다르면 403(권한없음) 에러를 리턴합니다.
    const checkQuery = `SELECT * FROM diary WHERE id = ?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );
    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Not Found that diary' });
    }
    if (checkRows[0].user_id != userId) {
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
    res.status(200).json({ message: 'Successfully deleted the diary' });
  } catch (error) {
    await dbConnection.rollback();
    console.error('삭제 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getDiary = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diarySchema = Joi.object({
      diaryId: Joi.number().required()
    });
    const diaryId = parseInt(req.params.diaryId, 10);

    const { error } = diarySchema.validate({ diaryId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { userId } = req.user as JwtPayload;

    const query = `
      SELECT 
        d.*,
        m.music_url, m.title as music_title, m.artist as music_artist,
        w.location, w.icon as weather_icon, w.avg_temperature,
        GROUP_CONCAT(i.image_url) as img_urls,
        l.user_id IS NOT NULL as liked,
        u.nickname, u.profile_img_url
      FROM 
        diary d
      LEFT JOIN 
        music m ON d.id = m.diary_id
      LEFT JOIN 
        weather w ON d.id = w.diary_id
      LEFT JOIN 
        image i ON d.id = i.diary_id
      LEFT JOIN 
        likes l ON d.id = l.diary_id AND l.user_id = ?
      LEFT JOIN
        user u on d.user_id = u.id
      WHERE 
        d.id = ?;
    `;

    const [rows] = await dbConnection.execute<RowDataPacket[]>(query, [
      userId,
      diaryId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Not Found that diary' });
    }
    const row = rows[0];

    // 해당 일기에 접근 권한 여부 확인
    const checkAuth = await checkAccessAuth(userId, row.user_id, row.privacy);
    if (!checkAuth) {
      return res
        .status(403)
        .json({ message: 'No permission to access the diary' });
    }

    const diaryInfo = await convertDiaryInfo(row);

    res.status(200).json(diaryInfo);
  } catch (error) {
    console.error('조회 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};
export const getLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diarySchema = Joi.object({
      diaryId: Joi.number().required()
    });
    const diaryId = parseInt(req.params.diaryId, 10);

    const { error } = diarySchema.validate({ diaryId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { userId } = req.user as JwtPayload;

    // 해당 일기에 접근 권한 여부 확인
    const checkQuery = `SELECT user_id, privacy FROM diary WHERE id=?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );

    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Not Found that diary' });
    }

    const checkRow = checkRows[0];
    const checkAuth = await checkAccessAuth(
      userId,
      checkRow.user_id,
      checkRow.privacy
    );
    if (!checkAuth) {
      return res.status(403).json({ message: '접근권한없음' });
    }

    const query = `
      SELECT 
        u.id AS user_id, 
        u.nickname, 
        u.profile_img_url 
      FROM 
        likes l
      INNER JOIN 
        user u ON l.user_id = u.id
      WHERE 
        l.diary_id = ?;
    `;

    const [userRows] = await dbConnection.execute<RowDataPacket[]>(query, [
      diaryId
    ]);

    res.status(200).json(userRows);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const postLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diarySchema = Joi.object({
      diaryId: Joi.number().required()
    });
    const diaryId = parseInt(req.params.diaryId, 10);

    const { error } = diarySchema.validate({ diaryId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    // 해당 일기에 접근 권한 여부 확인
    const checkQuery = `SELECT user_id, privacy FROM diary WHERE id=?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );
    if (checkRows.length === 0) {
      return res.status(404).json({ message: 'Not Found that diary' });
    }

    const checkRow = checkRows[0];
    const checkAuth = await checkAccessAuth(
      userId,
      checkRow.user_id,
      checkRow.privacy
    );
    if (!checkAuth) {
      return res.status(403).json({ message: '접근권한없음' });
    }

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
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};
export const deleteLike = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diarySchema = Joi.object({
      diaryId: Joi.number().required()
    });
    const diaryId = parseInt(req.params.diaryId, 10);

    const { error } = diarySchema.validate({ diaryId });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    // 일반적으로 권한이 있어야만 postLike 할 수 있고
    // JWT로 본인 id 확인할 수 있으므로 권한체크 생략

    // diary 테이블에 데이터 삽입
    const query = `DELETE FROM likes WHERE user_id =? AND diary_id= ?`;
    const queryResult = await dbConnection.execute<ResultSetHeader>(query, [
      userId,
      diaryId
    ]);
    if (queryResult[0].affectedRows == 0) {
      res.status(404).json({ message: 'Not Found that diary' });
      throw new Error();
    }
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
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getCalendar = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const { userId } = req.user as JwtPayload;
    const diarySchema = Joi.object({
      userId: Joi.number().required(),
      month: Joi.string()
        .pattern(/^\d{4}-\d{2}$/)
        .required()
    });

    await dbConnection.beginTransaction();

    const { error } = diarySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { userId: mateId, month } = req.query;
    let userQuery = `SELECT id, nickname, profile_img_url FROM user WHERE id=?`;
    const [userRows] = await dbConnection.execute<RowDataPacket[]>(userQuery, [
      mateId
    ]);
    if (userRows.length == 0) {
      return res.status(404).json({ message: 'Not found that user' });
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31 23:59:59`; // 28일 또는 29일이 아닌 31일로 설정해서 안전하게 다 포함

    let range = '';
    if (userId == mateId) {
    } else {
      const checkQuery = `SELECT * FROM mate 
      WHERE status = 'accepted' 
      AND ((requested_user_id = ? AND received_user_id = ?) OR (requested_user_id = ? AND received_user_id = ?))`;
      const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
        checkQuery,
        [userId, mateId, mateId, userId]
      );
      if (checkRows.length > 0) {
        range = `privacy IN ('public','mate') AND `;
      } else {
        range = `privacy = 'public' AND `;
      }
    }

    let calendarQuery = `SELECT created_at AS date, id AS diary_id, emoji 
    FROM diary 
    WHERE ${range}user_id = ? AND created_at BETWEEN ? AND ?`;

    const [calendarResult] = await dbConnection.execute<ResultSetHeader>(
      calendarQuery,
      [mateId, startDate, endDate]
    );

    res.status(200).json({
      user_profile: userRows[0],
      calendar: calendarResult
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getMatefeeds = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const { userId } = req.user as JwtPayload;
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).default(5)
    });
    let {
      error,
      value: { page, limit }
    } = schema.validate(req.query);
    if (error) {
      page = page || 1;
      limit = limit || 5;
    }
    const mateQuery = `SELECT requested_user_id AS mate_id 
    FROM mate 
    WHERE status = 'accepted' 
    AND received_user_id = ?

    UNION

    SELECT received_user_id AS mate_id 
    FROM mate 
    WHERE status = 'accepted' 
    AND requested_user_id = ?
    `;

    const [mateRows] = await dbConnection.execute<RowDataPacket[]>(mateQuery, [
      userId,
      userId
    ]);

    let diaryRows: any[] = [];
    if (mateRows.length > 0) {
      const mateIds = mateRows.map((row) => row.mate_id).join(',');

      const diaryQuery = `
        SELECT 
          d.*, 
          m.music_url, m.title as music_title, m.artist as music_artist, 
          w.location, w.icon as weather_icon, w.avg_temperature,
          GROUP_CONCAT(i.image_url) as img_urls,
          l.user_id IS NOT NULL as liked,
          u.nickname, u.profile_img_url

        FROM 
          diary d
        LEFT JOIN 
          music m ON d.id = m.diary_id
        LEFT JOIN 
          image i ON d.id = i.diary_id
        LEFT JOIN 
          weather w ON d.id = w.diary_id
        LEFT JOIN 
          likes l ON d.id = l.diary_id AND l.user_id = ?
        LEFT JOIN
          user u on d.user_id = u.id          
        WHERE 
          d.user_id IN (?) AND d.privacy IN ('mate','public')
        GROUP BY 
          d.id          
        ORDER BY 
          d.created_at DESC
        LIMIT ${limit} OFFSET ${limit * (page - 1)};
        `;
      [diaryRows] = await dbConnection.execute<RowDataPacket[]>(diaryQuery, [
        userId,
        mateIds
      ]);
    }
    const diaryInfos = await Promise.all(
      diaryRows.map((row) => {
        return convertDiaryInfo(row);
      })
    );

    res.status(200).json(diaryInfos);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getExplore = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const { userId } = req.user as JwtPayload;
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).default(5)
    });
    let {
      error,
      value: { page, limit }
    } = schema.validate(req.query);
    if (error) {
      page = page || 1;
      limit = limit || 5;
    }

    const diaryQuery = `
      SELECT 
        d.*, 
        m.music_url, m.title as music_title, m.artist as music_artist, 
        w.location, w.icon as weather_icon, w.avg_temperature,
        GROUP_CONCAT(i.image_url) as img_urls,
        l.user_id IS NOT NULL as liked,
        u.nickname, u.profile_img_url
      FROM 
        diary d
      LEFT JOIN 
        music m ON d.id = m.diary_id
      LEFT JOIN 
        weather w ON d.id = w.diary_id
      LEFT JOIN 
          image i ON d.id = i.diary_id
      LEFT JOIN 
        likes l ON d.id = l.diary_id AND l.user_id = ?        
      LEFT JOIN
        user u on d.user_id = u.id
      WHERE 
        d.privacy = 'public'
      GROUP BY 
        d.id
      ORDER BY 
        d.created_at DESC
      LIMIT ${limit} OFFSET ${limit * (page - 1)};
;
    `;
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
      diaryQuery,
      [userId]
    );
    const result = await Promise.all(
      diaryRows.map((row) => {
        return convertDiaryInfo(row);
      })
    );

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getMypost = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const { userId } = req.user as JwtPayload;
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).default(5)
    });
    let {
      error,
      value: { page, limit }
    } = schema.validate(req.query);
    if (error) {
      page = page || 1;
      limit = limit || 5;
    }

    let userQuery = `SELECT id, nickname, profile_img_url FROM user WHERE id=?`;
    const [userRows] = await dbConnection.execute<RowDataPacket[]>(userQuery, [
      userId
    ]);
    if (userRows.length == 0) {
      return res.status(404).json({ message: 'Not found that user' });
    }

    const diaryQuery = `
        SELECT SQL_CALC_FOUND_ROWS
          d.*, 
          m.music_url, m.title as music_title, m.artist as music_artist, 
          w.location, w.icon as weather_icon, w.avg_temperature,
          GROUP_CONCAT(i.image_url) as img_urls,
          l.user_id IS NOT NULL as liked,
          u.nickname, u.profile_img_url

        FROM 
          diary d
        LEFT JOIN 
          music m ON d.id = m.diary_id
        LEFT JOIN 
          image i ON d.id = i.diary_id
        LEFT JOIN 
          weather w ON d.id = w.diary_id
        LEFT JOIN 
          likes l ON d.id = l.diary_id AND l.user_id = ?
        LEFT JOIN
          user u on d.user_id = u.id          
        WHERE 
          d.user_id = ?
        GROUP BY 
          d.id
        ORDER BY 
          d.created_at DESC
        LIMIT ${limit} OFFSET ${limit * (page - 1)};
      `;
    const [diaryRows] = await dbConnection.execute<RowDataPacket[]>(
      diaryQuery,
      [userId, userId]
    );

    const diaryInfos = await Promise.all(
      diaryRows.map((row) => {
        return convertDiaryInfo(row);
      })
    );

    res.status(200).json(diaryInfos);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getMymoods = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const { userId } = req.user as JwtPayload;
    const diarySchema = Joi.object({
      month: Joi.string()
        .pattern(/^\d{4}-\d{2}$/)
        .required()
    });

    const { error } = diarySchema.validate(req.query);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { month } = req.query;

    let userQuery = `SELECT id, nickname, profile_img_url FROM user WHERE id=?`;
    const [userRows] = await dbConnection.execute<RowDataPacket[]>(userQuery, [
      userId
    ]);
    if (userRows.length == 0) {
      return res.status(404).json({ message: 'Not found that user' });
    }

    const startDate = `${month}-01`;
    const endDate = `${month}-31 23:59:59`; // 28일 또는 29일이 아닌 31일로 설정해서 안전하게 다 포함
    const query = `SELECT created_at AS date, id AS diary_id, mood FROM diary WHERE user_id = ? AND created_at BETWEEN ? AND ?`;

    const [result] = await dbConnection.execute<ResultSetHeader>(query, [
      userId,
      startDate,
      endDate
    ]);

    const userRow = userRows[0];
    res.status(200).json({
      user_profile: {
        user_id: userRow.id,
        profile_img_url: userRow.profile_img_url,
        nickname: userRow.nickname
      },
      moods: result
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const getToday = async (req: Request, res: Response) => {
  try {
    const { userId } = req.user as JwtPayload;

    const hasPost = await checkTodayPost(userId);
    res.status(200).json({ has_posts: hasPost });
  } catch (error) {
    console.error('업데이트 오류:', error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  }
};

