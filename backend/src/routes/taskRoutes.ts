import { Router } from 'express'
import { body } from 'express-validator'
import { getTasks, createTask, getTask, updateTask, deleteTask } from '../controllers/taskController'
import { authenticate, authorize } from '../middleware/auth'
import validate from '../middleware/validate'

const router = Router()

router.use(authenticate)

router.get('/', getTasks)

router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('projectId').notEmpty().withMessage('projectId is required'),
  ],
  validate,
  createTask
)

router.get('/:id', getTask)

router.put(
  '/:id',
  [body('status').optional().isIn(['pending', 'in-progress', 'completed']).withMessage('Invalid status')],
  validate,
  updateTask
)

router.delete('/:id', authorize('admin'), deleteTask)

export default router
