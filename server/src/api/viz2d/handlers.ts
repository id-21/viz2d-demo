import { Request, Response, NextFunction } from 'express'
import * as viz2dFileService from '../../services/viz2d-file.service.js'

/**
 * GET /api/v1/viz2d/:id
 * Get viz2d file info
 */
export async function getViz2dFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const file = await viz2dFileService.getViz2dFileById(id)
    res.json(file)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/viz2d/:id/download-url
 * Get signed download URL for viz2d file
 */
export async function getDownloadUrl(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const result = await viz2dFileService.getViz2dDownloadUrl(id)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/viz2d/image/:imageId
 * List viz2d files for an image
 */
export async function listViz2dFilesForImage(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params
    const files = await viz2dFileService.listViz2dFilesForImage(imageId)
    res.json(files)
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/v1/viz2d/image/:imageId/latest
 * Get the latest viz2d file for an image
 */
export async function getLatestViz2dFile(req: Request, res: Response, next: NextFunction) {
  try {
    const { imageId } = req.params
    const file = await viz2dFileService.getLatestViz2dFileForImage(imageId)

    if (!file) {
      res.status(404).json({ error: 'No viz2d files found for this image' })
      return
    }

    res.json(file)
  } catch (error) {
    next(error)
  }
}
