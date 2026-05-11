import React from "react";
import { Box, Text } from "ink";
import { TuiColors } from "../../shared/DesignTokens.js";

interface SectionHeadingProps {
  title: string;
}

export function SectionHeading({
  title,
}: SectionHeadingProps): React.ReactElement {
  return (
    <Box marginTop={1} marginBottom={0}>
      <Text color={TuiColors.headline} bold>
        | {title}
      </Text>
    </Box>
  );
}
