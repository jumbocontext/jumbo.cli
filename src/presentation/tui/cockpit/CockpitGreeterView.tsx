import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";
import { CockpitGreeterCopy } from "./CockpitGreeterCopy.js";

export function CockpitGreeterView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box flexDirection="row">
          <Box flexBasis="3%" />
          <Box flexDirection="column" flexBasis="94%">
            <Box marginTop={1}>
              <Text color={BaseColors.brandBlue} wrap="wrap">
                {CockpitGreeterCopy.body.join("\n\n")}
              </Text>
            </Box>

            <Box marginTop={2}>
              <CenteredPrompt
                keyChar={CockpitGreeterCopy.initializePrompt.keyChar}
                prefix={CockpitGreeterCopy.initializePrompt.prefix}
                suffix={CockpitGreeterCopy.initializePrompt.suffix}
                secondary={CockpitGreeterCopy.initializePrompt.secondary}
              />
            </Box>
          </Box>
          <Box flexBasis="3%" />
        </Box>
      </Box>
    </Box>
  );
}
