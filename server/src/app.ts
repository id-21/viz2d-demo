import express from 'express'
import cors from 'cors'
import { errorHandler, notFoundHandler } from './middleware/error-handler.js'
import imagesRouter from './api/images/router.js'
import jobsRouter from './api/jobs/router.js'
import viz2dRouter from './api/viz2d/router.js'

const app = express()

// Middleware
app.use(express.json())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api/v1/images', imagesRouter)
app.use('/api/v1/jobs', jobsRouter)
app.use('/api/v1/viz2d', viz2dRouter)

// Error handling
app.use(notFoundHandler)
app.use(errorHandler)

export default app
