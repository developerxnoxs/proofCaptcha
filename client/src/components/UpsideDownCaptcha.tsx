import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

interface Animal {
  id: string;
  x: number;
  y: number;
  animalType: string;
  path: string;
  orientation?: 'upright' | 'upside_down';
  rotation?: number;
}

interface UpsideDownChallengeData {
  backgroundIndex?: number;
  backgroundUrl: string;
  animals: Animal[];
  canvasWidth: number;
  canvasHeight: number;
  tolerance: number;
}

interface UpsideDownCaptchaProps {
  challengeData: UpsideDownChallengeData;
  onSolve: (solution: { clicks: Array<{ x: number; y: number }> }) => void;
  disabled?: boolean;
}

export default function UpsideDownCaptcha({ challengeData, onSolve, disabled }: UpsideDownCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [clicks, setClicks] = useState<Array<{ x: number; y: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const loadImages = async () => {
      setIsLoading(true);
      const promises: Promise<void>[] = [];

      const bgImage = new Image();
      bgImage.crossOrigin = 'anonymous';
      promises.push(
        new Promise((resolve, reject) => {
          bgImage.onload = () => {
            imageCache.current.set('background', bgImage);
            resolve();
          };
          bgImage.onerror = reject;
          bgImage.src = challengeData.backgroundUrl;
        })
      );

      challengeData.animals.forEach(animal => {
        if (!imageCache.current.has(animal.path)) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          promises.push(
            new Promise((resolve, reject) => {
              img.onload = () => {
                imageCache.current.set(animal.path, img);
                resolve();
              };
              img.onerror = (error) => {
                console.error(`Failed to load image: ${animal.path}`, error);
                reject(error);
              };
              img.src = animal.path;
            })
          );
        }
      });

      try {
        await Promise.all(promises);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadImages();
  }, [challengeData]);

  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bgImage = imageCache.current.get('background');
    if (bgImage) {
      ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    }

    challengeData.animals.forEach(animal => {
      const img = imageCache.current.get(animal.path);
      if (!img) return;

      const size = 80;
      
      const rotation = animal.rotation !== undefined 
        ? animal.rotation 
        : animal.orientation === 'upside_down' 
          ? 180 
          : 0;

      ctx.save();
      ctx.translate(animal.x, animal.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    });

    clicks.forEach((click, index) => {
      ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(click.x, click.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), click.x, click.y);
    });
  }, [challengeData, clicks, imagesLoaded]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);

    setClicks(prev => [...prev, { x, y }]);
  };

  const handleReset = () => {
    setClicks([]);
  };

  const handleSubmit = () => {
    onSolve({ clicks });
  };

  return (
    <Card className="max-w-2xl">
      <CardContent className="p-3 sm:p-6 space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-base sm:text-lg font-semibold" data-testid="text-title">
            Click on the upside-down image
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground" data-testid="text-description">
            Click on all animals that are upside-down. You can click multiple times if needed.
          </p>
        </div>

        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-md z-10">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 sm:h-6 sm:w-6 animate-spin rounded-full border-2 sm:border-3 border-primary border-t-transparent" />
                <span className="text-xs sm:text-sm font-medium">Loading challenge...</span>
              </div>
            </div>
          )}
          <canvas
            ref={canvasRef}
            width={challengeData.canvasWidth}
            height={challengeData.canvasHeight}
            onClick={handleCanvasClick}
            className="w-full border rounded-md cursor-crosshair bg-muted"
            style={{ maxWidth: `${challengeData.canvasWidth}px`, aspectRatio: `${challengeData.canvasWidth}/${challengeData.canvasHeight}` }}
            data-testid="canvas-upside-down"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs sm:text-sm text-muted-foreground" data-testid="text-clicks-count">
            Clicks: {clicks.length}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={disabled || clicks.length === 0}
              data-testid="button-reset"
              className="text-xs sm:text-sm"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden sm:inline">Reset</span>
              <span className="sm:hidden">↻</span>
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={disabled || clicks.length === 0}
              data-testid="button-submit"
              className="text-xs sm:text-sm"
            >
              Verify
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
