import React, { useState, useRef, useLayoutEffect } from "react";
import { Box, Text, useInput, measureElement, type DOMElement } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
} from "../../shared/DesignTokens.js";
import { KeyBadge } from "./KeyBadge.js";
import { WizardTextInput } from "./WizardTextInput.js";

export interface WizardStepField {
  readonly key: string;
  readonly label: string;
  readonly placeholder?: string;
}

export interface WizardStepDefinition {
  readonly title: string;
  readonly description?: string;
  readonly fields: readonly WizardStepField[];
}

export interface WizardProps {
  readonly title: string;
  readonly steps: readonly WizardStepDefinition[];
  readonly onConfirm: (values: Record<string, string>) => void;
  readonly onCancel: () => void;
}

const OVERLAY_BORDER_COLOR = SemanticColors.panelBorder;
const OVERLAY_MIN_WIDTH = 60;

export function Wizard({
  title,
  steps,
  onConfirm,
  onCancel,
}: WizardProps): React.ReactElement {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const valuesRef = useRef<Record<string, string>>({});
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const activeFieldRef = useRef(0);
  const stepIndexRef = useRef(0);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const panelRef = useRef<DOMElement | null>(null);
  const [innerWidth, setInnerWidth] = useState(OVERLAY_MIN_WIDTH - 8);

  useLayoutEffect(() => {
    if (panelRef.current) {
      const { width } = measureElement(panelRef.current);
      const inner = Math.max(1, width - 8);
      if (inner !== innerWidth) {
        setInnerWidth(inner);
      }
    }
  });

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const totalSteps = steps.length;
  const currentFields = currentStep.fields;

  const clearFieldError = (fieldKey: string) => {
    if (validationErrors[fieldKey] !== undefined) {
      const next = { ...validationErrors };
      delete next[fieldKey];
      setValidationErrors(next);
    }
  };

  const handleFieldChange = (fieldKey: string, nextValue: string) => {
    valuesRef.current = { ...valuesRef.current, [fieldKey]: nextValue };
    setValues({ ...valuesRef.current });
    clearFieldError(fieldKey);
  };

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    const stepIdx = stepIndexRef.current;
    const step = steps[stepIdx];
    const fields = step.fields;
    const fieldIdx = activeFieldRef.current;
    const lastStep = stepIdx === steps.length - 1;

    if (key.tab && !key.shift) {
      if (fieldIdx < fields.length - 1) {
        activeFieldRef.current = fieldIdx + 1;
        setActiveFieldIndex(fieldIdx + 1);
      }
      return;
    }

    if (key.tab && key.shift) {
      if (fieldIdx > 0) {
        activeFieldRef.current = fieldIdx - 1;
        setActiveFieldIndex(fieldIdx - 1);
      }
      return;
    }

    if (key.return) {
      if (fieldIdx < fields.length - 1) {
        activeFieldRef.current = fieldIdx + 1;
        setActiveFieldIndex(fieldIdx + 1);
        return;
      }
      const currentValues = valuesRef.current;
      const errors: Record<string, string> = {};
      for (const field of fields) {
        const fieldValue = currentValues[field.key] ?? "";
        if (fieldValue.trim().length === 0) {
          errors[field.key] = "Required";
        }
      }
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }
      if (lastStep) {
        onConfirm({ ...currentValues });
      } else {
        const nextIdx = stepIdx + 1;
        stepIndexRef.current = nextIdx;
        activeFieldRef.current = 0;
        setCurrentStepIndex(nextIdx);
        setActiveFieldIndex(0);
        setValidationErrors({});
      }
      return;
    }

    if (key.leftArrow && stepIdx > 0 && !input) {
      const prevIdx = stepIdx - 1;
      stepIndexRef.current = prevIdx;
      activeFieldRef.current = 0;
      setCurrentStepIndex(prevIdx);
      setActiveFieldIndex(0);
      setValidationErrors({});
      return;
    }
  });

  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
    >
      <Box
        flexDirection="column"
        backgroundColor={BaseColors.black}
        paddingX={4}
        paddingY={2}
        minWidth={OVERLAY_MIN_WIDTH}
        ref={panelRef}
      >
        <Box flexDirection="column" gap={0}>
          <Text color={SemanticColors.headline} bold>
            {TuiGlyphs.accentBar} {title}
          </Text>
        </Box>

        {currentStep.description !== undefined && (
          <Box marginTop={1}>
            <Text color={SemanticColors.secondary} wrap="wrap">
              {currentStep.description}
            </Text>
          </Box>
        )}

        <Box flexDirection="column" marginTop={1} gap={1}>
          {currentFields.map((field, fieldIndex) => {
            const fieldValue = values[field.key] ?? "";
            const isFocused = fieldIndex === activeFieldIndex;
            return (
              <WizardTextInput
                key={field.key}
                label={field.label}
                value={fieldValue}
                placeholder={field.placeholder}
                focused={isFocused}
                error={validationErrors[field.key]}
                onChange={(nextValue) => handleFieldChange(field.key, nextValue)}
              />
            );
          })}
        </Box>

        <Box marginTop={1} width={innerWidth}>
          <Text
            color={BaseColors.shade5}
            backgroundColor={BaseColors.black}
          >
            {TuiGlyphs.divider.repeat(innerWidth)}
          </Text>
        </Box>

        <Box marginTop={1} width={innerWidth}>
          <Box gap={2}>
            {!isFirstStep && <KeyBadge char="←" label="Back" />}
            <KeyBadge char="⏎" label={isLastStep ? "Confirm" : "Next"} />
            <KeyBadge char="esc" label="Cancel" />
            <KeyBadge char="tab" label="Next field" />
          </Box>
          <Box flexGrow={1} />
          <Text color={SemanticColors.secondary}>
            {currentStepIndex + 1}/{totalSteps}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
