import { useState, useEffect } from "react";
import { TextureRenderer } from "@viz2d/core";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FILE_OLD = "/assets/samples/2.viz2d";
const FILE_NEW = "/assets/samples/2_new_demo.viz2d";

type SegmentData = {
  segment_id: number;
  class_name: string;
  mask: Uint32Array;
};

type FileData = {
  segments: SegmentData[];
  imageSize: { width: number; height: number };
  fileSize: number;
};

type Analysis = {
  classCounts: Record<string, number>;
  classSegments: Record<string, { id: number; maskSize: number }[]>;
  totalMaskPixels: number;
};

export default function ComparePage() {
  const [status, setStatus] = useState("Loading viz2d files...");
  const [error, setError] = useState<string | null>(null);
  const [oldData, setOldData] = useState<FileData | null>(null);
  const [newData, setNewData] = useState<FileData | null>(null);

  useEffect(() => {
    async function loadViz2dFile(url: string): Promise<FileData> {
      console.log(`Fetching ${url}...`);
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      console.log(`Loaded ${url}: ${bytes.length} bytes`);

      const renderer = new TextureRenderer();
      console.log(`Created renderer, loading bytes...`);
      renderer.load(bytes);
      console.log(`Loaded bytes, getting segments...`);

      const segments = renderer.get_segments() as SegmentData[];
      const out = renderer.get_output() as { width: number; height: number; pixels: Uint8Array };
      const imageSize = { width: out.width, height: out.height };
      console.log(`Got ${segments.length} segments`);

      return { segments, imageSize, fileSize: bytes.length };
    }

    async function main() {
      try {
        setStatus("Loading 2.viz2d (old file)...");
        const old = await loadViz2dFile(FILE_OLD);
        setOldData(old);
        console.log("Old file data:", old);

        setStatus("Loading 2_new_demo.viz2d (new file)...");
        const newFile = await loadViz2dFile(FILE_NEW);
        setNewData(newFile);
        console.log("New file data:", newFile);

        setStatus("Comparison complete!");
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : String(err));
      }
    }

    main();
  }, []);

  function analyzeSegments(segments: SegmentData[]): Analysis {
    const classCounts: Record<string, number> = {};
    const classSegments: Record<string, { id: number; maskSize: number }[]> = {};
    let totalMaskPixels = 0;

    segments.forEach((seg) => {
      const className = seg.class_name || "unknown";
      classCounts[className] = (classCounts[className] || 0) + 1;

      if (!classSegments[className]) {
        classSegments[className] = [];
      }
      classSegments[className].push({
        id: seg.segment_id,
        maskSize: seg.mask?.length || 0,
      });

      totalMaskPixels += seg.mask?.length || 0;
    });

    return { classCounts, classSegments, totalMaskPixels };
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-8">
        <h1 className="text-2xl text-red-400 mb-4">Error</h1>
        <pre className="bg-red-900/30 p-4 rounded">{error}</pre>
      </div>
    );
  }

  if (!oldData || !newData) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-8">
        <h1 className="text-2xl text-cyan-400 mb-4">Viz2D File Comparison</h1>
        <div className="bg-zinc-800 p-4 rounded animate-pulse">{status}</div>
      </div>
    );
  }

  const oldAnalysis = analyzeSegments(oldData.segments);
  const newAnalysis = analyzeSegments(newData.segments);
  const allClasses = new Set([
    ...Object.keys(oldAnalysis.classCounts),
    ...Object.keys(newAnalysis.classCounts),
  ]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Visualizer
      </Link>

      <h1 className="text-3xl text-cyan-400 mb-2">Viz2D File Comparison</h1>
      <p className="text-zinc-400 mb-8">
        Comparing: <code className="text-zinc-300">2.viz2d</code> vs{" "}
        <code className="text-zinc-300">2_new_demo.viz2d</code>
      </p>

      <div className="bg-green-900/30 border border-green-700 p-4 rounded mb-8">
        {status}
      </div>

      {/* Summary Table */}
      <h2 className="text-xl text-purple-400 mb-4">Summary</h2>
      <div className="bg-zinc-800 rounded-lg p-6 mb-8">
        <table className="w-full">
          <thead>
            <tr className="text-left text-purple-400">
              <th className="pb-3">Metric</th>
              <th className="pb-3">2.viz2d (Old)</th>
              <th className="pb-3">2_new_demo.viz2d (New)</th>
              <th className="pb-3">Change</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            <tr className="border-t border-zinc-700">
              <td className="py-2">File Size</td>
              <td>{(oldData.fileSize / 1024 / 1024).toFixed(2)} MB</td>
              <td>{(newData.fileSize / 1024 / 1024).toFixed(2)} MB</td>
              <td className={newData.fileSize < oldData.fileSize ? "text-green-400" : "text-yellow-400"}>
                {((newData.fileSize - oldData.fileSize) / 1024).toFixed(1)} KB
              </td>
            </tr>
            <tr className="border-t border-zinc-700">
              <td className="py-2">Image Size</td>
              <td>{oldData.imageSize.width} x {oldData.imageSize.height}</td>
              <td>{newData.imageSize.width} x {newData.imageSize.height}</td>
              <td>{oldData.imageSize.width === newData.imageSize.width ? "Same" : "Changed"}</td>
            </tr>
            <tr className="border-t border-zinc-700 font-bold">
              <td className="py-2">Total Segments</td>
              <td>{oldData.segments.length}</td>
              <td>{newData.segments.length}</td>
              <td className={newData.segments.length > oldData.segments.length ? "text-green-400" : "text-red-400"}>
                {newData.segments.length > oldData.segments.length ? "+" : ""}
                {newData.segments.length - oldData.segments.length}
              </td>
            </tr>
            <tr className="border-t border-zinc-700">
              <td className="py-2">Unique Classes</td>
              <td>{Object.keys(oldAnalysis.classCounts).length}</td>
              <td>{Object.keys(newAnalysis.classCounts).length}</td>
              <td>{Object.keys(newAnalysis.classCounts).length - Object.keys(oldAnalysis.classCounts).length}</td>
            </tr>
            <tr className="border-t border-zinc-700">
              <td className="py-2">Total Mask Pixels</td>
              <td>{oldAnalysis.totalMaskPixels.toLocaleString()}</td>
              <td>{newAnalysis.totalMaskPixels.toLocaleString()}</td>
              <td>{(newAnalysis.totalMaskPixels - oldAnalysis.totalMaskPixels).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Segments by Class */}
      <h2 className="text-xl text-purple-400 mb-4">Segments by Class</h2>
      <div className="bg-zinc-800 rounded-lg p-6 mb-8">
        <p className="text-zinc-400 mb-4">
          This shows how many <strong>instances</strong> of each semantic class exist in each file.
        </p>
        <table className="w-full">
          <thead>
            <tr className="text-left text-purple-400">
              <th className="pb-3">Class Name</th>
              <th className="pb-3">Old File (Count)</th>
              <th className="pb-3">New File (Count)</th>
              <th className="pb-3">Difference</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {Array.from(allClasses)
              .sort()
              .map((className) => {
                const oldCount = oldAnalysis.classCounts[className] || 0;
                const newCount = newAnalysis.classCounts[className] || 0;
                const diff = newCount - oldCount;
                return (
                  <tr key={className} className="border-t border-zinc-700">
                    <td className="py-2">{className}</td>
                    <td>{oldCount}</td>
                    <td>{newCount}</td>
                    <td className={diff > 0 ? "text-green-400" : diff < 0 ? "text-red-400" : ""}>
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Interpretation */}
      <h2 className="text-xl text-purple-400 mb-4">Interpretation</h2>
      <div className="bg-zinc-800 rounded-lg p-6 mb-8">
        {newData.segments.length > oldData.segments.length ? (
          <>
            <p className="text-green-400 font-bold mb-2">
              The new file has MORE segments ({newData.segments.length} vs {oldData.segments.length}).
            </p>
            <p className="text-zinc-300">
              This indicates the new file uses <strong>instance segmentation</strong> where objects
              of the same class (like multiple walls) are split into separate selectable segments,
              rather than being grouped together.
            </p>
          </>
        ) : (
          <p className="text-zinc-300">
            Both files have similar segment counts.
          </p>
        )}

        <h4 className="text-purple-400 mt-6 mb-2">Classes with more instances in new file:</h4>
        <ul className="list-disc list-inside text-green-400">
          {Array.from(allClasses)
            .filter((c) => (newAnalysis.classCounts[c] || 0) > (oldAnalysis.classCounts[c] || 0))
            .map((c) => (
              <li key={c}>
                {c}: {oldAnalysis.classCounts[c] || 0} → {newAnalysis.classCounts[c] || 0}
              </li>
            ))}
        </ul>
      </div>

      {/* Detailed Segment Data */}
      <h2 className="text-xl text-purple-400 mb-4">Detailed Segment Data</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-cyan-400 mb-4">2.viz2d (Old) - {oldData.segments.length} segments</h3>
          <pre className="bg-zinc-900 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(
              oldData.segments.map((s) => ({
                id: s.segment_id,
                class: s.class_name,
                maskPixels: s.mask?.length || 0,
              })),
              null,
              2
            )}
          </pre>
        </div>
        <div className="bg-zinc-800 rounded-lg p-6">
          <h3 className="text-cyan-400 mb-4">2_new_demo.viz2d (New) - {newData.segments.length} segments</h3>
          <pre className="bg-zinc-900 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(
              newData.segments.map((s) => ({
                id: s.segment_id,
                class: s.class_name,
                maskPixels: s.mask?.length || 0,
              })),
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </div>
  );
}
