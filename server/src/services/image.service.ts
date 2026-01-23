import prisma from '../lib/prisma.js'
import * as gcsService from './gcs.service.js'
import { createError } from '../middleware/error-handler.js'

interface CreateImageUploadUrlInput {
  filename: string
  mimeType: string
}

interface CreateImageUploadUrlResult {
  imageId: string
  uploadUrl: string
  gcsPath: string
}

interface ConfirmImageUploadInput {
  imageId: string
}

/**
 * Helper to add signed read URLs to image objects
 * Since the GCS bucket is private, we need signed URLs for viewing images
 */
async function addSignedUrl<T extends { gcsPath: string; gcsUrl: string }>(
  image: T
): Promise<T> {
  const { downloadUrl } = await gcsService.generateDownloadUrl(image.gcsPath)
  return { ...image, gcsUrl: downloadUrl }
}

/**
 * Create a pending image record and generate upload URL
 */
export async function createImageUploadUrl(
  input: CreateImageUploadUrlInput
): Promise<CreateImageUploadUrlResult> {
  // Validate mime type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(input.mimeType)) {
    throw createError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`, 400, 'INVALID_FILE_TYPE')
  }

  // Generate unique filename
  const filename = gcsService.generateUniqueFilename(input.filename)

  // Create image record in DB (pending state - size will be updated after upload)
  const image = await prisma.image.create({
    data: {
      filename,
      originalName: input.filename,
      mimeType: input.mimeType,
      size: 0, // Will be updated after upload confirmation
      gcsPath: '', // Will be set below
      gcsUrl: '', // Will be set below
    },
  })

  // Generate signed upload URL
  const { uploadUrl, gcsPath, publicUrl } = await gcsService.generateImageUploadUrl(
    image.id,
    filename,
    input.mimeType
  )

  // Update image with GCS paths
  await prisma.image.update({
    where: { id: image.id },
    data: {
      gcsPath,
      gcsUrl: publicUrl,
    },
  })

  return {
    imageId: image.id,
    uploadUrl,
    gcsPath,
  }
}

/**
 * Confirm an image upload after the client has uploaded to GCS
 */
export async function confirmImageUpload(input: ConfirmImageUploadInput) {
  const image = await prisma.image.findUnique({
    where: { id: input.imageId },
  })

  if (!image) {
    throw createError('Image not found', 404, 'IMAGE_NOT_FOUND')
  }

  // Verify the file exists in GCS
  const exists = await gcsService.verifyFileExists(image.gcsPath)
  if (!exists) {
    throw createError('File not found in storage. Upload may have failed.', 400, 'FILE_NOT_FOUND')
  }

  // Get file metadata from GCS
  const metadata = await gcsService.getFileMetadata(image.gcsPath)

  // Update image record with actual file size
  const updatedImage = await prisma.image.update({
    where: { id: input.imageId },
    data: {
      size: metadata.size,
    },
  })

  // Return with signed URL for immediate display
  return addSignedUrl(updatedImage)
}

/**
 * Get an image by ID
 */
export async function getImageById(imageId: string) {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      viz2dFiles: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!image) {
    throw createError('Image not found', 404, 'IMAGE_NOT_FOUND')
  }

  // Return with signed URL for display
  return addSignedUrl(image)
}

/**
 * List all images with their latest job status
 */
export async function listImages(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit || 50
  const offset = options?.offset || 0

  const [images, total] = await Promise.all([
    prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        viz2dFiles: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.image.count(),
  ])

  // Generate signed URLs for all images
  const imagesWithSignedUrls = await Promise.all(
    images.map(image => addSignedUrl(image))
  )

  return {
    images: imagesWithSignedUrls,
    total,
    limit,
    offset,
  }
}

/**
 * Delete an image and its associated files
 */
export async function deleteImage(imageId: string) {
  const image = await prisma.image.findUnique({
    where: { id: imageId },
    include: {
      jobs: true,
      viz2dFiles: true,
    },
  })

  if (!image) {
    throw createError('Image not found', 404, 'IMAGE_NOT_FOUND')
  }

  // Delete associated records (cascade should handle this, but being explicit)
  await prisma.job.deleteMany({ where: { imageId } })
  await prisma.viz2dFile.deleteMany({ where: { imageId } })
  await prisma.image.delete({ where: { id: imageId } })

  // Note: GCS files are not deleted automatically
  // Consider adding GCS cleanup if needed

  return { deleted: true }
}
