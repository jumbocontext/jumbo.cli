type AnimatedBannerRgbColor = [number, number, number];

const ANIMATED_BANNER_COLOR_GRADIENT_ANCHORS: AnimatedBannerRgbColor[] = [
  [102, 180, 244],
  [170, 0, 212],
  [255, 42, 42],
  [255, 131, 7],
  [255, 204, 0],
  [68, 170, 0],
];

function interpolateAnimatedBannerRgbColor(
  startColor: AnimatedBannerRgbColor,
  endColor: AnimatedBannerRgbColor,
  progress: number,
): AnimatedBannerRgbColor {
  return [
    Math.round(startColor[0] + (endColor[0] - startColor[0]) * progress),
    Math.round(startColor[1] + (endColor[1] - startColor[1]) * progress),
    Math.round(startColor[2] + (endColor[2] - startColor[2]) * progress),
  ];
}

function formatAnimatedBannerRgbColorAsHex(
  red: number,
  green: number,
  blue: number,
): string {
  return (
    "#" +
    red.toString(16).padStart(2, "0") +
    green.toString(16).padStart(2, "0") +
    blue.toString(16).padStart(2, "0")
  );
}

export function getAnimatedBannerColorGradientHex(progress: number): string {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const segmentCount = ANIMATED_BANNER_COLOR_GRADIENT_ANCHORS.length - 1;
  const segmentLength = 1 / segmentCount;
  const segmentIndex = Math.min(
    Math.floor(clampedProgress / segmentLength),
    segmentCount - 1,
  );
  const segmentProgress =
    (clampedProgress - segmentIndex * segmentLength) / segmentLength;
  const [red, green, blue] = interpolateAnimatedBannerRgbColor(
    ANIMATED_BANNER_COLOR_GRADIENT_ANCHORS[segmentIndex],
    ANIMATED_BANNER_COLOR_GRADIENT_ANCHORS[segmentIndex + 1],
    segmentProgress,
  );

  return formatAnimatedBannerRgbColorAsHex(red, green, blue);
}
