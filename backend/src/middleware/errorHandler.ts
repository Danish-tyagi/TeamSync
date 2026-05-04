import { Request, Response, NextFunction } from 'express'
import { ApiError } from '../utils/apiError'
import mongoose from 'mongoose'

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  let statusCode = 500
  let message = 'Something went wrong'

  if (err instanceof ApiError) {
    statusCode = err.statusCode
    message = err.message
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400
    message = Object.values(err.errors).map((e: any) => e.message).join(', ')
  } else if (err.code === 11000) {
    // duplicate key error
    statusCode = 409
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `${field} already exists`
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400
    message = `Invalid id`
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401
    message = 'Invalid or expired token'
  }

  // TODO: add proper logging here (winston or something)
  if (statusCode === 500) {
    console.error(err)
  }

  res.status(statusCode).json({
    success: false,
    message,
  })
}

export default errorHandler
