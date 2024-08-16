// import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
//import dbPool from '../config/dbConfig.js';
//import { JwtPayload } from 'jsonwebtoken';
import Joi from 'joi';
import axios from 'axios';
import { IOpenWeatherResponse } from '../types/weather';

export const getTodayWeather = async (req: Request, res: Response) => {
  try {
    const weatherSchema = Joi.object({
      latitude: Joi.string().required(),
      longitude: Joi.string().required()
    });
    const { latitude, longitude } = req.query;
    const { error } = weatherSchema.validate({ latitude, longitude });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { data: weatherData }: IOpenWeatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHERMAP_APIKEY}&units=metric`
    );
    res.status(200).json({
      location: weatherData.name,
      icon: weatherData.weather[0].main,
      avg_temperature: weatherData.main.temp
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  }
};
