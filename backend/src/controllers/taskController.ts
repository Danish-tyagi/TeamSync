import { Request, Response } from 'express'
import Task from '../models/Task'
import Project from '../models/Project'
import { notFound, forbidden, badRequest } from '../utils/apiError'
import asyncHandler from '../utils/asyncHandler'

export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, status, assignedTo } = req.query
  const { role, id: userId } = req.user!

  const filter: any = {}

  if (role === 'member') {
    // members can only see their own tasks
    filter.assignedTo = userId
  } else {
    if (assignedTo) filter.assignedTo = assignedTo
  }

  if (projectId) filter.projectId = projectId
  if (status) filter.status = status

  const tasks = await Task.find(filter)
    .populate('assignedTo', 'name email')
    .populate('projectId', 'title')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })

  res.json({ success: true, tasks })
})

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, projectId, assignedTo, deadline } = req.body

  const project = await Project.findById(projectId)
  if (!project) throw notFound('Project not found')

  if (assignedTo) {
    const isMember = project.members.some((m) => m.toString() === assignedTo)
    if (!isMember) throw badRequest('Assigned user is not a member of this project')
  }

  const task = await Task.create({
    title,
    description,
    projectId,
    assignedTo: assignedTo || null,
    deadline: deadline || null,
    createdBy: req.user!.id,
  })

  await task.populate('assignedTo', 'name email')
  await task.populate('projectId', 'title')
  await task.populate('createdBy', 'name email')

  const io = req.app.get('io')
  if (io) io.emit('task:created', task)

  res.status(201).json({ success: true, task })
})

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email')
    .populate('projectId', 'title')
    .populate('createdBy', 'name email')

  if (!task) throw notFound('Task not found')

  if (req.user!.role === 'member') {
    if (task.assignedTo?.toString() !== req.user!.id) {
      throw forbidden('Access denied')
    }
  }

  res.json({ success: true, task })
})

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id)
  if (!task) throw notFound('Task not found')

  const { role, id: userId } = req.user!

  if (role === 'member') {
    if (task.assignedTo?.toString() !== userId) {
      throw forbidden('You can only update your own tasks')
    }
    // members can only change status
    if (!req.body.status) throw badRequest('Nothing to update')
    task.status = req.body.status
  } else {
    const { title, description, status, assignedTo, deadline, projectId } = req.body

    if (title) task.title = title
    if (description !== undefined) task.description = description
    if (status) task.status = status
    if (deadline !== undefined) task.deadline = deadline

    if (assignedTo !== undefined) {
      if (assignedTo) {
        const project = await Project.findById(task.projectId)
        if (project) {
          const isMember = project.members.some((m) => m.toString() === assignedTo)
          if (!isMember) throw badRequest('User is not a member of this project')
        }
      }
      task.assignedTo = assignedTo || null
    }

    if (projectId) task.projectId = projectId
  }

  await task.save()
  await task.populate('assignedTo', 'name email')
  await task.populate('projectId', 'title')
  await task.populate('createdBy', 'name email')

  const io = req.app.get('io')
  if (io) io.emit('task:updated', task)

  res.json({ success: true, task })
})

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const task = await Task.findById(req.params.id)
  if (!task) throw notFound('Task not found')

  await task.deleteOne()

  const io = req.app.get('io')
  if (io) io.emit('task:deleted', { id: req.params.id })

  res.json({ success: true, message: 'Task deleted' })
})
