import { Router } from 'express'
import { body } from 'express-validator'
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController'
import { authenticate, authorize } from '../middleware/auth'
import validate from '../middleware/validate'

const router = Router()

router.use(authenticate)

router.get('/', getProjects)

router.post(
  '/',
  authorize('admin'),
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  createProject
)

router.get('/:id', getProject)

router.put(
  '/:id',
  authorize('admin'),
  [body('title').trim().notEmpty().withMessage('Title is required')],
  validate,
  updateProject
)

router.delete('/:id', authorize('admin'), deleteProject)

router.post(
  '/:id/members',
  authorize('admin'),
  [body('userId').notEmpty().withMessage('userId is required')],
  validate,
  addMember
)

router.delete('/:id/members/:userId', authorize('admin'), removeMember)

export default router
