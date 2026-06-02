import React from "react";
import { Box, Text } from "ink";
import { SemanticColors } from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";

export interface CenteredPromptProps {
  keyChar: string;
  prefix: string;
  suffix: string;
  secondary?: string;
}

export function CenteredPrompt({
  keyChar,
  prefix,
  suffix,
  secondary,
}: CenteredPromptProps): React.ReactElement {
  return (
    <Box flexDirection="column" alignItems="center" width="100%">
      <Box alignItems="center">
        <Text color={SemanticColors.primary}>{prefix}</Text>
        <KeyBadge char={keyChar} />
        <Text color={SemanticColors.primary}>{suffix}</Text>
      </Box>
      {secondary !== undefined && (
        <Box marginTop={1}>
          <Text color={SemanticColors.muted}>{secondary}</Text>
        </Box>
      )}
    </Box>
  );
}
