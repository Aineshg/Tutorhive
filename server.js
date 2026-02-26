const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(httpServer, {
    cors: {
      origin: dev ? `http://${hostname}:${port}` : false,
      methods: ['GET', 'POST'],
      credentials: true
    }
  })

  // Make io available globally for API routes
  global.io = io

  // Store user sessions
  const userSockets = new Map()

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Authenticate user and join their room
    socket.on('authenticate', async (userId) => {
      if (userId) {
        socket.userId = userId
        socket.join(`user:${userId}`)
        
        // Track user's socket
        if (!userSockets.has(userId)) {
          userSockets.set(userId, new Set())
        }
        userSockets.get(userId).add(socket.id)
        
        console.log(`User ${userId} authenticated and joined room`)
      }
    })

    // Handle joining a conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`)
        console.log(`Socket ${socket.id} joined conversation ${conversationId}`)
      }
    })

    // Handle leaving a conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`)
        console.log(`Socket ${socket.id} left conversation ${conversationId}`)
      }
    })

    // Handle new message - broadcast to conversation
    socket.on('new_message', (data) => {
      // Broadcast to all users in the conversation except sender
      socket.to(`conversation:${data.conversationId}`).emit('message_received', data)
      // Also notify the sender's other devices
      socket.to(`user:${socket.userId}`).emit('message_sent', data)
      console.log(`Message sent in conversation ${data.conversationId}`)
    })

    // Handle typing indicator
    socket.on('typing', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
        userId: socket.userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping
      })
    })

    // Handle message read status
    socket.on('message_read', (data) => {
      socket.to(`conversation:${data.conversationId}`).emit('message_read_update', {
        messageId: data.messageId,
        conversationId: data.conversationId,
        readBy: socket.userId
      })
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
      
      // Clean up user socket tracking
      if (socket.userId && userSockets.has(socket.userId)) {
        userSockets.get(socket.userId).delete(socket.id)
        if (userSockets.get(socket.userId).size === 0) {
          userSockets.delete(socket.userId)
        }
      }
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})

