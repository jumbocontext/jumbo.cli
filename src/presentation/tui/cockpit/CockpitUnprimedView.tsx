import React from "react";
import { Box, Text } from "ink";
import { BaseColors, SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";
import { SectionHeading } from "../ui-primitives/SectionHeading.js";
import { CockpitUnprimedCopy } from "./CockpitUnprimedCopy.js";

export function CockpitUnprimedView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box flexDirection="row">
          <Box flexBasis="3%" />
          <Box flexDirection="column" flexBasis="94%">
            <Text color={SemanticColors.primary} wrap="wrap">
              {CockpitUnprimedCopy.intro}
            </Text>
          </Box>
          <Box flexBasis="3%" />
        </Box>
        <Box flexDirection="row">
          <Box flexBasis="10%" />
          <Box flexDirection="column" flexBasis="80%" marginTop={1}>
            <SectionHeading title={CockpitUnprimedCopy.nextStepsHeading} />
            <Box flexDirection="column" marginTop={1}>
              <Text color={SemanticColors.primary} wrap="wrap">
                {CockpitUnprimedCopy.nextSteps[0]}
              </Text>
              <Text color={SemanticColors.primary} wrap="wrap">
                {CockpitUnprimedCopy.nextSteps[1]}
              </Text>
              <Text color={BaseColors.brandYellow} dimColor wrap="wrap">
                {CockpitUnprimedCopy.agentNudgeNote}
              </Text>
              <Text color={SemanticColors.primary} wrap="wrap">
                {CockpitUnprimedCopy.nextSteps[2]}
              </Text>
            </Box>
          </Box>
          <Box flexBasis="10%" />
        </Box>
        <Box marginTop={2}>
          <CenteredPrompt
            keyChar={CockpitUnprimedCopy.skipPrompt.keyChar}
            prefix={CockpitUnprimedCopy.skipPrompt.prefix}
            suffix={CockpitUnprimedCopy.skipPrompt.suffix}
          />
        </Box>
      </Box>
    </Box>
  );
}
