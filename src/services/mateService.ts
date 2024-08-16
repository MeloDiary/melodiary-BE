// mate 관련 service
import Mate from '../models/mateModel.js';
import { generateGetPresignedUrl } from '../utils/s3Utils.js';

// 친구 목록 확인 service
export const mateListService = async (userID: number): Promise<object[]> => {
  try {
    const result = await Mate.getMateList(userID);

    if (result.length === 0) {
      throw new Error('Not found any mate');
    }

    const mateList = await Promise.all(
      result.map(async (row) => ({
        user_id: row.id,
        nickname: row.nickname,
        profile_img_url: row.profile_img_url
          ? await generateGetPresignedUrl(row.profile_img_url)
          : null
      }))
    );

    return mateList;
  } catch (error) {
    console.error('Error in mateListService', error.message);
    throw error;
  }
};

// 친구 요청 보내기 service
export const sendMateRequestService = async (
  userID: number,
  mateID: number
): Promise<number> => {
  try {
    const checkResult = await Mate.isMateExists(userID, mateID);

    if (checkResult) {
      throw new Error('Already sent the mate request');
    }

    return await Mate.createMate(userID, mateID);
  } catch (error) {
    console.error('Error in sendMateRequestService', error.message);
    throw error;
  }
};

// 친구 삭제 service
export const deleteMateService = async (
  userID: number,
  mateID: number
): Promise<void> => {
  try {
    const result = await Mate.deleteMate(userID, mateID);

    if (result === 0) {
      throw new Error('Not found such user');
    }
  } catch (error) {
    console.error('Error in deleteMateService', error.message);
    throw error;
  }
};

// 받은 친구 요청 목록 확인 service
export const receivedMateRequestService = async (
  userID: number
): Promise<object[]> => {
  try {
    const result = await Mate.getReceivedMateRequest(userID);

    if (result.length === 0) {
      throw new Error('Not found any received request');
    }

    const receivedMateRequests = await Promise.all(
      result.map(async (row) => ({
        user_id: row.user_id,
        nickname: row.nickname,
        profile_img_url: row.profile_img_url
          ? await generateGetPresignedUrl(row.profile_img_url)
          : null,
        request_id: row.request_id
      }))
    );

    return receivedMateRequests;
  } catch (error) {
    console.error('Error in receivedMateRequestService', error.message);
    throw error;
  }
};

// 보낸 친구 요청 목록 확인 service
export const sentMateRequestService = async (
  userID: number
): Promise<object[]> => {
  try {
    const result = await Mate.getSentMateRequest(userID);

    if (result.length === 0) {
      throw new Error('Not found any sent request');
    }

    const sentMateRequests = await Promise.all(
      result.map(async (row) => ({
        user_id: row.user_id,
        nickname: row.nickname,
        profile_img_url: row.profile_img_url
          ? await generateGetPresignedUrl(row.profile_img_url)
          : null,
        request_id: row.request_id
      }))
    );

    return sentMateRequests;
  } catch (error) {
    console.error('Error in sentMateRequestService', error.message);
    throw error;
  }
};

// 친구 요청 수락 service
export const acceptMateRequestService = async (
  userID: number,
  requestID: number
): Promise<void> => {
  try {
    const result = await Mate.acceptMate(userID, requestID);

    if (result === 0) {
      throw new Error('Not found such request');
    }
  } catch (error) {
    console.error('Error in acceptMateRequestService', error.message);
    throw error;
  }
};

// 친구 요청 거절 service
export const rejectMateRequestService = async (
  userID: number,
  requestID: number
): Promise<void> => {
  try {
    const result = await Mate.rejectMate(userID, requestID);

    if (result === 0) {
      throw new Error('Not found such request');
    }
  } catch (error) {
    console.error('Error in rejectMateRequestService', error.message);
    throw error;
  }
};
