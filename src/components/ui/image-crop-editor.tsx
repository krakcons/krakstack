import { useCallback, useEffect, useRef, useState } from "react";
import { AsyncActionButton } from "@/components/ui/async-action-button";
import { Button } from "@/components/ui/button";
import { useKrakstackLocale } from "@/components/ui/krakstack-provider";

export type ImageCropState = {
  x: number;
  y: number;
  zoom: number;
  rotation: 0 | 90 | 180 | 270;
};
export type ImageCropEditorMessages = {
  zoom: string;
  horizontal: string;
  vertical: string;
  rotate: string;
  reset: string;
  export: string;
  loading: string;
  loadError: string;
  help: string;
  exportError: string;
};
export type ImageCropEditorProps = {
  src: string;
  label: string;
  value: ImageCropState;
  onValueChange: (value: ImageCropState) => void;
  onExport: (blob: Blob) => void | Promise<void>;
  aspectRatio?: number;
  maxOutputSize?: number;
  disabled?: boolean;
  className?: string;
  locale?: string;
  messages?: Partial<Record<string, Partial<ImageCropEditorMessages>>>;
};
const labels = {
  en: {
    zoom: "Zoom",
    horizontal: "Horizontal position",
    vertical: "Vertical position",
    rotate: "Rotate 90°",
    reset: "Reset crop",
    export: "Export image",
    loading: "Loading image…",
    loadError:
      "The image could not be loaded. Check the source and its cross-origin policy.",
    help: "Drag to position the image, or use the position and zoom sliders with the arrow keys.",
    exportError:
      "Could not export the image. Check image permissions and try again.",
  },
  fr: {
    zoom: "Zoom",
    horizontal: "Position horizontale",
    vertical: "Position verticale",
    rotate: "Pivoter de 90°",
    reset: "Réinitialiser le cadrage",
    export: "Exporter l’image",
    loading: "Chargement de l’image…",
    loadError:
      "Impossible de charger l’image. Vérifiez sa source et sa politique d’accès interorigine.",
    help: "Faites glisser l’image ou utilisez les curseurs de position et de zoom avec les touches fléchées.",
    exportError:
      "Impossible d’exporter l’image. Vérifiez les autorisations de l’image et réessayez.",
  },
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/** Coordinates are in rotated source pixels; x/y state is a percentage of available travel. */
export const getImageCropGeometry = (
  width: number,
  height: number,
  value: ImageCropState,
  aspectRatio = 1,
) => {
  const rotated = value.rotation === 90 || value.rotation === 270;
  const sourceWidth = rotated ? height : width;
  const sourceHeight = rotated ? width : height;
  const ratio = clamp(aspectRatio, 0.1, 10);
  const cropWidth =
    Math.min(sourceWidth, sourceHeight * ratio) / clamp(value.zoom, 1, 4);
  const cropHeight = cropWidth / ratio;
  return {
    x: ((sourceWidth - cropWidth) * clamp(value.x, 0, 100)) / 100,
    y: ((sourceHeight - cropHeight) * clamp(value.y, 0, 100)) / 100,
    width: cropWidth,
    height: cropHeight,
    sourceWidth,
    sourceHeight,
  };
};

// Changing source remounts loading/export state, preventing stale image exports.
export const ImageCropEditor = (props: ImageCropEditorProps) => (
  <ImageCropSession key={props.src} {...props} />
);

const ImageCropSession = ({
  src,
  label,
  value,
  onValueChange,
  onExport,
  aspectRatio = 1,
  maxOutputSize = 2048,
  disabled,
  className,
  locale: override,
  messages,
}: ImageCropEditorProps) => {
  const locale = useKrakstackLocale(override);
  const copy = {
    ...(locale.startsWith("fr") ? labels.fr : labels.en),
    ...messages?.[locale.split("-")[0] ?? locale],
    ...messages?.[locale],
  };
  const image = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState(false);
  // Cached/SSR images can finish before React attaches the load listener.
  const attachImage = useCallback((element: HTMLImageElement | null) => {
    image.current = element;
    if (!element?.complete) return;
    if (element.naturalWidth > 0) {
      setSize({ width: element.naturalWidth, height: element.naturalHeight });
    } else setFailed(true);
  }, []);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const drag = useRef<{
    pointerId: number;
    x: number;
    y: number;
    value: ImageCropState;
  } | null>(null);
  const crop = size
    ? getImageCropGeometry(size.width, size.height, value, aspectRatio)
    : undefined;
  const transform = size
    ? value.rotation === 90
      ? `translate(${size.height} 0) rotate(90)`
      : value.rotation === 180
        ? `translate(${size.width} ${size.height}) rotate(180)`
        : value.rotation === 270
          ? `translate(0 ${size.width}) rotate(270)`
          : undefined
    : undefined;
  const locked = disabled || pending;
  return (
    <div className={className}>
      <img
        key={src}
        ref={attachImage}
        src={src}
        crossOrigin="anonymous"
        alt=""
        className="hidden"
        onLoad={(event) =>
          setSize({
            width: event.currentTarget.naturalWidth,
            height: event.currentTarget.naturalHeight,
          })
        }
        onError={() => {
          setFailed(true);
          setSize(undefined);
        }}
      />
      <div className="grid min-w-0 gap-4">
        {crop && size ? (
          <svg
            role="img"
            aria-label={label}
            viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}
            className="bg-muted mx-auto w-full max-w-md touch-none overflow-hidden rounded-lg border select-none"
            style={{
              aspectRatio: crop.width / crop.height,
              cursor: locked ? "default" : "move",
            }}
            onPointerDown={(event) => {
              if (locked || !event.isPrimary || event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                pointerId: event.pointerId,
                x: event.clientX,
                y: event.clientY,
                value,
              };
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              if (locked || !start || start.pointerId !== event.pointerId)
                return;
              const scale =
                event.currentTarget.getBoundingClientRect().width / crop.width;
              const travelX = crop.sourceWidth - crop.width;
              const travelY = crop.sourceHeight - crop.height;
              onValueChange({
                ...start.value,
                x:
                  travelX > 0
                    ? clamp(
                        start.value.x -
                          ((event.clientX - start.x) / scale / travelX) * 100,
                        0,
                        100,
                      )
                    : 50,
                y:
                  travelY > 0
                    ? clamp(
                        start.value.y -
                          ((event.clientY - start.y) / scale / travelY) * 100,
                        0,
                        100,
                      )
                    : 50,
              });
            }}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onLostPointerCapture={() => {
              drag.current = null;
            }}
          >
            <image
              href={src}
              width={size.width}
              height={size.height}
              transform={transform}
            />
          </svg>
        ) : (
          <p role={failed ? "alert" : "status"}>
            {failed ? copy.loadError : copy.loading}
          </p>
        )}
        <p className="text-muted-foreground text-sm">{copy.help}</p>
        <fieldset disabled={locked || !crop} className="grid min-w-0 gap-3">
          {(["zoom", "x", "y"] as const).map((key) => (
            <label key={key} className="grid gap-1 text-sm">
              <span>
                {key === "zoom"
                  ? copy.zoom
                  : key === "x"
                    ? copy.horizontal
                    : copy.vertical}
              </span>
              <input
                type="range"
                min={key === "zoom" ? 1 : 0}
                max={key === "zoom" ? 4 : 100}
                step={key === "zoom" ? 0.01 : 1}
                value={value[key]}
                onChange={(event) =>
                  onValueChange({
                    ...value,
                    [key]: event.currentTarget.valueAsNumber,
                  })
                }
                className="accent-primary w-full"
              />
            </label>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onValueChange({
                  ...value,
                  rotation:
                    value.rotation === 0
                      ? 90
                      : value.rotation === 90
                        ? 180
                        : value.rotation === 180
                          ? 270
                          : 0,
                })
              }
            >
              {copy.rotate}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onValueChange({ x: 50, y: 50, zoom: 1, rotation: 0 })
              }
            >
              {copy.reset}
            </Button>
          </div>
        </fieldset>
        <AsyncActionButton
          locale={locale}
          disabled={disabled || !crop}
          onPendingChange={setPending}
          messages={{ [locale]: { error: copy.exportError } }}
          onAction={async () => {
            if (!crop || !image.current || !size) return;
            const canvas = document.createElement("canvas");
            const scale = Math.min(
              1,
              clamp(maxOutputSize, 1, 8192) / Math.max(crop.width, crop.height),
            );
            canvas.width = Math.max(1, Math.round(crop.width * scale));
            canvas.height = Math.max(1, Math.round(crop.height * scale));
            const context = canvas.getContext("2d");
            if (!context) throw new Error("CanvasUnavailable");
            context.scale(
              canvas.width / crop.width,
              canvas.height / crop.height,
            );
            context.translate(-crop.x, -crop.y);
            if (value.rotation === 90) {
              context.translate(size.height, 0);
              context.rotate(Math.PI / 2);
            }
            if (value.rotation === 180) {
              context.translate(size.width, size.height);
              context.rotate(Math.PI);
            }
            if (value.rotation === 270) {
              context.translate(0, size.width);
              context.rotate(-Math.PI / 2);
            }
            context.drawImage(image.current, 0, 0);
            const blob = await new Promise<Blob>((resolve, reject) =>
              canvas.toBlob(
                (result) =>
                  result
                    ? resolve(result)
                    : reject(new Error("ImageEncodingFailed")),
                "image/png",
              ),
            );
            if (mounted.current) await onExport(blob);
          }}
        >
          {copy.export}
        </AsyncActionButton>
      </div>
    </div>
  );
};
