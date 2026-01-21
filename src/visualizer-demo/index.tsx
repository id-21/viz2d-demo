'use client'
import { useState } from "react"
import { Link } from "react-router-dom"
import Visualizer from "./visualizer"
import { Button } from "@/components/ui/button"
import viz2dSamples from "@/lib/viz2dSamples"
import { Loader2, Upload, FlaskConical } from "lucide-react"

export default function VisualizerDemo() {
  const [fileState, setFileState] = useState<{ loading: boolean, file?: File }>({
    loading: false
  })

  async function loadFromUrl(url: string) {
    setFileState({ loading: true })
    const response = await fetch(url)
    const blob = await response.blob()

    const file = new File([blob], "visualizer.viz2d", {
      type: blob.type || "application/octet-stream",
      lastModified: Date.now(),
    })

    setFileState({ loading: false, file })
  }

  return (
    <>
      <Link
        to="/api-test"
        className="fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md transition-colors"
      >
        <FlaskConical className="w-4 h-4" />
        API Test
      </Link>
      {fileState.loading && <div className="fixed top-0 left-0 w-screen h-screen bg-black text-white text-2xl opacity-50 flex gap-3 items-center justify-center z-50">
        <Loader2 className="animate-spin" />Loading...</div>}
      {fileState.file ? <Visualizer file={fileState.file} /> :
        <div className="flex flex-col items-center gap-5 my-20">
          <img
            src="/@fs/Users/ishan-aiworkspace/Downloads/images-olivetum-clay/olivetum-clay-repeated-patterns-coordonne.jpg"
            alt="Olivetum Clay Pattern"
            className="max-w-[300px] max-h-[300px] object-contain rounded-lg shadow-lg mb-8"
          />
          <div className="flex gap-5 flex-wrap">
            <Button asChild>
              <label htmlFor="fileinput">
                <input
                  type="file"
                  accept=".viz2d"
                  id="fileinput"
                  onChange={(e) => { setFileState({ loading: false, file: e.target.files?.[0] }); e.target.value = '' }}
                  className="hidden" />
                  <Upload/>
                Load Viz2d File
              </label>
            </Button>
          </div>
          <div>OR</div>
          <div>
            <div className="font-semibold mb-4 text-xl text-center">Select from samples</div>
            <div className="flex gap-5 flex-wrap justify-center">
              {viz2dSamples.map((sample, index) => (
                <img key={index} src={sample.image} className="w-80 aspect-video object-cover rounded cursor-pointer hover:scale-105 duration-200"
                  onClick={() => loadFromUrl(sample.viz2dFile)} />
              ))}
            </div>
          </div>
        </div>
      }
    </>
  )
}