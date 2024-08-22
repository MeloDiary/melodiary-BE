//일기 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Connection } from 'mysql2/promise';

import dbPool from '../config/dbConfig.js'
import { IPostDiary } from '../types/diary.js';


class Diary {
    static post = async ({
        title,
        content,
        img_urls,
        mood,
        emoji,
        privacy,
        background_color,
        music,
        weather
      }: IPostDiary, userId: number, dbConnection:Connection ) : Promise<ResultSetHeader> =>{
        try{
        const query = `INSERT INTO diary (title, content, user_id, mood, emoji, privacy, background_color) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await dbConnection.execute<ResultSetHeader>(query, [
                        title,
                        content,
                        userId,
                        mood,
                        emoji,
                        privacy,
                        background_color
                      ]);
        return result
        }
        catch(error){
            throw new Error('')
        }
    }
}

export default Diary;