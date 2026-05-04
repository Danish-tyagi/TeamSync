import { Request, Response, NextFunction } from 'express'
import { validationResult } from 'express-validator'
import { badRequest } from '../utils/apiError'

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const msg = errors.array().map((e) => e.msg).join(', ')
    return next(badRequest(msg))
  }
  next()
}

export default validate
