import express from 'express';
import {
  postDiaryController,
  deleteDiary,
  putDiary,
  getDiary,
  getLike,
  postLike,
  deleteLike,
  getCalendar,
  getMatefeeds,
  getExplore,
  getMymoods,
  getMypost,
  getToday
} from '../controllers/diariesController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';
import commentRouter from './comments.js';

const router = express.Router();
router.use('/:diaryId/comments', commentRouter);
router.get('/:diaryId/like', verifyTokenMiddleware, getLike);
router.post('/:diaryId/like', verifyTokenMiddleware, postLike);
router.delete('/:diaryId/like', verifyTokenMiddleware, deleteLike);

router.get('/calendar', verifyTokenMiddleware, getCalendar);
router.get('/mates', verifyTokenMiddleware, getMatefeeds);
router.get('/explore', verifyTokenMiddleware, getExplore);
router.get('/myposts', verifyTokenMiddleware, getMypost);
router.get('/mymoods', verifyTokenMiddleware, getMymoods);
router.get('/today', verifyTokenMiddleware, getToday);

router.post('/', verifyTokenMiddleware, postDiaryController);
router.put('/:diaryId', verifyTokenMiddleware, putDiary);
router.delete('/:diaryId', verifyTokenMiddleware, deleteDiary);
router.get('/:diaryId', verifyTokenMiddleware, getDiary);

const diariesRouter = router;
export default diariesRouter;
