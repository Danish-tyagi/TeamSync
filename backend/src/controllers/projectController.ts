import { Request, Response } from 'express'
import Project from '../models/Project'
import Task from '../models/Task'
import User from '../models/User'
import { notFound, forbidden, badRequest } from '../utils/apiError'
import asyncHandler from '../utils/asyncHandler'

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const { role, id: userId } = req.user!

  let projects
  if (role === 'admin') {
    projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
  } else {
    projects = await Project.find({ members: userId })
      .populate('createdBy', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 })
  }

  res.json({ success: true, projects })
})

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, memberIds } = req.body

  // TODO: maybe validate memberIds more thoroughly
  const project = await Project.create({
    title,
    description,
    members: memberIds || [],
    createdBy: req.user!.id,
  })

  await project.populate('createdBy', 'name email')
  await project.populate('members', 'name email role')

  const io = req.app.get('io')
  if (io) io.emit('project:created', project)

  res.status(201).json({ success: true, project })
})

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email role')

  if (!project) throw notFound('Project not found')

  if (req.user!.role !== 'admin') {
    const isMember = project.members.some((m: any) => m._id.toString() === req.user!.id)
    if (!isMember) throw forbidden('You are not a member of this project')
  }

  res.json({ success: true, project })
})

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { title, description } = req.body
  const projectId = req.params.id

  const project = await Project.findByIdAndUpdate(
    projectId,
    { title, description },
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'name email')
    .populate('members', 'name email role')

  if (!project) throw notFound('Project not found')

  const io = req.app.get('io')
  if (io) io.emit('project:updated', project)

  res.json({ success: true, project })
})

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findById(req.params.id)
  if (!project) throw notFound('Project not found')

  // delete all tasks for this project too
  await Task.deleteMany({ projectId: req.params.id })
  await project.deleteOne()

  const io = req.app.get('io')
  if (io) io.emit('project:deleted', { id: req.params.id })

  res.json({ success: true, message: 'Project deleted' })
})

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body
  const projectId = req.params.id

  const user = await User.findById(userId)
  if (!user) throw notFound('User not found')

  const project = await Project.findById(projectId)
  if (!project) throw notFound('Project not found')

  const alreadyMember = project.members.some((m) => m.toString() === userId)
  if (alreadyMember) throw badRequest('User is already a member')

  project.members.push(user._id as any)
  await project.save()

  await project.populate('members', 'name email role')
  await project.populate('createdBy', 'name email')

  const io = req.app.get('io')
  if (io) io.emit('project:memberAdded', { projectId: project._id, user })

  res.json({ success: true, project })
})

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { id: projectId, userId } = req.params

  const project = await Project.findById(projectId)
  if (!project) throw notFound('Project not found')

  const memberIndex = project.members.findIndex((m) => m.toString() === userId)
  if (memberIndex === -1) throw badRequest('User is not a member')

  project.members.splice(memberIndex, 1)
  await project.save()

  await project.populate('members', 'name email role')
  await project.populate('createdBy', 'name email')

  // also unassign their tasks in this project
  await Task.updateMany({ projectId, assignedTo: userId }, { $set: { assignedTo: null } })

  const io = req.app.get('io')
  if (io) io.emit('project:memberRemoved', { projectId: project._id, userId })

  res.json({ success: true, project })
})
