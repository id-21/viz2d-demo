import { Storage } from '@google-cloud/storage'

let storageClient: Storage | null = null

export function getStorageClient(): Storage {
  if (storageClient) {
    return storageClient
  }

  const projectId = process.env.GCP_PROJECT_ID
  const keyFilename = process.env.GCP_KEY_FILE
  const credentials = process.env.GCP_CREDENTIALS

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is required')
  }

  // Support both file-based and inline credentials
  if (credentials) {
    // Inline JSON credentials (for serverless)
    storageClient = new Storage({
      projectId,
      credentials: JSON.parse(credentials),
    })
  } else if (keyFilename) {
    // File-based credentials (for local dev)
    storageClient = new Storage({
      projectId,
      keyFilename,
    })
  } else {
    throw new Error('Either GCP_KEY_FILE or GCP_CREDENTIALS environment variable is required')
  }

  return storageClient
}

export function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME environment variable is required')
  }
  return getStorageClient().bucket(bucketName)
}

// GCS path helpers
export const GCS_PATHS = {
  images: (imageId: string, filename: string) => `images/${imageId}/${filename}`,
  thumbnails: (imageId: string, filename: string) => `thumbnails/${imageId}/${filename}`,
  viz2d: (viz2dFileId: string, filename: string) => `viz2d/${viz2dFileId}/${filename}`,
}
