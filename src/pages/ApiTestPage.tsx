import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  getJobToken,
  createJob,
  getJobById,
  runFullWorkflow,
  downloadOutput,
  type Viz2DJob,
  type JobStatus,
} from '@/lib/api/viz2d-api'

const STATUS_COLORS: Record<JobStatus, string> = {
  PENDING: 'bg-yellow-500',
  PROCESSING: 'bg-blue-500',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
}

export function ApiTestPage() {
  const [visualizerId, setVisualizerId] = useState(
    import.meta.env.VITE_VIZ2D_VISUALIZER_ID || ''
  )
  const [inputUrl, setInputUrl] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [job, setJob] = useState<Viz2DJob | null>(null)
  const [statusLog, setStatusLog] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addLog = (message: string) => {
    setStatusLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const clearState = () => {
    setToken(null)
    setJob(null)
    setStatusLog([])
    setError(null)
  }

  const handleGetToken = async () => {
    if (!visualizerId.trim()) {
      setError('Visualizer ID is required')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      addLog(`Getting token for visualizer: ${visualizerId}`)
      const newToken = await getJobToken(visualizerId)
      setToken(newToken)
      addLog(`Token received: ${newToken.substring(0, 20)}...`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get token'
      setError(message)
      addLog(`Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = async () => {
    if (!token) {
      setError('Get a token first')
      return
    }
    if (!inputUrl.trim()) {
      setError('Input URL is required')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      addLog(`Creating job with input: ${inputUrl}`)
      const newJob = await createJob(token, inputUrl)
      setJob(newJob)
      addLog(`Job created: ${newJob.id} (status: ${newJob.status})`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create job'
      setError(message)
      addLog(`Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckStatus = async () => {
    if (!job) {
      setError('Create a job first')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      addLog(`Checking status for job: ${job.id}`)
      const updatedJob = await getJobById(job.id)
      setJob(updatedJob)
      addLog(`Job status: ${updatedJob.status}`)
      if (updatedJob.status === 'COMPLETED') {
        addLog(`Output URL: ${updatedJob.outputUrl}`)
      } else if (updatedJob.status === 'FAILED') {
        addLog(`Fail reason: ${updatedJob.failReason}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to check status'
      setError(message)
      addLog(`Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRunFullWorkflow = async () => {
    if (!visualizerId.trim()) {
      setError('Visualizer ID is required')
      return
    }
    if (!inputUrl.trim()) {
      setError('Input URL is required')
      return
    }

    clearState()
    setIsLoading(true)
    try {
      const completedJob = await runFullWorkflow(
        visualizerId,
        inputUrl,
        (status, updatedJob) => {
          addLog(status)
          if (updatedJob) {
            setJob(updatedJob)
          }
        }
      )
      setJob(completedJob)
      addLog(`Workflow complete! Output: ${completedJob.outputUrl}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Workflow failed'
      setError(message)
      addLog(`Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!job?.outputUrl) {
      setError('No output URL available')
      return
    }

    setIsLoading(true)
    try {
      addLog('Downloading output...')
      await downloadOutput(job.outputUrl, `viz2d-output-${job.id}`)
      addLog('Download started')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Download failed'
      setError(message)
      addLog(`Error: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Viz2D API Test</h1>
          <a href="/" className="text-zinc-400 hover:text-zinc-200 text-sm">
            ← Back to Visualizer
          </a>
        </div>

        {/* Configuration */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Visualizer ID</label>
              <input
                type="text"
                value={visualizerId}
                onChange={(e) => setVisualizerId(e.target.value)}
                placeholder="viz_123"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Input Image URL</label>
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-zinc-900 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGetToken}
              disabled={isLoading}
              variant="outline"
              className="bg-zinc-800"
            >
              1. Get Token
            </Button>
            <Button
              onClick={handleCreateJob}
              disabled={isLoading || !token}
              variant="outline"
              className="bg-zinc-800"
            >
              2. Create Job
            </Button>
            <Button
              onClick={handleCheckStatus}
              disabled={isLoading || !job}
              variant="outline"
              className="bg-zinc-800"
            >
              3. Check Status
            </Button>
            <div className="w-full border-t border-zinc-700 my-2" />
            <Button
              onClick={handleRunFullWorkflow}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Run Full Workflow
            </Button>
            <Button onClick={clearState} variant="ghost" className="text-zinc-400">
              Clear
            </Button>
          </div>
        </div>

        {/* Current State */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Token</h2>
            {token ? (
              <code className="text-xs text-green-400 break-all">
                {token.substring(0, 50)}...
              </code>
            ) : (
              <span className="text-zinc-500 text-sm">No token yet</span>
            )}
          </div>
          <div className="bg-zinc-900 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Job Status</h2>
            {job ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${STATUS_COLORS[job.status]}`}
                  />
                  <span className="font-medium">{job.status}</span>
                </div>
                <div className="text-xs text-zinc-400">ID: {job.id}</div>
              </div>
            ) : (
              <span className="text-zinc-500 text-sm">No job yet</span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Output Preview */}
        {job?.status === 'COMPLETED' && job.outputUrl && (
          <div className="bg-zinc-900 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Output</h2>
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded p-2">
                <img
                  src={job.outputUrl}
                  alt="Output"
                  className="max-w-full max-h-96 mx-auto rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="flex items-center gap-4">
                <code className="text-xs text-zinc-400 flex-1 truncate">
                  {job.outputUrl}
                </code>
                <Button onClick={handleDownload} disabled={isLoading}>
                  Download
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Status Log */}
        <div className="bg-zinc-900 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Log</h2>
          <div className="bg-zinc-950 rounded p-4 h-64 overflow-y-auto font-mono text-xs">
            {statusLog.length === 0 ? (
              <span className="text-zinc-500">No activity yet...</span>
            ) : (
              statusLog.map((log, i) => (
                <div key={i} className="text-zinc-300 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-lg p-6 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
