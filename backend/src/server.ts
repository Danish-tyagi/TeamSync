import 'dotenv/config'
import express from 'express'
import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import cors from 'cors'
import morgan from 'morgan'

import connectDB from './config/db'
import authRoutes from './routes/authRoutes'
import projectRoutes from './routes/projectRoutes'
import taskRoutes from './routes/taskRoutes'
import dashboardRoutes from './routes/dashboardRoutes'
import errorHandler from './middleware/errorHandler'

const app = express()
const httpServer = http.createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'https://teamsync-frontend-production-7c77.up.railway.app',
    methods: ['GET', 'POST'],
  },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log('socket connected:', socket.id)

  socket.on('join:project', (projectId: string) => {
    socket.join(`project:${projectId}`)
  })

  socket.on('leave:project', (projectId: string) => {
    socket.leave(`project:${projectId}`)
  })

  socket.on('disconnect', () => {
    console.log('socket disconnected:', socket.id)
  })
})

app.use(cors({
  origin: process.env.CLIENT_URL || 'https://teamsync-frontend-production-7c77.up.railway.app',
  credentials: true,
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`server started on port ${PORT}`)
  })
})

export { app, httpServer }
