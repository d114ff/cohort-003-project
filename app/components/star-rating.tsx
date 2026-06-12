import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

// ─── StarRating Display ───
// Shows average rating as stars, with numeric score and count.
// Interactive mode (onClick) allows users to click to set their rating.

interface StarRatingProps {
  average: number | null;
  count: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 14, text: "text-xs" },
  md: { icon: 16, text: "text-sm" },
  lg: { icon: 20, text: "text-base" },
};

export function StarRating({
  average,
  count,
  size = "sm",
  showCount = true,
  className,
}: StarRatingProps) {
  const { icon, text } = sizeMap[size];
  const score = average ?? 0;
  const fullStars = Math.floor(score);
  const hasHalf = score - fullStars >= 0.25 && score - fullStars < 0.75;
  const adjustedFull = score - fullStars >= 0.75 ? fullStars + 1 : fullStars;
  const emptyStars = 5 - adjustedFull - (hasHalf ? 1 : 0);

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: adjustedFull }).map((_, i) => (
          <Star
            key={`full-${i}`}
            size={icon}
            className="fill-yellow-400 text-yellow-400"
          />
        ))}
        {hasHalf && (
          <span className="relative">
            <Star size={icon} className="text-yellow-400" />
            <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star size={icon} className="fill-yellow-400 text-yellow-400" />
            </span>
          </span>
        )}
        {Array.from({ length: Math.max(0, emptyStars) }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            size={icon}
            className="text-muted-foreground/30"
          />
        ))}
      </div>
      {average !== null && (
        <span className={cn("font-medium text-muted-foreground", text)}>
          {score.toFixed(1)}
        </span>
      )}
      {showCount && (
        <span className={cn("text-muted-foreground", text)}>
          ({count})
        </span>
      )}
      {average === null && count === 0 && (
        <span className={cn("text-muted-foreground", text)}>No ratings</span>
      )}
    </div>
  );
}

// ─── Interactive Star Rating ───
// Allows users to click on stars to rate. Shows current selection on hover.

interface InteractiveStarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function InteractiveStarRating({
  value,
  onChange,
  size = "md",
  disabled = false,
  className,
}: InteractiveStarRatingProps) {
  const [hovered, setHovered] = useState<number>(0);
  const { icon } = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => !disabled && setHovered(star)}
            onMouseLeave={() => !disabled && setHovered(0)}
            className={cn(
              "rounded-sm p-0.5 transition-colors",
              disabled
                ? "cursor-default"
                : "cursor-pointer hover:scale-110 active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            )}
            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              size={icon}
              className={cn(
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30",
                "transition-colors"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
