import React from "react";
import { Box, Text } from "ink";
import { TuiColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../components/KeyBadge.js";

interface CockpitGreeterViewProps {
  directory?: string;
}

export function CockpitGreeterView({
  directory = process.cwd(),
}: CockpitGreeterViewProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box
        borderStyle="round"
        borderColor={TuiColors.panelBorder}
        paddingX={1}
        flexDirection="column"
      >
        <Box>
          <Box width={14}>
            <Text color={TuiColors.label}>Directory</Text>
          </Box>
          <Text color={TuiColors.primary}>{directory}</Text>
        </Box>
        <Box>
          <Box width={14}>
            <Text color={TuiColors.label}>Status</Text>
          </Box>
          <Text color={TuiColors.primary} bold>
            Uninitialized
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={TuiColors.primary} wrap="wrap">
          Hi, I'm Jumbo. I give your coding agents the memory they're missing
          and help you manage the context you provide to them when completing
          tasks. So you can focus on what your building and not have to repeat
          yourself to them all the time.
        </Text>
      </Box>

      <Box
        marginTop={2}
        flexDirection="column"
        alignItems="center"
        width="100%"
      >
        <Box alignItems="center" gap={1}>
          <Text color={TuiColors.primary}>Press </Text>
          <KeyBadge char="i" />
          <Text color={TuiColors.primary}> to initialize</Text>
        </Box>
        <Box marginTop={1}>
          <Text color={TuiColors.muted} dimColor>
            or run 'jumbo init' from another terminal
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
