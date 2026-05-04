import jwt from 'jsonwebtoken'
import { Types } from 'mongoose'
import { UserRole } from '../models/User'

export interface JwtPayload {
  id: string
  role: UserRole
}

export const signToken = (userId: Types.ObjectId, role: UserRole): string => {
  const secret = process.env.JWT_SECRET!
  const expiry = process.env.JWT_EXPIRES_IN || '7d'
  return jwt.sign({ id: userId.toString(), role }, secret, { expiresIn: expiry } as jwt.SignOptions)
}

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
}
