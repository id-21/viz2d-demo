import { useState, useCallback, useEffect, useRef } from 'react'
import {
  createJob,
  getJob,
  subscribeToJobUpdates,
  type Job,
} from '@/lib/api/jobs-api'

interface UseJobReturn {
  job: Job | null
  loading: boolean
  error: string | null
  startJob: (imageId: string) => Promise<Job>
  refreshJob: () => Promise<void>
  reset: () => void
}

export function useJob(initialJobId?: string): UseJobReturn {
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Cleanup SSE subscription on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])

  // Load initial job if ID provided
  useEffect(() => {
    if (initialJobId) {
      setLoading(true)
      getJob(initialJobId)
        .then((j) => {
          setJob(j)
          // Subscribe to updates if job is pending/processing
          if (j.status === 'PENDING' || j.status === 'PROCESSING') {
            subscribeToUpdates(j.id)
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false))
    }
  }, [initialJobId])

  const subscribeToUpdates = useCallback((jobId: string) => {
    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    unsubscribeRef.current = subscribeToJobUpdates(
      jobId,
      (updatedJob) => {
        setJob(updatedJob)
      },
      (err) => {
        setError(err.message)
      }
    )
  }, [])

  const startJob = useCallback(async (imageId: string): Promise<Job> => {
    setLoading(true)
    setError(null)

    try {
      const newJob = await createJob(imageId)
      setJob(newJob)

      // Subscribe to updates
      subscribeToUpdates(newJob.id)

      return newJob
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start job'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [subscribeToUpdates])

  const refreshJob = useCallback(async () => {
    if (!job) return

    setLoading(true)
    try {
      const updatedJob = await getJob(job.id)
      setJob(updatedJob)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh job'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [job])

  const reset = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
      unsubscribeRef.current = null
    }
    setJob(null)
    setLoading(false)
    setError(null)
  }, [])

  return {
    job,
    loading,
    error,
    startJob,
    refreshJob,
    reset,
  }
}
