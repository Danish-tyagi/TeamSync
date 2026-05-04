import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'

export const useSocket = (token: string | null) => {
  const socketRef = useRef<Socket | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    })

    const socket = socketRef.current

    socket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    socket.on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    })

    socket.on('project:created', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    })

    socket.on('project:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    })

    socket.on('project:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    })

    socket.on('project:memberAdded', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    })

    socket.on('project:memberRemoved', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    })

    return () => {
      socket.disconnect()
    }
  }, [token, queryClient])
}
