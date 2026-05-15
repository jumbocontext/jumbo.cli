import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text } from "ink";
import {
  getAnimationFrame,
  getFrameCount,
} from "../../cli/banner/AnimationFrames.js";
import { SemanticColors } from "../../shared/DesignTokens.js";

interface AnimatedBannerProps {
  onComplete: () => void;
  version?: string;
  projectName?: string | null;
  persist?: boolean;
  infoBoxLines?: string[];
}

const TOTAL_FRAMES = getFrameCount();
const MID_POINT = Math.floor(TOTAL_FRAMES / 2);
const FRAME_DURATION_MS = 9;
const TICK_MS = 4;
const HOLD_DELAY_MS = 1120;
const ERASE_INTERVAL_MS = 15;

type BannerPhase = "walking" | "holding" | "erasing" | "persisted" | "complete";

type RGB = [number, number, number];

const ANCHOR_COLORS: RGB[] = [
  [102, 180, 244],
  [170, 0, 212],
  [255, 42, 42],
  [255, 131, 7],
  [255, 204, 0],
  [68, 170, 0],
];

const ANCHOR_COLORS_HEX = [
  "#66b4f4",
  "#aa00d4",
  "#ff2a2a",
  "#ff8307",
  "#ffcc00",
  "#44aa00",
];

function lerpRgb(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

export function getGradientHex(progress: number): string {
  const clamped = Math.max(0, Math.min(1, progress));
  const segments = ANCHOR_COLORS.length - 1;
  const segmentLength = 1 / segments;
  const segmentIndex = Math.min(
    Math.floor(clamped / segmentLength),
    segments - 1,
  );
  const segmentProgress =
    (clamped - segmentIndex * segmentLength) / segmentLength;
  const [r, g, b] = lerpRgb(
    ANCHOR_COLORS[segmentIndex],
    ANCHOR_COLORS[segmentIndex + 1],
    segmentProgress,
  );
  return rgbToHex(r, g, b);
}

interface ColorSegment {
  text: string;
  color?: string;
  inverse?: boolean;
}

function colorizeLineToSegments(
  line: string,
  elephantHex: string,
): ColorSegment[] {
  const segments: ColorSegment[] = [];
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === "▓" || char === "▒") {
      let elephantSegment = "";
      while (
        i < line.length &&
        (line[i] === "▓" || line[i] === "▒" || line[i] === "█")
      ) {
        const nearbyContext = line.slice(
          Math.max(0, i - 3),
          Math.min(line.length, i + 4),
        );
        const hasShading =
          nearbyContext.includes("▓") || nearbyContext.includes("▒");
        if (line[i] === "█" && !hasShading) break;
        elephantSegment += line[i];
        i++;
      }
      const vibrant = elephantSegment.replace(/▓/g, "░").replace(/[▒█]/g, " ");
      segments.push({ text: vibrant, color: elephantHex, inverse: true });
    } else if (char === "█" || char === "░") {
      let textSegment = "";
      while (i < line.length && (line[i] === "█" || line[i] === "░")) {
        textSegment += line[i];
        i++;
      }
      segments.push({ text: textSegment, color: "#c8c8c8" });
    } else if ("╭╮╰╯│─".includes(char)) {
      let boxSegment = "";
      while (i < line.length && "╭╮╰╯│─".includes(line[i])) {
        boxSegment += line[i];
        i++;
      }
      segments.push({ text: boxSegment, color: SemanticColors.keyBadge });
    } else if (
      char === "A" &&
      line.slice(i).startsWith("AI memory like an elephant")
    ) {
      const tagline = "AI memory like an elephant";
      segments.push({ text: tagline, color: "#808080" });
      i += tagline.length;
    } else {
      let plainSegment = "";
      while (
        i < line.length &&
        line[i] !== "▓" &&
        line[i] !== "▒" &&
        line[i] !== "█" &&
        line[i] !== "░" &&
        !"╭╮╰╯│─".includes(line[i]) &&
        !(line[i] === "A" && line.slice(i).startsWith("AI memory like an elephant"))
      ) {
        plainSegment += line[i];
        i++;
      }
      if (plainSegment.length > 0) {
        segments.push({ text: plainSegment });
      }
    }
  }

  return segments;
}

export function AnimatedBanner({
  onComplete,
  version = "",
  projectName = null,
  persist = false,
  infoBoxLines,
}: AnimatedBannerProps): React.ReactElement | null {
  const [frame, setFrame] = useState(0);
  const [phase, setPhase] = useState<BannerPhase>("walking");
  const [visibleLines, setVisibleLines] = useState<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (phase !== "walking") return;
    const timer = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const targetFrame = Math.min(
        Math.floor(elapsed / FRAME_DURATION_MS),
        TOTAL_FRAMES - 1,
      );
      setFrame((prev) => {
        if (targetFrame >= TOTAL_FRAMES - 1) {
          setPhase("holding");
          return TOTAL_FRAMES - 1;
        }
        return targetFrame > prev ? targetFrame : prev;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "holding") return;
    const timer = setTimeout(() => {
      setPhase(persist ? "persisted" : "erasing");
    }, HOLD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, persist]);

  useEffect(() => {
    if (phase !== "persisted") return;
    handleComplete();
  }, [phase, handleComplete]);

  useEffect(() => {
    if (phase !== "erasing") return;
    const finalFrame = getAnimationFrame(
      TOTAL_FRAMES - 1,
      version,
      projectName,
      infoBoxLines,
    );
    const totalLines = finalFrame.length;
    setVisibleLines(totalLines);

    const timer = setInterval(() => {
      setVisibleLines((prev) => {
        if (prev === null) return totalLines;
        if (prev <= 0) {
          setPhase("complete");
          return 0;
        }
        return prev - 1;
      });
    }, ERASE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [phase, version, projectName, infoBoxLines]);

  useEffect(() => {
    if (phase === "complete") handleComplete();
  }, [phase, handleComplete]);

  if (phase === "complete") return null;

  let colorProgress: number;
  if (frame <= MID_POINT) {
    colorProgress = frame / MID_POINT;
  } else {
    colorProgress = 1 - (frame - MID_POINT) / (TOTAL_FRAMES - MID_POINT - 1);
  }
  const elephantHex = getGradientHex(colorProgress);

  const currentFrame = phase === "walking"
    ? getAnimationFrame(frame, version, projectName, infoBoxLines)
    : getAnimationFrame(TOTAL_FRAMES - 1, version, projectName, infoBoxLines);

  const linesToRender =
    visibleLines !== null ? currentFrame.slice(0, visibleLines) : currentFrame;

  return (
    <Box flexDirection="column">
      {linesToRender.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {colorizeLineToSegments(line, elephantHex).map((segment, segIndex) =>
            segment.color ? (
              <Text
                key={segIndex}
                color={segment.color}
                inverse={segment.inverse}
              >
                {segment.text}
              </Text>
            ) : (
              <Text key={segIndex}>{segment.text}</Text>
            ),
          )}
        </Text>
      ))}
    </Box>
  );
}
