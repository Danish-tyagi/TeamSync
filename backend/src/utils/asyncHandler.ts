import { Request, Response, NextFunction } from 'express'

// wraps async route handlers so i dont have to write try/catch everywhere
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

export default asyncHandler
