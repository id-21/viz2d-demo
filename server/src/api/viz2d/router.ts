import { Router } from 'express'
import * as handlers from './handlers.js'

const router = Router()

// GET /api/v1/viz2d/image/:imageId - List viz2d files for an image
router.get('/image/:imageId', handlers.listViz2dFilesForImage)

// GET /api/v1/viz2d/image/:imageId/latest - Get latest viz2d file for an image
router.get('/image/:imageId/latest', handlers.getLatestViz2dFile)

// GET /api/v1/viz2d/:id - Get viz2d file info
router.get('/:id', handlers.getViz2dFile)

// GET /api/v1/viz2d/:id/download-url - Get signed download URL
router.get('/:id/download-url', handlers.getDownloadUrl)

export default router
