import express from 'express';
import {
  postDiary,
  deleteDiary,
  putDiary,
  getDiary,
  getLike,
  postLike,
  deleteLike
} from '../controllers/diariesController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.post('/', verifyTokenMiddleware, postDiary);
router.put('/:diaryId', verifyTokenMiddleware, putDiary);
router.delete('/:diaryId', verifyTokenMiddleware, deleteDiary);
router.get('/:diaryId', verifyTokenMiddleware, getDiary);

router.get('/:diaryId/like', verifyTokenMiddleware, getLike);
router.post('/:diaryId/like', verifyTokenMiddleware, postLike);
router.delete('/:diaryId/like', verifyTokenMiddleware, deleteLike);

const diariesRouter = router;
export default diariesRouter;
