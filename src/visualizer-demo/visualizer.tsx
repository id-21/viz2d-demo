// TextureDemo.tsx
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
  MouseEvent,
} from "react";
import { TextureRenderer } from "@viz2d/core";
import textureAssetsData from "@/lib/textureAssets.json";
import { Search, Settings } from "lucide-react";
import { useVirtualizer } from '@tanstack/react-virtual';

// ----------------------
// Types
// ----------------------
type SegmentWithMask = {
  segment_id: number;
  mask: Uint32Array;
  class_name: string;
};

type TextureAsset = {
  id: number;
  name: string;
  filename: string;
  localPath: string;
  cloudUrl: string | null;
  placeholder: string; // base64 200x200 preview
  scale?: number; // Optional default scale, defaults to 0.52
  manufacturer_sku?: string;
  sku?: string;
  brand?: string;
  collection?: string;
};

type TextureInfo = {
  id: number;
  name: number;
  rotation: number;
  scale: number;
  offset_x: number;
  offset_y: number;
};

// Convert imported JSON data to typed array
const textureAssets: TextureAsset[] = textureAssetsData as TextureAsset[];

// Class filter: Only these classes will be interactable
// Set to empty array [] to allow all classes
const ALLOWED_CLASSES: string[] = ["wall"];

// ----------------------
// UI Components
// ----------------------
const TextureSlider = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) => (
  <div>
    <div className="flex justify-between text-xs text-zinc-400">
      <span>{label}</span>
      <span>{value.toFixed(2)}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-indigo-500"
    />
  </div>
);

const TextureCard = ({
  tex,
  onRemove,
  onUpdate,
}: {
  tex: TextureInfo;
  onRemove: (id: number) => void;
  onUpdate: (id: number, field: keyof TextureInfo, value: number) => void;
}) => (
  <div className="rounded-lg border border-zinc-700 p-3 space-y-1">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">Texture #{tex.id}</span>
      <button
        onClick={() => onRemove(tex.id)}
        className="text-xs rounded-md bg-red-600/80 px-2 py-1 hover:bg-red-600"
      >
        Remove
      </button>
    </div>

    <TextureSlider
      label="Rotation"
      value={tex.rotation}
      min={-180}
      max={180}
      step={1}
      onChange={(v) => onUpdate(tex.id, "rotation", v)}
    />
    <TextureSlider
      label="Scale"
      value={tex.scale}
      min={0.2}
      max={5}
      step={0.05}
      onChange={(v) => onUpdate(tex.id, "scale", v)}
    />
    <TextureSlider
      label="Offset X"
      value={tex.offset_x}
      min={-2}
      max={2}
      step={0.05}
      onChange={(v) => onUpdate(tex.id, "offset_x", v)}
    />
    <TextureSlider
      label="Offset Y"
      value={tex.offset_y}
      min={-2}
      max={2}
      step={0.05}
      onChange={(v) => onUpdate(tex.id, "offset_y", v)}
    />
  </div>
);

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

