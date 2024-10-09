//일기 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import {IPostWeather} from '../types/diary.js';
import { Connection } from 'mysql2/promise';

class WeatherModel {
    static post = async (diaryId:number,{location,icon,avg_temperature}:IPostWeather,dbConnection:Connection): Promise<ResultSetHeader | null> => {
        try {
          const query = `
      INSERT INTO weather (diary_id, location, icon, avg_temperature) 
      VALUES (?, ?, ?, ?)
        `;
         const [result] = await dbConnection.execute<ResultSetHeader>(query, [
            diaryId,
            location,
            icon,
            avg_temperature
          ]);
    
          return result;
    
        } catch (error) {
            throw new Error('')
        } finally {
          return null;
        }
      };
}

export default WeatherModel;