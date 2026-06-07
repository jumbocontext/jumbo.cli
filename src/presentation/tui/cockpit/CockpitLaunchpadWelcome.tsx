import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { CockpitLaunchpadWelcomeCopy } from "./CockpitLaunchpadWelcomeCopy.js";
import { HorizontalRule } from "../ui-primitives/HorizontalRule.js";

export function CockpitLaunchpadWelcome(): React.ReactElement {
  return (
    <Box width="100%" flexDirection="column">
      <Box width="100%" paddingBottom={0}>
        <Text color={BaseColors.primary} bold>WELCOME//</Text>
      </Box>
      <HorizontalRule color={BaseColors.shade6} />
      <Box 
        flexDirection="column" 
        width="100%"  
        padding={2} 
        paddingTop={1} 
        paddingBottom={1}
      >
        <Box flexDirection="row">
          <Text color={BaseColors.shade3}>
            {CockpitLaunchpadWelcomeCopy.paragraphs[0]}
          </Text>
        </Box>
        <Box flexDirection="row" marginTop={1}>
          <Text color={BaseColors.shade3}>
            {CockpitLaunchpadWelcomeCopy.paragraphs[1]}
          </Text>
        </Box>
        <Box width="100%" justifyContent="flex-end">
          <KeyBadge
            char={CockpitLaunchpadWelcomeCopy.hidePrompt.char}
            label={CockpitLaunchpadWelcomeCopy.hidePrompt.label}
            color={BaseColors.brandBlue}
            labelColor={BaseColors.shade6}
          />
        </Box>
      </Box>
    </Box>
  );
}
