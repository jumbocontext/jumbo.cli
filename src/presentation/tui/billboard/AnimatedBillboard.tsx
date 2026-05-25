import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, Text } from "ink";
import Yoga from "yoga-layout";

const TARGET_STICKERS = 39;
const STICKERS_PER_FRAME = 6;
const FRAME_MS = 0;
const FULL_BLOCK_COLOR = "#000000";
const JUMBO_COLOR = "#ffffff";
const CANDIDATES_PER_STICKER = 40;
const FINAL_PAUSE_MS = 650;
const ERASE_FRAME_MS = 0;
const ERASE_ROWS_PER_FRAME = 3
;

const GLYPH = [
  "         ▓▒▒▒▒▒▒▒▒▒▓        ",
  " ▓▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▓ ",
  "▓▒▒▒▒▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▓",
  "▓▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▒▓",
  "▓▒▒▒▓▓▒▒▒█▒▒▒▒▒▒▒▒█▒▒▒▓▓▒▒▒▓",
  "  ▓▒▒▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▒▒▓  ",
  "   ▓▓▒▒▓▓▒▓▒▒▒▒▒▒▓▒▓▓▒▒▓▓   ",
  "   ▓▒▒▒▒▒▒▓▓▒▒▒▒▓▓▒▒▒▒▒▒▓   ",
  "  ▓▒▒▒▒▒▒▒▒▓▒▒▒▒▓▓▓▒▒▒▒▒▒▓  ",
  "  ▓▒▒▒▒▒▒▒▒▒▓▓▒▒▒▒▒▓▒▒▒▒▒▓  ",
  "  ▓▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▒▒▒▒▒▒▓  ",
  "   ▓▒▒▒▒▒▒▒▓    ▓▒▒▒▒▒▒▒▓   ",
  "    ▓▒▒▒▒▒▓      ▓▒▒▒▒▒▓    ",
  "                            ",
] as const;

const JUMBO = [
  "     ███ ███    ███ ████      ████ ████████   █████████  ",
  "     ███░███░   ███░█████    █████░███░░░███ ███░░░░░███ ",
  "     ███░███░   ███░███░██  ██░███░████████░░███░    ███░",
  "███  ███░███░   ███░███░ ████░░███░███░░░███ ███░    ███░",
  " ██████░░ ████████░░███░  ██░░ ███░████████░░ █████████░░",
  "  ░░░░░░   ░░░░░░░░  ░░░   ░░   ░░░ ░░░░░░░░   ░░░░░░░░░ ",
  "                              Agent Context Orchestration",
] as const;

const BASE_COLORS = {
  Blue: "#66b4f4",
  BlueBorder: "#236ca8",
  Purple: "#aa00d4",
  PurpleBorder: "#6d0089",
  Red: "#ff2a2a",
  RedBorder: "#b11226",
  Orange: "#ff8307",
  OrangeBorder: "#b65300",
  Yellow: "#ffcc00",
  YellowBorder: "#a67c00",
  Green: "#44aa00",
  GreenBorder: "#2a6f00",
  Magenta: "#ff00aa",
  MagentaBorder: "#a80071",
} as const;

const COLOR_PAIRS = [
  {
    name: "Blue",
    fill: BASE_COLORS.Blue,
    border: BASE_COLORS.BlueBorder,
  },
  {
    name: "Purple",
    fill: BASE_COLORS.Purple,
    border: BASE_COLORS.PurpleBorder,
  },
  {
    name: "Red",
    fill: BASE_COLORS.Red,
    border: BASE_COLORS.RedBorder,
  },
  {
    name: "Orange",
    fill: BASE_COLORS.Orange,
    border: BASE_COLORS.OrangeBorder,
  },
  {
    name: "Yellow",
    fill: BASE_COLORS.Yellow,
    border: BASE_COLORS.YellowBorder,
  },
  {
    name: "Green",
    fill: BASE_COLORS.Green,
    border: BASE_COLORS.GreenBorder,
  },
  {
    name: "Magenta",
    fill: BASE_COLORS.Magenta,
    border: BASE_COLORS.MagentaBorder,
  },
] as const;

