import 'dotenv/config'
import app from './app.js'
import { startJobPoller } from './workers/job-poller.js'

const PORT = process.env.PORT || 3001

async function main() {
  // Start the background job poller
  startJobPoller()

  // Start the HTTP server
  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`)
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`[Server] CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`)
  })
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err)
  process.exit(1)
})
