import { Router } from 'express'
import * as handlers from './handlers.js'

const router = Router()

// POST /api/v1/images/upload-url - Get signed URL for upload
router.post('/upload-url', handlers.getUploadUrl)

// POST /api/v1/images - Confirm upload
router.post('/', handlers.confirmUpload)

// GET /api/v1/images - List all images
router.get('/', handlers.listImages)

// GET /api/v1/images/:id - Get single image
router.get('/:id', handlers.getImage)

// DELETE /api/v1/images/:id - Delete image
router.delete('/:id', handlers.deleteImage)

export default router
