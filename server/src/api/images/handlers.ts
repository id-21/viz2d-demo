import { Request, Response, NextFunction } from 'express'
import * as imageService from '../../services/image.service.js'

/**
 * POST /api/v1/images/upload-url
 * Get a signed URL for uploading an image to GCS
 */
export async function getUploadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { filename, mimeType } = req.body

    if (!filename || !mimeType) {
      res.status(400).json({ error: 'filename and mimeType are required' })
      return
    }

    const result = await imageService.createImageUploadUrl({ filename, mimeType })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * POST /api/v1/images
 * Confirm an image upload after client has uploaded to GCS
 */
export async function confirmUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.body

    if (!imageId) {
      res.status(400).json({ error: 'imageId is required' })
      return
    }

    const image = await imageService.confirmImageUpload({ imageId })
    res.json(image)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/images
 * List all images
 */
export async function listImages(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined

    const result = await imageService.listImages({ limit, offset })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/images/:id
 * Get a single image by ID
 */
export async function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const image = await imageService.getImageById(id)
    res.json(image)
  } catch (error) {
    next(error)
  }
}

/**
 * DELETE /api/v1/images/:id
 * Delete an image
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await imageService.deleteImage(id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}
