// 알림 관련 service
import Notification from '../models/notificationModel.js';

// 읽지 않은 알림 목록 확인 service
export const unreadNotificationListService = async (
  userID: number
): Promise<object[]> => {
  try {
    const result = await Notification.getUnreadNotifications(userID);

    if (result.length === 0) {
      throw new Error('There is no unread notification');
    }

    const unreadNotificationList = result.map((row) => {
      if (row.category === 'diary') {
        return {
          notification_id: row.id,
          content: row.content,
          diary_id: row.diary_id,
          category: row.category,
          date: row.created_at
        };
      } else {
        return {
          notification_id: row.id,
          content: row.content,
          category: row.category,
          date: row.created_at
        };
      }
    });

    return unreadNotificationList;
  } catch (error) {
    console.error('Error in unreadNotificationListService', error);
    throw error;
  }
};

// 읽은 알림 목록 확인 service
export const readNotificationListService = async (
  userID: number
): Promise<object[]> => {
  try {
    const result = await Notification.getReadNotifications(userID);

    if (result.length === 0) {
      throw new Error('There is no read notification');
    }

    const readNotificationList = result.map((row) => {
      if (row.category === 'diary') {
        return {
          notification_id: row.id,
          content: row.content,
          diary_id: row.diary_id,
          category: row.category,
          date: row.created_at
        };
      } else {
        return {
          notification_id: row.id,
          content: row.content,
          category: row.category,
          date: row.created_at
        };
      }
    });

    return readNotificationList;
  } catch (error) {
    console.error('Error in readNotificationListService', error);
    throw error;
  }
};

// 알림 읽음 상태로 변경 service
export const updateNotificationStatusService = async (
  userID: number,
  notificationID: number
): Promise<void> => {
  try {
    const result = await Notification.updateNotificationStatus(
      userID,
      notificationID
    );

    if (result === 0) {
      throw new Error('Not found such notification');
    }
  } catch (error) {
    console.error('Error in updateNotificationStatusService', error);
    throw error;
  }
};