// Check if a segment's class is allowed for interaction
function isClassAllowed(className: string): boolean {
  if (ALLOWED_CLASSES.length === 0) return true; // No filter = all allowed
  return ALLOWED_CLASSES.includes(className);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showSliders, setShowSliders] = useState(false);
  const [textures, setTextures] = useState<TextureInfo[]>([]);

  // Filtered textures with search
  const filteredTextures = useMemo(() => {
    if (!searchQuery.trim()) return textureAssets;

    const query = searchQuery.toLowerCase().trim();
    return textureAssets.filter(texture =>
      texture.name.toLowerCase().includes(query) ||
      texture.filename.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Virtual scrolling setup - virtualize ROWS (2 items per row)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(filteredTextures.length / 2);
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180, // Height per row (includes gap)
    overscan: 5, // Render 5 extra rows above/below viewport
  });

  const refreshTextures = useCallback(() => {
    const list = renderer.get_textures();
    setTextures(
      list.map((t: any) => ({
        id: t.id,
        name: t.name,
        rotation: t.rotation,
        scale: t.scale,
        offset_x: t.offset_x,
        offset_y: t.offset_y,
      }))
    );
    setImageVersion((v) => v + 1);
  }, [renderer]);

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

      const segs = renderer.get_segments() as any[];
      console.log("Loaded segments:", segs);
      setSegments(segs);

      const out = renderer.get_output();
      console.log("Output: ", out);
      const map = new Int32Array(out.width * out.height).fill(-1);
      for (const s of segs) for (const idx of s.mask) map[idx] = s.segment_id;

      setSegMap(map);
      setImageSize({ width: out.width, height: out.height });
      setBundleLoaded(true);
      refreshTextures();
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

    if (idx < 0) {
      setHoverSeg(null);
      return;
    }

    const segId = segMap[idx];
    if (segId < 0) {
      setHoverSeg(null);
      return;
    }

    // Check if segment's class is allowed
    const seg = segments.find(s => s.segment_id === segId);
    if (seg && isClassAllowed(seg.class_name)) {
      setHoverSeg(segId);
    } else {
      setHoverSeg(null);
    }
  };

  const applyTexture = async (segmentId: number) => {
    if (selectedTexture == null) return;

    const seg = segments.find((s) => s.segment_id === segmentId);
    if (!seg) return;

    const texture = textureAssets.find((t) => t.id === selectedTexture);
    if (!texture) return;

    setIsTextureLoading(true);
    try {
      // Use localPath in dev, cloudUrl in production
      const textureUrl = import.meta.env.DEV
        ? texture.localPath
        : texture.cloudUrl || texture.localPath;

      const response = await fetch(textureUrl);
      if (!response.ok) {
        throw new Error(`Failed to load texture: ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const textureId = await renderer.apply_texture(
        seg.mask,
        new Uint8Array(arrayBuffer),
        {
          name: 1,
          rotation: 0,
          scale: texture.scale ?? 0.52,
          offset_x: 0,
          offset_y: 0,
        }
      );

      setSegmentTextureMap((prev) => ({ ...prev, [segmentId]: textureId }));
      refreshTextures();
    } catch (error) {
      console.error('Error applying texture:', error);
      // Show error in UI (texture will remain in loading state briefly then clear)
    } finally {
      setIsTextureLoading(false);
    }
  };

  const removeTexture = async (textureId: number) => {
    setIsTextureLoading(true);
    try {
      await renderer.remove_texture(textureId);

      // Find and remove the segment mapping for this texture
      setSegmentTextureMap((prev) => {
        const newMap = { ...prev };
        for (const [segId, texId] of Object.entries(prev)) {
          if (texId === textureId) {
            delete newMap[Number(segId)];
          }
        }
        return newMap;
      });
      refreshTextures();
    } finally {
      setIsTextureLoading(false);
    }
  };

  const updateTextureField = async (
    id: number,
    field: keyof TextureInfo,
    value: number
  ) => {
    setIsTextureLoading(true);
    try {
      await renderer.update_texture(id, { [field]: value } as any);
      refreshTextures();
    } finally {
      setIsTextureLoading(false);
    }
  };

  const handleClick = () => {
    if (hoverSeg == null || isBundleLoading || isTextureLoading) return;
    if (selectedTexture == null) return;

    // Double-check class is allowed (hoverSeg should already be filtered, but be safe)
    const seg = segments.find(s => s.segment_id === hoverSeg);
    if (!seg || !isClassAllowed(seg.class_name)) return;

    const textureId = segmentTextureMap[hoverSeg];
    if (textureId != null) {
      removeTexture(textureId);
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
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search textures..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-md border border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Textures</h3>
        <button
          onClick={() => setShowSliders(!showSliders)}
          className={`p-1.5 rounded-md transition-colors ${
            showSliders
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }`}
          title="Toggle texture controls"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

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

      {/* Virtual scrolling container with 2-column grid */}
      <div
        ref={parentRef}
        className="h-[calc(100vh-250px)] overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            // Each virtual item is a ROW containing up to 2 textures
            const leftIndex = virtualRow.index * 2;
            const rightIndex = leftIndex + 1;
            const leftTexture = filteredTextures[leftIndex];
            const rightTexture = filteredTextures[rightIndex]; // May be undefined for odd counts

            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="flex gap-3"
              >
                {/* Left texture */}
                <button
                  onClick={() => setSelectedTexture(leftTexture.id)}
                  className={`
                    flex-1 rounded-lg overflow-hidden border-2 transition-all
                    ${selectedTexture === leftTexture.id
                      ? 'border-indigo-500 shadow-lg shadow-indigo-500/50'
                      : 'border-zinc-700 hover:border-zinc-600'}
                  `}
                  disabled={!bundleLoaded}
                >
                  <img
                    src={leftTexture.placeholder}
                    alt={leftTexture.name}
                    className="w-full aspect-square object-cover"
                  />
                  <div className={`
                    text-xs p-1.5 text-center
                    ${selectedTexture === leftTexture.id
                      ? 'bg-indigo-500/20 text-indigo-200'
                      : 'bg-zinc-800 text-zinc-400'}
                  `}>
                    {leftTexture.name}
                  </div>
                </button>

                {/* Right texture (only if exists) */}
                {rightTexture && (
                  <button
                    onClick={() => setSelectedTexture(rightTexture.id)}
                    className={`
                      flex-1 rounded-lg overflow-hidden border-2 transition-all
                      ${selectedTexture === rightTexture.id
                        ? 'border-indigo-500 shadow-lg shadow-indigo-500/50'
                        : 'border-zinc-700 hover:border-zinc-600'}
                    `}
                    disabled={!bundleLoaded}
                  >
                    <img
                      src={rightTexture.placeholder}
                      alt={rightTexture.name}
                      className="w-full aspect-square object-cover"
                    />
                    <div className={`
                      text-xs p-1.5 text-center
                      ${selectedTexture === rightTexture.id
                        ? 'bg-indigo-500/20 text-indigo-200'
                        : 'bg-zinc-800 text-zinc-400'}
                    `}>
                      {rightTexture.name}
                    </div>
                  </button>
                )}

                {/* Empty placeholder for odd counts to maintain layout */}
                {!rightTexture && <div className="flex-1" />}
              </div>
            );
          })}
        </div>
        {filteredTextures.length === 0 && searchQuery && (
          <p className="text-xs text-zinc-500 text-center py-8">No textures found</p>
        )}
      </div>

      {showSliders && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold border-t border-zinc-800 pt-3">
            Applied Textures
          </h4>
          {textures.length === 0 ? (
            <p className="text-xs text-zinc-500">No textures applied yet</p>
          ) : (
            textures.map(tex => (
              <TextureCard
                key={tex.id}
                tex={tex}
                onRemove={removeTexture}
                onUpdate={updateTextureField}
              />
            ))
          )}
        </div>
      )}
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
