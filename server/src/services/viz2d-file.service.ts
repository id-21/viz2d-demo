import prisma from '../lib/prisma.js'
import * as gcsService from './gcs.service.js'
import { GCS_PATHS } from '../lib/gcs.js'
import { createError } from '../middleware/error-handler.js'

interface CreateViz2dFileInput {
  imageId: string
  filename: string
  buffer: Buffer
}

/**
 * Create a viz2d file record and upload to GCS
 */
export async function createViz2dFile(input: CreateViz2dFileInput) {
  // Create record first to get ID
  const viz2dFile = await prisma.viz2dFile.create({
    data: {
      filename: input.filename,
      imageId: input.imageId,
      gcsPath: '', // Will be updated after upload
      gcsUrl: '', // Will be updated after upload
      fileSize: input.buffer.length,
    },
  })

  // Generate GCS path
  const gcsPath = GCS_PATHS.viz2d(viz2dFile.id, input.filename)

  // Upload to GCS
  const { gcsUrl } = await gcsService.uploadBuffer(gcsPath, input.buffer, 'application/octet-stream')

  // Update record with GCS info
  const updatedFile = await prisma.viz2dFile.update({
    where: { id: viz2dFile.id },
    data: {
      gcsPath,
      gcsUrl,
    },
    include: {
      image: true,
    },
  })

  return updatedFile
}

/**
 * Get a viz2d file by ID
 */
export async function getViz2dFileById(viz2dFileId: string) {
  const file = await prisma.viz2dFile.findUnique({
    where: { id: viz2dFileId },
    include: {
      image: true,
      job: true,
    },
  })

  if (!file) {
    throw createError('Viz2D file not found', 404, 'VIZ2D_FILE_NOT_FOUND')
  }

  return file
}

/**
 * Get a signed download URL for a viz2d file
 */
export async function getViz2dDownloadUrl(viz2dFileId: string) {
  const file = await getViz2dFileById(viz2dFileId)

  const { downloadUrl } = await gcsService.generateDownloadUrl(file.gcsPath)

  return {
    file,
    downloadUrl,
  }
}

/**
 * List viz2d files for an image
 */
export async function listViz2dFilesForImage(imageId: string) {
  return prisma.viz2dFile.findMany({
    where: { imageId },
    orderBy: { createdAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
      },
    },
  })
}

/**
 * Get the latest viz2d file for an image
 */
export async function getLatestViz2dFileForImage(imageId: string) {
  return prisma.viz2dFile.findFirst({
    where: { imageId },
    orderBy: { createdAt: 'desc' },
    include: {
      image: true,
      job: true,
    },
  })
}
