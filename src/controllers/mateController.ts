// 친구 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import {
  acceptMateRequestService,
  deleteMateService,
  mateListService,
  receivedMateRequestService,
  rejectMateRequestService,
  sendMateRequestService,
  sentMateRequestService
} from '../services/mateService.js';

// 친구 목록 확인 controller
export const mateListController = async (req: Request, res: Response) => {
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

    const result = await mateListService(parsedUserID);

    // 친구 목록을 가져오는데 성공한 경우 200 코드와 친구 목록 리턴함
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in mateListController');
    // 친구가 없는 경우 404 코드 리턴함
    if (error.message === 'Not found any mate') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 친구 요청 보내기 controller
export const sendMateRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID } = req.params;
    const { mate_id: mateID } = req.body;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);
    const parsedMateID = parseInt(mateID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID) || isNaN(parsedMateID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    const result = await sendMateRequestService(parsedUserID, parsedMateID);

    // 친구 요청을 보내기 성공한 경우 201 코드와 친구 요청 ID를 리턴함
    return res.status(201).json({ request_id: result });
  } catch (error) {
    console.error('Error in sendMateRequestController');
    // 친구 요청 받는 사용자가 존재하지 않는 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: error.message });
    }
    // 이미 친구 요청을 보낸 경우 409 코드 리턴함
    if (error.message === 'Already sent the mate request') {
      return res.status(409).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 친구 삭제 controller
export const deleteMateController = async (req: Request, res: Response) => {
  try {
    const { userID, mateID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);
    const parsedMateID = parseInt(mateID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID) || isNaN(parsedMateID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    await deleteMateService(parsedUserID, parsedMateID);

    // 친구 삭제 처리 성공한 경우 200 코드를 리턴함
    return res.status(200).json({ message: 'Successfully unmated' });
  } catch (error) {
    console.error('Error in deleteMateController');
    // 친구 ID에 해당하는 사용자가 존재하지 않는 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 받은 친구 요청 목록 확인 controller
export const receivedMateRequestController = async (
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

    const result = await receivedMateRequestService(parsedUserID);

    // 받은 친구 요청 목록 가져오기 성공한 경우 200 코드를 리턴함
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in receivedMateRequestController');
    // 받은 친구 요청이 없는 경우 404 코드 리턴함
    if (error.message === 'Not found any received request') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 보낸 친구 요청 목록 확인 controller
export const sentMateRequestController = async (
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

    const result = await sentMateRequestService(parsedUserID);

    // 받은 친구 요청 목록 가져오기 성공한 경우 200 코드를 리턴함
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in sentMateRequestController');
    // 받은 친구 요청이 없는 경우 404 코드 리턴함
    if (error.message === 'Not found any sent request') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 친구 요청 수락 controller
export const acceptMateRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID, requestID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);
    const parsedRequestID = parseInt(requestID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID) || isNaN(parsedRequestID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    await acceptMateRequestService(parsedUserID, parsedRequestID);

    // 친구 요청 수락 처리 성공한 경우 200 코드를 리턴함
    return res
      .status(200)
      .json({ message: 'Successfully accepted the mate request' });
  } catch (error) {
    console.error('Error in acceptMateRequestController');
    // 친구요청ID에 해당하는 요청이 존재하지 않는 경우 404 코드 리턴함
    if (error.message === 'Not found such request') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 친구 요청 거절 controller
export const rejectMateRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userID, requestID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);
    const parsedRequestID = parseInt(requestID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID) || isNaN(parsedRequestID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    await rejectMateRequestService(parsedUserID, parsedRequestID);

    // 친구 요청 거절 처리 성공한 경우 200 코드를 리턴함
    return res
      .status(200)
      .json({ message: 'Successfully rejected the mate request' });
  } catch (error) {
    console.error('Error in rejectMateRequestController');
    // 친구요청ID에 해당하는 요청이 존재하지 않는 경우 404 코드 리턴함
    if (error.message === 'Not found such request') {
      return res.status(404).json({ message: error.message });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};
