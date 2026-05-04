import { Request, Response } from 'express'
import User from '../models/User'
import { signToken } from '../utils/jwt'
import { conflict, unauthorized } from '../utils/apiError'
import asyncHandler from '../utils/asyncHandler'

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body

  const existingUser = await User.findOne({ email })
  if (existingUser) throw conflict('Email already registered')

  // first user to sign up becomes admin
  const userCount = await User.countDocuments()
  const role = userCount === 0 ? 'admin' : 'member'

  const user = await User.create({ name, email, password, role })
  const token = signToken(user._id as any, user.role)

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body

  const user = await User.findOne({ email }).select('+password')
  if (!user) throw unauthorized('Invalid email or password')

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw unauthorized('Invalid email or password')

  const token = signToken(user._id as any, user.role)

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id)
  if (!user) throw unauthorized('User not found')

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  })
})

export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const users = await User.find({}).select('-password').sort({ name: 1 })
  res.json({ success: true, users })
})
