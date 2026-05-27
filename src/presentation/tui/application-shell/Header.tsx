import React from "react";
import { Box, Text } from "ink";
import { BaseColors, SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import {
  HeaderCopy,
  PATH_TRUNCATION_MARKER,
  VERSION_PREFIX,
} from "./HeaderConstants.js";

interface HeaderProps {
  projectName: string;
  directoryPath: string;
  version: string;
  terminalWidth: number;
}

export function Header({
  projectName,
  directoryPath,
  version,
  terminalWidth,
}: HeaderProps): React.ReactElement {
  const versionText = `${VERSION_PREFIX}${version}`;
  const versionLabelText = `${HeaderCopy.productName} ● ${versionText}`;
  const displayedDirectoryPath = fitDirectoryPath({
    directoryPath,
    projectName,
    terminalWidth,
    versionLabelText,
  });

  return (
    <Box flexDirection="column" width={terminalWidth}>
      <Box justifyContent="space-between" paddingX={1}>
        <Box flexShrink={1}>
          <Text color={BaseColors.brandBlue} bold>
            {projectName}
          </Text>
          {displayedDirectoryPath.length > 0 && (
            <Text color={SemanticColors.muted} dimColor>
              {" "}
              {displayedDirectoryPath}
            </Text>
          )}
        </Box>
        <Box flexShrink={0}>
          <Text color={BaseColors.brandBlue}>{versionLabelText}</Text>
        </Box>
      </Box>
      {/* <Text color={SemanticColors.muted} dimColor>
        {TuiGlyphs.divider.repeat(terminalWidth)}
      </Text> */}
    </Box>
  );
}

function fitDirectoryPath({
  directoryPath,
  projectName,
  terminalWidth,
  versionLabelText,
}: {
  readonly directoryPath: string;
  readonly projectName: string;
  readonly terminalWidth: number;
  readonly versionLabelText: string;
}): string {
  const horizontalPadding = 2;
  const minimumGapBeforeVersion = 1;
  const projectPathSeparator = 1;
  const availablePathWidth =
    terminalWidth -
    horizontalPadding -
    minimumGapBeforeVersion -
    projectName.length -
    projectPathSeparator -
    versionLabelText.length;

  if (availablePathWidth <= 0) {
    return "";
  }

  if (directoryPath.length <= availablePathWidth) {
    return directoryPath;
  }

  if (availablePathWidth <= 3) {
    return directoryPath.slice(0, availablePathWidth);
  }

  return `${directoryPath.slice(0, availablePathWidth - PATH_TRUNCATION_MARKER.length)}${PATH_TRUNCATION_MARKER}`;
}
