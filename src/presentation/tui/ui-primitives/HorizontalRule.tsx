import React, { useLayoutEffect, useRef, useState } from "react";
import { Box, Text, measureElement, useStdout, type DOMElement } from "ink";
import { TuiGlyphs } from "../../shared/DesignTokens.js";

interface HorizontalRuleProps {
  readonly color: string;
  readonly width?: number;
}

export function HorizontalRule({
  color,
  width,
}: HorizontalRuleProps): React.ReactElement {
  const { stdout } = useStdout();
  const containerRef = useRef<DOMElement | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(
    undefined,
  );
  const lineWidth = resolveHorizontalRuleWidth(
    width,
    measuredWidth ?? stdout.columns,
  );

  useLayoutEffect(() => {
    if (width !== undefined || containerRef.current === null) {
      return;
    }

    const nextWidth = measureElement(containerRef.current).width;
    setMeasuredWidth((currentWidth) =>
      currentWidth === nextWidth ? currentWidth : nextWidth,
    );
  });

  return (
    <Box ref={containerRef} width="100%" height={1} overflow="hidden">
      <HorizontalRuleText color={color} width={lineWidth} />
    </Box>
  );
}

export function HorizontalRuleText({
  color,
  width,
}: Required<HorizontalRuleProps>): React.ReactElement {
  return (
    <Text color={color}>
      {TuiGlyphs.divider.repeat(width)}
    </Text>
  );
}

export function resolveHorizontalRuleWidth(
  explicitWidth: number | undefined,
  terminalWidth: number | undefined,
): number {
  return Math.max(0, Math.floor(explicitWidth ?? terminalWidth ?? 80));
}
