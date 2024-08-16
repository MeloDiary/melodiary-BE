import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import {
  readNotificationListService,
  unreadNotificationListService,
  updateNotificationStatusService
} from '../services/notificationService.js';

// 읽지 않은 알림 확인 controller
export const unreadNotificationListController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    const result = await unreadNotificationListService(parsedUserID);

    // 읽지 않은 알림 목록을 가져오는데 성공한 경우 200 코드와 읽지 않은 알림 목록 리턴함
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in unreadNotificationListController');
    // 친구가 없는 경우 404 코드 리턴함
    if (error.message === 'There is no unread notification') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 읽은 알림 확인 controller
export const readNotificationListController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    const result = await readNotificationListService(parsedUserID);

    // 읽은 알림 목록을 가져오는데 성공한 경우 200 코드와 읽은 알림 목록 리턴함
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in readNotificationListController');
    // 친구가 없는 경우 404 코드 리턴함
    if (error.message === 'There is no read notification') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 알림 읽음 상태로 변경 controller
export const updateNotificationStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID, notificationID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);
    const parsedNotificationID = parseInt(notificationID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID) || isNaN(parsedNotificationID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    await updateNotificationStatusService(parsedUserID, parsedNotificationID);

    // 읽은 알림 목록을 가져오는데 성공한 경우 200 코드와 읽은 알림 목록 리턴함
    return res
      .status(200)
      .json({ message: 'Successfully changed status of the notification' });
  } catch (error) {
    console.error('Error in updateNotificationStatusController');
    // 알림ID에 해당하는 알림이 존재하지 않는 경우 404 코드 리턴함
    if (error.message === 'Not found such notification') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};
