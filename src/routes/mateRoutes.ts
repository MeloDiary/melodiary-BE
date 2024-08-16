// mate 관련 router
import express from 'express';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';
import {
  acceptMateRequestController,
  deleteMateController,
  mateListController,
  receivedMateRequestController,
  rejectMateRequestController,
  sendMateRequestController,
  sentMateRequestController
} from '../controllers/mateController.js';

const mateRouter = express.Router({ mergeParams: true });

// GET api/users/{userID}/mates, 친구 목록 확인 routing
mateRouter.get('/', verifyTokenMiddleware, mateListController);

// POST api/users/{userID}/mates, 친구 요청 보내기 routing
mateRouter.post('/', verifyTokenMiddleware, sendMateRequestController);

// DELETE api/users/{userID}/mates/{mateID}, 친구 삭제 routing
mateRouter.delete('/:mateID', verifyTokenMiddleware, deleteMateController);

// GET api/users/{userID}/mates/requests/received, 받은 친구 요청 목록 확인 routing
mateRouter.get(
  '/requests/received',
  verifyTokenMiddleware,
  receivedMateRequestController
);

// GET api/users/{userID}/mates/requests/sent, 보낸 친구 요청 목록 확인 routing
mateRouter.get(
  '/requests/sent',
  verifyTokenMiddleware,
  sentMateRequestController
);

// PUT api/users/{userID}/mates/requests/{requestID}, 친구 요청 수락 routing
mateRouter.put(
  '/requests/:requestID',
  verifyTokenMiddleware,
  acceptMateRequestController
);

// DELETE api/users/{userID}/mates/requests/{requestID}, 친구 요청 거절 routing
mateRouter.delete(
  '/requests/:requestID',
  verifyTokenMiddleware,
  rejectMateRequestController
);

export default mateRouter;
