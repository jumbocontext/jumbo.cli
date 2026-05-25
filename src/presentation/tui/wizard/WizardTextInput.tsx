import React from "react";
import { Box, Text, useInput } from "ink";
import { SemanticColors, TuiGlyphs } from "../../shared/DesignTokens.js";

const INPUT_BACKGROUND = SemanticColors.inputField;
const INPUT_MIN_WIDTH = 42;

interface WizardTextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  focused?: boolean;
  error?: string;
}

export function WizardTextInput({
  label,
  value,
  onChange,
  placeholder,
  focused = true,
  error,
}: WizardTextInputProps): React.ReactElement {
  useInput(
    (input, key) => {
      if (key.backspace || key.delete) {
        if (value.length > 0) {
          onChange(value.slice(0, -1));
        }
        return;
      }

      if (
        key.return ||
        key.tab ||
        key.escape ||
        key.upArrow ||
        key.downArrow ||
        key.leftArrow ||
        key.rightArrow
      ) {
        return;
      }

      if (input && !key.ctrl && !key.meta) {
        onChange(value + input);
      }
    },
    { isActive: focused },
  );

  const showPlaceholder = value.length === 0 && placeholder !== undefined;

  return (
    <Box flexDirection="column" gap={0}>
      <Text color={SemanticColors.inputLabel} bold={focused} dimColor>
        {label}
      </Text>
      <Box
        marginLeft={0}
        backgroundColor={INPUT_BACKGROUND}
        paddingX={1}
        minWidth={INPUT_MIN_WIDTH}
      >
        {showPlaceholder ? (
          <Text
            color={SemanticColors.inputPlaceholderText}
            backgroundColor={INPUT_BACKGROUND}
          >
            {placeholder}
          </Text>
        ) : (
          <Text
            color={SemanticColors.inputText}
            backgroundColor={INPUT_BACKGROUND}
          >
            {value}
          </Text>
        )}
        {focused && (
          <Text
            color={SemanticColors.inputText}
            backgroundColor={INPUT_BACKGROUND}
          >
            ▎
          </Text>
        )}
      </Box>
      {error !== undefined && (
        <Box marginLeft={0}>
          <Text color={SemanticColors.error}>
            {TuiGlyphs.cross} {error}
          </Text>
        </Box>
      )}
    </Box>
  );
}