const GLYPH_HEIGHT = GLYPH.length;
const GLYPH_WIDTH = Math.max(...GLYPH.map((line) => line.length));
const GLYPH_PIXELS = GLYPH.flatMap((line, y) =>
  Array.from(line).flatMap((char, x) =>
    char === " " ? [] : [{ x, y }],
  ),
);
const JUMBO_HEIGHT = JUMBO.length;
const JUMBO_WIDTH = Math.max(...JUMBO.map((line) => Array.from(line).length));

export type AnimatedBillboardTriggerInput = {
  height: number;
  width: number;
  onDone?: () => void;
};

type ColorPair = (typeof COLOR_PAIRS)[number];

type Sticker = {
  id: number;
  x: number;
  y: number;
  pair: ColorPair;
};

type Cell = {
  char: string;
  color: string;
};

type Segment = {
  text: string;
  color?: string;
};

type Size = {
  columns: number;
  rows: number;
};

type Point = {
  x: number;
  y: number;
};

type PlacementBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type AnimationPhase = "stickers" | "finalPause" | "erasing" | "done";

function randomIntBetween(minInclusive: number, maxInclusive: number): number {
  return (
    minInclusive + Math.floor(Math.random() * (maxInclusive - minInclusive + 1))
  );
}

function getStageSize(size: Size): Size {
  const root = Yoga.Node.create();
  root.setWidth(Math.max(1, size.columns));
  root.setHeight(Math.max(1, size.rows));
  root.calculateLayout(undefined, undefined, Yoga.DIRECTION_LTR);

  const stage = {
    columns: root.getComputedWidth(),
    rows: root.getComputedHeight(),
  };

  root.free();
  return stage;
}

function getPlacementBounds(stage: Size): PlacementBounds {
  return {
    minX: 1 - GLYPH_WIDTH,
    maxX: stage.columns - 1,
    minY: 1 - GLYPH_HEIGHT,
    maxY: stage.rows - 1,
  };
}

function getBalancedColorPair(stickers: readonly Sticker[]): ColorPair {
  const counts = new Map<ColorPair["name"], number>(
    COLOR_PAIRS.map((pair) => [pair.name, 0]),
  );

  for (const sticker of stickers) {
    counts.set(sticker.pair.name, (counts.get(sticker.pair.name) ?? 0) + 1);
  }

  const lowestCount = Math.min(
    ...COLOR_PAIRS.map((pair) => counts.get(pair.name) ?? 0),
  );
  const leastUsedPairs = COLOR_PAIRS.filter(
    (pair) => counts.get(pair.name) === lowestCount,
  );

  return leastUsedPairs[randomIntBetween(0, leastUsedPairs.length - 1)]!;
}

function createRandomSticker(id: number, stage: Size, pair: ColorPair): Sticker {
  const bounds = getPlacementBounds(stage);

  return {
    id,
    x: randomIntBetween(bounds.minX, bounds.maxX),
    y: randomIntBetween(bounds.minY, bounds.maxY),
    pair,
  };
}

function createTargetedSticker(
  id: number,
  target: Point,
  pair: ColorPair,
): Sticker {
  const glyphPixel = GLYPH_PIXELS[randomIntBetween(0, GLYPH_PIXELS.length - 1)];

  return {
    id,
    x: target.x - glyphPixel.x,
    y: target.y - glyphPixel.y,
    pair,
  };
}

function getGlyphCellColor(char: string, pair: ColorPair): string | undefined {
  if (char === "█") {
    return FULL_BLOCK_COLOR;
  }

  if (char === "▓") {
    return pair.border;
  }

  if (char === "▒") {
    return pair.fill;
  }

  return undefined;
}

function createCoverage(stickers: readonly Sticker[], stage: Size): boolean[][] {
  const coverage = Array.from({ length: stage.rows }, () =>
    Array<boolean>(stage.columns).fill(false),
  );

  for (const sticker of stickers) {
    for (const pixel of GLYPH_PIXELS) {
      const canvasX = sticker.x + pixel.x;
      const canvasY = sticker.y + pixel.y;

      if (
        canvasX >= 0 &&
        canvasX < stage.columns &&
        canvasY >= 0 &&
        canvasY < stage.rows
      ) {
        coverage[canvasY]![canvasX] = true;
      }
    }
  }

  return coverage;
}

