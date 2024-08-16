// 알림 관련 router
import express from 'express';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';
import {
  readNotificationListController,
  unreadNotificationListController,
  updateNotificationStatusController
} from '../controllers/notificationController.js';

const notificationRouter = express.Router({ mergeParams: true });

// GET api/users/{userID}/notifications/unread, 읽지 않은 알림 확인 routing
notificationRouter.get(
  '/unread',
  verifyTokenMiddleware,
  unreadNotificationListController
);

// GET api/users/{userID}/notifications/read, 읽은 알림 기록 확인 routing
notificationRouter.get(
  '/read',
  verifyTokenMiddleware,
  readNotificationListController
);

// PUT api/users/{userID}/notifications/{notificationID}, 알림 읽음 상태로 변경 routing
notificationRouter.put(
  '/:notificationID',
  verifyTokenMiddleware,
  updateNotificationStatusController
);

export default notificationRouter;
