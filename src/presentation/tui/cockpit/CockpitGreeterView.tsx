import React from "react";
import { Box, Text } from "ink";
import { BaseColors, SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";

export function CockpitGreeterView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box flexDirection="row">
          <Box flexBasis="3%" />
          <Box flexDirection="column" flexBasis="94%">
            <Box marginTop={1}>
              <Text color={BaseColors.brandBlue} wrap="wrap">
                Hi, I'm Jumbo. I help coding agents stay aligned with your project intent.

                I capture the decisions, rules, corrections, and goals that matter, then
                deliver the relevant context back to agents when they need it. That keeps
                work consistent across sessions and agents without forcing you
                to rebuild context every time.

                Get started by initializing this project.
              </Text>
            </Box>

            <Box marginTop={2}>
              <CenteredPrompt
                keyChar="i"
                prefix="Press "
                suffix=" to initialize"
                secondary="or run 'jumbo init' from another terminal"
              />
            </Box>
          </Box>
          <Box flexBasis="3%" />
        </Box>
      </Box>
    </Box>
  );
}