function getUncoveredCells(coverage: readonly boolean[][]): Point[] {
  const cells: Point[] = [];

  for (let y = 0; y < coverage.length; y += 1) {
    const row = coverage[y] ?? [];

    for (let x = 0; x < row.length; x += 1) {
      if (!row[x]) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

function scoreSticker(
  sticker: Sticker,
  coverage: readonly boolean[][],
  stage: Size,
): number {
  let score = 0;

  for (const pixel of GLYPH_PIXELS) {
    const canvasX = sticker.x + pixel.x;
    const canvasY = sticker.y + pixel.y;

    if (
      canvasX >= 0 &&
      canvasX < stage.columns &&
      canvasY >= 0 &&
      canvasY < stage.rows &&
      !coverage[canvasY]![canvasX]
    ) {
      score += 1;
    }
  }

  return score;
}

function createSticker(
  id: number,
  stage: Size,
  currentStickers: readonly Sticker[],
): Sticker {
  const pair = getBalancedColorPair(currentStickers);
  const coverage = createCoverage(currentStickers, stage);
  const uncoveredCells = getUncoveredCells(coverage);
  let bestSticker = createRandomSticker(id, stage, pair);
  let bestScore = scoreSticker(bestSticker, coverage, stage);

  for (let index = 0; index < CANDIDATES_PER_STICKER; index += 1) {
    const shouldTargetBlankCell =
      uncoveredCells.length > 0 && index < CANDIDATES_PER_STICKER / 2;
    const candidate = shouldTargetBlankCell
      ? createTargetedSticker(
          id,
          uncoveredCells[randomIntBetween(0, uncoveredCells.length - 1)]!,
          pair,
        )
      : createRandomSticker(id, stage, pair);
    const candidateScore = scoreSticker(candidate, coverage, stage);

    if (candidateScore > bestScore) {
      bestSticker = candidate;
      bestScore = candidateScore;
    }
  }

  return bestSticker;
}

function renderSticker(cells: Array<Array<Cell | undefined>>, sticker: Sticker): void {
  for (let glyphY = 0; glyphY < GLYPH_HEIGHT; glyphY += 1) {
    const canvasY = sticker.y + glyphY;

    if (canvasY < 0 || canvasY >= cells.length) {
      continue;
    }

    const line = GLYPH[glyphY] ?? "";

    for (let glyphX = 0; glyphX < line.length; glyphX += 1) {
      const char = line[glyphX] ?? " ";
      const color = getGlyphCellColor(char, sticker.pair);

      if (!color) {
        continue;
      }

      const canvasX = sticker.x + glyphX;

      if (canvasX < 0 || canvasX >= cells[canvasY]!.length) {
        continue;
      }

      cells[canvasY]![canvasX] = { char, color };
    }
  }
}

function renderJumbo(
  cells: Array<Array<Cell | undefined>>,
  stage: Size,
): void {
  const startX = Math.floor((stage.columns - JUMBO_WIDTH) / 2);
  const startY = Math.floor((stage.rows - JUMBO_HEIGHT) / 2);

  for (let jumboY = 0; jumboY < JUMBO_HEIGHT; jumboY += 1) {
    const canvasY = startY + jumboY;

    if (canvasY < 0 || canvasY >= cells.length) {
      continue;
    }

    const line = Array.from(JUMBO[jumboY] ?? "");

    for (let jumboX = 0; jumboX < line.length; jumboX += 1) {
      const char = line[jumboX] ?? " ";

      if (char === " ") {
        continue;
      }

      const canvasX = startX + jumboX;

      if (canvasX < 0 || canvasX >= stage.columns) {
        continue;
      }

      cells[canvasY]![canvasX] = {
        char,
        color: JUMBO_COLOR,
      };
    }
  }
}

function rowToSegments(row: Array<Cell | undefined>): Segment[] {
  const segments: Segment[] = [];
  let activeColor: string | undefined;
  let activeText = "";

  for (const cell of row) {
    const color = cell?.color;
    const char = cell?.char ?? " ";

    if (color !== activeColor) {
      if (activeText.length > 0) {
        segments.push({ text: activeText, color: activeColor });
      }

      activeColor = color;
      activeText = "";
    }

    activeText += char;
  }

  if (activeText.length > 0) {
    segments.push({ text: activeText, color: activeColor });
  }

  return segments;
}

function buildFrame(
  stickers: readonly Sticker[],
  stage: Size,
  showJumbo: boolean,
  visibleRows: number,
): Segment[][] {
  const cells = Array.from({ length: stage.rows }, () =>
    Array<Cell | undefined>(stage.columns).fill(undefined),
  );

  for (const sticker of stickers) {
    renderSticker(cells, sticker);
  }

  if (showJumbo) {
    renderJumbo(cells, stage);
  }

  return cells.map((row, y) =>
    y < visibleRows ? rowToSegments(row) : [{ text: " ".repeat(stage.columns) }],
  );
}

function AnimatedBillboardView({
  height,
  width,
  onDone,
}: AnimatedBillboardTriggerInput): React.ReactNode {
  const stage = useMemo(
    () =>
      getStageSize({
        columns: width,
        rows: height,
      }),
    [height, width],
  );
  const hasNotifiedDone = useRef(false);
  const [stickers, setStickers] = useState<Sticker[]>(() => [
    createSticker(0, stage, []),
  ]);
  const [phase, setPhase] = useState<AnimationPhase>("stickers");
  const [visibleRows, setVisibleRows] = useState(stage.rows);

  useEffect(() => {
    hasNotifiedDone.current = false;
    setPhase("stickers");
    setVisibleRows(stage.rows);
    setStickers([createSticker(0, stage, [])]);
  }, [stage]);

  /*
  useEffect(() => {
    if (phase !== "stickers" || stickers.length >= TARGET_STICKERS) {
      return;
    }

    const timer = setTimeout(() => {
      setStickers((current) => {
        if (current.length >= TARGET_STICKERS) {
          return current;
        }

        return [...current, createSticker(current.length, stage, current)];
      });
    }, FRAME_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [phase, stage, stickers.length]);
  */

  useEffect(() => {
    if (phase !== "stickers" || stickers.length >= TARGET_STICKERS) {
      return;
    }

    const timer = setTimeout(() => {
      setStickers((current) => {
        if (current.length >= TARGET_STICKERS) {
          return current;
        }

        const next = [...current];
        const batchSize = Math.min(
          STICKERS_PER_FRAME,
          TARGET_STICKERS - current.length,
        );

        for (let index = 0; index < batchSize; index += 1) {
          next.push(createSticker(next.length, stage, next));
        }

        return next;
      });
    }, FRAME_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [phase, stage, stickers.length]);

  useEffect(() => {
    if (phase !== "stickers" || stickers.length < TARGET_STICKERS) {
      return;
    }

    setVisibleRows(stage.rows);
    setPhase("finalPause");
  }, [phase, stage.rows, stickers.length]);

  useEffect(() => {
    if (phase !== "finalPause") {
      return;
    }

    const timer = setTimeout(() => {
      setPhase("erasing");
    }, FINAL_PAUSE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "erasing") {
      return;
    }

    if (visibleRows <= 0) {
      setPhase("done");
      return;
    }

    const timer = setTimeout(() => {
      setVisibleRows((current) => Math.max(0, current - ERASE_ROWS_PER_FRAME));
    }, ERASE_FRAME_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [phase, visibleRows]);

  useEffect(() => {
    if (phase !== "done" || hasNotifiedDone.current) {
      return;
    }

    hasNotifiedDone.current = true;
    onDone?.();
  }, [onDone, phase]);

  const showJumbo = stickers.length >= TARGET_STICKERS && phase !== "done";
  const frame = useMemo(
    () => buildFrame(stickers, stage, showJumbo, visibleRows),
    [stage, stickers, showJumbo, visibleRows],
  );

  return (
    <Box
      flexDirection="column"
      width={stage.columns}
      height={stage.rows}
      overflow="hidden"
    >
      {frame.map((line, y) => (
        <Text key={y}>
          {line.map((segment, x) => (
            <Text key={x} color={segment.color}>
              {segment.text}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
}

const AnimatedBillboard = {
  trigger(input: AnimatedBillboardTriggerInput): React.ReactElement {
    return <AnimatedBillboardView {...input} />;
  },
};

export default AnimatedBillboard;
