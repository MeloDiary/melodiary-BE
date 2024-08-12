import express from 'express';
import {
  postComment,
  putComment,
  deleteComment,
  getComments
} from '../controllers/commentController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.post('/', verifyTokenMiddleware, postComment);
router.put('/:commentId', verifyTokenMiddleware, putComment);
router.delete('/:commentId', verifyTokenMiddleware, deleteComment);
router.get('/', verifyTokenMiddleware, getComments);

const commentRouter = router;
export default commentRouter;
