import { Request, Response } from 'express'
import Task from '../models/Task'
import Project from '../models/Project'
import User from '../models/User'
import asyncHandler from '../utils/asyncHandler'

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const { role, id: userId } = req.user!
  const now = new Date()

  if (role === 'admin') {
    const totalProjects = await Project.countDocuments()
    const totalUsers = await User.countDocuments()
    const totalTasks = await Task.countDocuments()
    const pendingTasks = await Task.countDocuments({ status: 'pending' })
    const inProgressTasks = await Task.countDocuments({ status: 'in-progress' })
    const completedTasks = await Task.countDocuments({ status: 'completed' })
    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: now },
      status: { $ne: 'completed' },
    })
    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'name')
      .populate('projectId', 'title')

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        totalUsers,
        recentTasks,
      },
    })
  } else {
    const totalTasks = await Task.countDocuments({ assignedTo: userId })
    const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'pending' })
    const inProgressTasks = await Task.countDocuments({ assignedTo: userId, status: 'in-progress' })
    const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'completed' })
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      deadline: { $lt: now },
      status: { $ne: 'completed' },
    })
    const totalProjects = await Project.countDocuments({ members: userId })
    const recentTasks = await Task.find({ assignedTo: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('projectId', 'title')

    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        pendingTasks,
        inProgressTasks,
        completedTasks,
        overdueTasks,
        recentTasks,
      },
    })
  }
})
