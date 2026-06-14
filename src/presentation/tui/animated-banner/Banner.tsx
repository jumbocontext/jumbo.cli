import React, { useState, useEffect, useCallback, useRef } from "react";
import { Box, Text } from "ink";
import { getAnimationFrame } from "../../cli/banner/AnimationFrames.js";
import { getAnimatedBannerColorGradientHex } from "./ColorGradient.js";
import { getAnimatedBannerLineColorSegments } from "./LineColorSegments.js";
import { AnimatedBannerTiming } from "./Timing.js";

interface AnimatedBannerProps {
  onComplete: () => void;
  version?: string;
  projectName?: string | null;
  persist?: boolean;
  infoBoxLines?: string[];
  animated?: boolean;
}

type BannerPhase = "walking" | "holding" | "erasing" | "persisted" | "complete";

export function AnimatedBanner({
  onComplete,
  version = "",
  projectName = null,
  persist = false,
  infoBoxLines,
  animated = true,
}: AnimatedBannerProps): React.ReactElement | null {
  const [frame, setFrame] = useState(
    animated ? 0 : AnimatedBannerTiming.totalFrames - 1,
  );
  const [phase, setPhase] = useState<BannerPhase>(
    animated ? "walking" : persist ? "persisted" : "complete",
  );
  const [visibleLines, setVisibleLines] = useState<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (animated) {
      return;
    }

    setFrame(AnimatedBannerTiming.totalFrames - 1);
    setPhase(persist ? "persisted" : "complete");
    setVisibleLines(null);
  }, [animated, persist]);

  useEffect(() => {
    if (!animated || phase !== "walking") return;
    const timer = setInterval(() => {
      const elapsed = performance.now() - startTimeRef.current;
      const targetFrame = Math.min(
        Math.floor(elapsed / AnimatedBannerTiming.frameDurationMs),
        AnimatedBannerTiming.totalFrames - 1,
      );
      setFrame((prev) => {
        if (targetFrame >= AnimatedBannerTiming.totalFrames - 1) {
          setPhase("holding");
          return AnimatedBannerTiming.totalFrames - 1;
        }
        return targetFrame > prev ? targetFrame : prev;
      });
    }, AnimatedBannerTiming.tickMs);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "holding") return;
    const timer = setTimeout(() => {
      setPhase(persist ? "persisted" : "erasing");
    }, AnimatedBannerTiming.holdDelayMs);
    return () => clearTimeout(timer);
  }, [phase, persist]);

  useEffect(() => {
    if (phase !== "persisted") return;
    handleComplete();
  }, [phase, handleComplete]);

  useEffect(() => {
    if (phase !== "erasing") return;
    const finalFrame = getAnimationFrame(
      AnimatedBannerTiming.totalFrames - 1,
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
    }, AnimatedBannerTiming.eraseIntervalMs);
    return () => clearInterval(timer);
  }, [phase, version, projectName, infoBoxLines]);

  useEffect(() => {
    if (phase === "complete") handleComplete();
  }, [phase, handleComplete]);

  if (phase === "complete") return null;

  let colorProgress: number;
  if (frame <= AnimatedBannerTiming.midpointFrame) {
    colorProgress = frame / AnimatedBannerTiming.midpointFrame;
  } else {
    colorProgress =
      1 -
      (frame - AnimatedBannerTiming.midpointFrame) /
        (AnimatedBannerTiming.totalFrames -
          AnimatedBannerTiming.midpointFrame -
          1);
  }
  const elephantHex = getAnimatedBannerColorGradientHex(colorProgress);

  const currentFrame = phase === "walking"
    ? getAnimationFrame(frame, version, projectName, infoBoxLines)
    : getAnimationFrame(
        AnimatedBannerTiming.totalFrames - 1,
        version,
        projectName,
        infoBoxLines,
      );

  const linesToRender =
    visibleLines !== null ? currentFrame.slice(0, visibleLines) : currentFrame;

  return (
    <Box flexDirection="column">
      {linesToRender.map((line, lineIndex) => (
        <Text key={lineIndex}>
          {getAnimatedBannerLineColorSegments(line, elephantHex).map(
            (segment, segIndex) =>
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
