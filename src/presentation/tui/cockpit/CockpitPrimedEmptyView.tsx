import React from "react";
import { Box, Text } from "ink";
import { SemanticColors, TuiLayout } from "../../shared/DesignTokens.js";
import { CenteredPrompt } from "./CenteredPrompt.js";
import { SectionHeading } from "../ui-primitives/SectionHeading.js";
import { CockpitPrimedEmptyCopy } from "./CockpitPrimedEmptyCopy.js";

export function CockpitPrimedEmptyView(): React.ReactElement {
  return (
    <Box flexDirection="column" flexGrow={1} width="100%" paddingY={1} alignItems="center">
      <Box flexDirection="column" width={TuiLayout.bannerWidth} paddingX={2}>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color={SemanticColors.primary} wrap="wrap">
            {CockpitPrimedEmptyCopy.intro}
          </Text>
        </Box>
        <Box marginTop={2}>
          <CenteredPrompt
            keyChar={CockpitPrimedEmptyCopy.addGoalPrompt.keyChar}
            prefix={CockpitPrimedEmptyCopy.addGoalPrompt.prefix}
            suffix={CockpitPrimedEmptyCopy.addGoalPrompt.suffix}
            secondary={CockpitPrimedEmptyCopy.addGoalPrompt.secondary}
          />
        </Box>
        <Box marginTop={1}>
          <SectionHeading title={CockpitPrimedEmptyCopy.primerHeading} />
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            {CockpitPrimedEmptyCopy.primerParagraphs[0]}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            {CockpitPrimedEmptyCopy.primerParagraphs[1]}
          </Text>
        </Box>
        <Box marginTop={1}>
          <Text color={SemanticColors.primary} wrap="wrap">
            {CockpitPrimedEmptyCopy.primerParagraphs[2]}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
