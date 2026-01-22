import prisma from '../lib/prisma.js'
import * as viz2dClient from '../lib/viz2d-client.js'
import * as gcsService from './gcs.service.js'
import { createError } from '../middleware/error-handler.js'
import { JobStatus } from '@prisma/client'

interface CreateJobInput {
  imageId: string
}

/**
 * Create a new Viz2D processing job
 */
export async function createJob(input: CreateJobInput) {
  // Get the image
  const image = await prisma.image.findUnique({
    where: { id: input.imageId },
  })

  if (!image) {
    throw createError('Image not found', 404, 'IMAGE_NOT_FOUND')
  }

  // Check if image is already being processed
  const existingJob = await prisma.job.findFirst({
    where: {
      imageId: input.imageId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  })

  if (existingJob) {
    throw createError('A job is already in progress for this image', 400, 'JOB_IN_PROGRESS')
  }

  // Generate a fresh signed URL for the image (Viz2D needs a public URL)
  const { downloadUrl } = await gcsService.generateDownloadUrl(image.gcsPath)

  // Get job token from Viz2D API (visualizerId kept secret)
  const token = await viz2dClient.getJobToken()

  // Create job with Viz2D API
  const viz2dJob = await viz2dClient.createViz2dJob(token, downloadUrl)

  // Create job record in our database
  const job = await prisma.job.create({
    data: {
      imageId: input.imageId,
      inputGcsUrl: downloadUrl,
      viz2dJobId: viz2dJob.id,
      viz2dToken: token,
      status: viz2dJob.status as JobStatus,
    },
    include: {
      image: true,
    },
  })

  return job
}

/**
 * Get a job by ID
 */
export async function getJobById(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      image: true,
      viz2dFile: true,
    },
  })

  if (!job) {
    throw createError('Job not found', 404, 'JOB_NOT_FOUND')
  }

  return job
}

/**
 * Get a job by Viz2D job ID
 */
export async function getJobByViz2dId(viz2dJobId: string) {
  return prisma.job.findUnique({
    where: { viz2dJobId },
    include: {
      image: true,
      viz2dFile: true,
    },
  })
}

/**
 * Update job status from Viz2D API
 */
export async function syncJobStatus(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  })

  if (!job || !job.viz2dJobId) {
    throw createError('Job not found or missing Viz2D job ID', 404, 'JOB_NOT_FOUND')
  }

  // Get status from Viz2D API
  const viz2dJob = await viz2dClient.getViz2dJobById(job.viz2dJobId)

  // Update our database
  const updatedJob = await prisma.job.update({
    where: { id: jobId },
    data: {
      status: viz2dJob.status as JobStatus,
      outputUrl: viz2dJob.outputUrl,
      failReason: viz2dJob.failReason,
      completedAt: viz2dJob.status === 'COMPLETED' || viz2dJob.status === 'FAILED' ? new Date() : null,
    },
    include: {
      image: true,
      viz2dFile: true,
    },
  })

  return updatedJob
}

/**
 * List jobs for an image
 */
export async function listJobsForImage(imageId: string) {
  return prisma.job.findMany({
    where: { imageId },
    orderBy: { createdAt: 'desc' },
    include: {
      viz2dFile: true,
    },
  })
}

/**
 * Get all pending/processing jobs for polling
 */
export async function getPendingJobs() {
  return prisma.job.findMany({
    where: {
      status: { in: ['PENDING', 'PROCESSING'] },
      viz2dJobId: { not: null },
    },
    include: {
      image: true,
    },
  })
}

/**
 * Mark job as completed with viz2d file
 */
export async function completeJobWithFile(jobId: string, viz2dFileId: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      viz2dFileId,
      completedAt: new Date(),
    },
    include: {
      image: true,
      viz2dFile: true,
    },
  })
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, reason: string) {
  return prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'FAILED',
      failReason: reason,
      completedAt: new Date(),
    },
  })
}
