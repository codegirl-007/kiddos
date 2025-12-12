import { useRef, useState, useCallback, useEffect } from 'react';

export function DrawingPadApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (isEraser) {
      // Eraser mode: use destination-out to erase
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)'; // Color doesn't matter for erasing
    } else {
      // Drawing mode: normal composite operation
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.stroke();
  }, [isDrawing, color, brushSize, isEraser]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Restore white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const saveDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `drawing-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }, []);

  // Set canvas size
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newWidth = rect.width;
    const newHeight = rect.height;
    
    // Check if dimensions actually changed
    if (canvas.width === newWidth && canvas.height === newHeight) {
      return; // No resize needed
    }
    
    // Save current canvas content before resizing (resizing clears the canvas)
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let savedImageData: ImageData | null = null;
    if (canvas.width > 0 && canvas.height > 0) {
      savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    // Resize canvas (this clears it)
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Restore white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Restore saved content if we had any
    if (savedImageData) {
      // Draw the saved content back (it might be smaller, so center it or scale it)
      ctx.putImageData(savedImageData, 0, 0);
    }
  }, []);

  // Set canvas size on mount and resize
  const canvasRefCallback = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;
    if (canvas) {
      setupCanvas();
    }
  }, [setupCanvas]);

  useEffect(() => {
    const handleResize = () => {
      setupCanvas();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const colors = [
    '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#FFFFFF'
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Color:</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded border-2 ${
                    color === c ? 'border-primary border-4' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Brush Size:</label>
            <input
              type="range"
              min="1"
              max="50"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-32"
            />
            <span className="text-sm w-8">{brushSize}px</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Tool:</label>
            <button
              onClick={() => setIsEraser(false)}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                !isEraser
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              🖌️ Draw
            </button>
            <button
              onClick={() => setIsEraser(!isEraser)}
              className={`px-3 py-1 rounded-md text-sm font-semibold transition-all ${
                isEraser
                  ? 'bg-gray-600 text-white hover:bg-gray-700'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              ✏️ Eraser
            </button>
          </div>

          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-destructive text-white rounded-md font-semibold text-sm hover:bg-destructive/90"
          >
            Clear
          </button>

          <button
            onClick={saveDrawing}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold text-sm hover:bg-primary/90"
          >
            Save
          </button>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRefCallback}
            className={`w-full h-[600px] touch-none ${
              isEraser ? 'cursor-grab' : 'cursor-crosshair'
            }`}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            onPointerCancel={stopDrawing}
          />
        </div>
      </div>
    </div>
  );
}
