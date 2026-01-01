// TextureDemo.tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  MouseEvent,
} from "react";
import { TextureRenderer } from "@viz2d/core";
import textureAssets from "@/lib/textureAssets";

// ----------------------
// Types
// ----------------------
type SegmentWithMask = {
  segment_id: number;
  mask: Uint32Array;
  class_name: string;
};

// ----------------------
// Helpers
// ----------------------
function getMouseIndex(
  e: MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((e.clientX - rect.left) / rect.width) * width);
  const y = Math.floor(((e.clientY - rect.top) / rect.height) * height);
  return x < 0 || y < 0 || x >= width || y >= height ? -1 : y * width + x;
}


// ----------------------
// Main Component
// ----------------------
export default function Visualizer({ file }:{file:File}){
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef(new TextureRenderer());
  const renderer = rendererRef.current;

  const [bundleLoaded, setBundleLoaded] = useState(false);
  const [isBundleLoading, setIsBundleLoading] = useState(false);
  const [isTextureLoading, setIsTextureLoading] = useState(false);

  const [segments, setSegments] = useState<SegmentWithMask[]>([]);
  const [segMap, setSegMap] = useState<Int32Array | null>(null);
  const [hoverSeg, setHoverSeg] = useState<number | null>(null);
  const [imageSize, setImageSize] =
    useState<{ width: number; height: number } | null>(null);
  const [imageVersion, setImageVersion] = useState(0);

  const [selectedTexture, setSelectedTexture] = useState<number | null>(null);
  const [segmentTextureMap, setSegmentTextureMap] = useState<Record<number, number>>({});

  const draw = useCallback(() => {
    if (!canvasRef.current) return;

    const out = renderer.get_output();
    const { width, height, pixels } = out;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const img = new ImageData(new Uint8ClampedArray(pixels), width, height);

    if (hoverSeg != null) {
      const seg = segments.find((s) => s.segment_id === hoverSeg);
      if (seg) {
        for (const i of seg.mask) {
          const idx = i * 4;
          img.data[idx] *= 0.6;
          img.data[idx + 1] = Math.min(255, img.data[idx + 1] * 0.5 + 120);
          img.data[idx + 2] *= 0.6;
        }
      }
    }

    canvasRef.current.width = width;
    canvasRef.current.height = height;
    ctx.putImageData(img, 0, 0);
  }, [renderer, hoverSeg, segments]);

  useEffect(() => {
    if (bundleLoaded) draw();
  }, [imageVersion, hoverSeg, bundleLoaded, draw]);

  const loadFile = async () => {
    setIsBundleLoading(true);
    try {
      await renderer.load(
        new Uint8Array(await file.arrayBuffer())
      );

      const segs = renderer.get_segments() as SegmentWithMask[];
      setSegments(segs);

      const out = renderer.get_output();
      const map = new Int32Array(out.width * out.height).fill(-1);
      for (const s of segs) for (const idx of s.mask) map[idx] = s.segment_id;

      setSegMap(map);
      setImageSize({ width: out.width, height: out.height });
      setBundleLoaded(true);
      setImageVersion((v) => v + 1);
    } finally {
      setIsBundleLoading(false);
    }
  };

  useEffect(() => {
    loadFile();
  }, [file]);

  const handleMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !segMap || !imageSize) return;
    const idx = getMouseIndex(
      e,
      canvasRef.current,
      imageSize.width,
      imageSize.height
    );
    setHoverSeg(idx >= 0 ? segMap[idx] : null);
  };

  const applyTexture = async (segmentId: number) => {
    if (selectedTexture == null) return;

    const seg = segments.find((s) => s.segment_id === segmentId);
    if (!seg) return;

    const texture = textureAssets.find((t) => t.id === selectedTexture);
    if (!texture) return;

    setIsTextureLoading(true);
    try {
      const response = await fetch(texture.path);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const textureId = await renderer.apply_texture(
        seg.mask,
        new Uint8Array(arrayBuffer),
        {
          name: 1,
          rotation: 0,
          scale: 1,
          offset_x: 0,
          offset_y: 0,
        }
      );

      setSegmentTextureMap((prev) => ({ ...prev, [segmentId]: textureId }));
      setImageVersion((v) => v + 1);
    } finally {
      setIsTextureLoading(false);
    }
  };

  const removeTexture = async (segmentId: number) => {
    const textureId = segmentTextureMap[segmentId];
    if (textureId == null) return;

    setIsTextureLoading(true);
    try {
      await renderer.remove_texture(textureId);
      setSegmentTextureMap((prev) => {
        const newMap = { ...prev };
        delete newMap[segmentId];
        return newMap;
      });
      setImageVersion((v) => v + 1);
    } finally {
      setIsTextureLoading(false);
    }
  };

  const handleClick = () => {
    if (hoverSeg == null || isBundleLoading || isTextureLoading) return;
    if (selectedTexture == null) return;

    const hasTexture = segmentTextureMap[hoverSeg] != null;
    if (hasTexture) {
      removeTexture(hoverSeg);
    } else {
      applyTexture(hoverSeg);
    }
  };

  // ----------------------
  // Render
  // ----------------------
  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-100">
  <div className="flex flex-col lg:flex-row h-screen w-screen gap-4 p-3">

    {/* Sidebar */}
    <aside
      className="
        w-full lg:w-72
        h-auto lg:h-full
        border border-zinc-800 rounded-xl
        bg-zinc-900
        p-4
        space-y-3
        overflow-y-auto
      "
    >
      <div className="text-xs rounded-md border border-zinc-700 px-2 py-1 bg-zinc-950">
        Hovering:{" "}
        <b className="text-zinc-200">
          {segments.find(s => s.segment_id === hoverSeg)?.class_name || "none"}
        </b>
      </div>

      <h3 className="text-sm font-semibold">Textures</h3>

      {!bundleLoaded && (
        <p className="text-xs text-zinc-500">
          Load a bundle first
        </p>
      )}

      {bundleLoaded && selectedTexture == null && (
        <p className="text-xs text-zinc-500">Select a texture below, then click a segment</p>
      )}

      {bundleLoaded && selectedTexture != null && (
        <p className="text-xs text-indigo-400">Click on a segment to apply or remove texture</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {textureAssets.map(texture => (
          <button
            key={texture.id}
            onClick={() => setSelectedTexture(texture.id)}
            className={`
              rounded-lg overflow-hidden border-2 transition-all
              ${selectedTexture === texture.id
                ? 'border-indigo-500 shadow-lg shadow-indigo-500/50'
                : 'border-zinc-700 hover:border-zinc-600'}
            `}
            disabled={!bundleLoaded}
          >
            <img
              src={texture.path}
              alt={texture.name}
              className="w-full aspect-square object-cover"
            />
            <div className={`
              text-xs p-1.5 text-center
              ${selectedTexture === texture.id
                ? 'bg-indigo-500/20 text-indigo-200'
                : 'bg-zinc-800 text-zinc-400'}
            `}>
              {texture.name}
            </div>
          </button>
        ))}
      </div>
    </aside>

    {/* Main */}
    <main className="flex-1 h-full">
      <div className="relative h-full rounded-xl border border-zinc-800 overflow-hidden bg-black">

        <canvas
          ref={canvasRef}
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverSeg(null)}
          onClick={handleClick}
          className="
            block
            max-w-full
            max-h-full
            cursor-pointer
          "
          style={{
            pointerEvents:
              isBundleLoading || isTextureLoading ? "none" : "auto",
          }}
        />

        {(isBundleLoading || isTextureLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm text-zinc-200">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
              {isBundleLoading
                ? "Loading bundle…"
                : "Applying texture…"}
            </div>
          </div>
        )}
      </div>
    </main>
  </div>
</div>

  );
};
