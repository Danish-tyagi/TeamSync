import { Router } from 'express'
import { body } from 'express-validator'
import { signup, login, getMe, getUsers } from '../controllers/authController'
import { authenticate, authorize } from '../middleware/auth'
import validate from '../middleware/validate'

const router = Router()

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  signup
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
)

router.get('/me', authenticate, getMe)
router.get('/users', authenticate, authorize('admin'), getUsers)

export default router
