import React, { useState, useRef, useLayoutEffect } from "react";
import { Box, Text, useInput, measureElement, type DOMElement } from "ink";
import {
  BaseColors,
  SemanticColors,
  TuiGlyphs,
} from "../../shared/DesignTokens.js";
import { KeyBadge } from "../ui-primitives/KeyBadge.js";
import { WizardTextInput } from "./WizardTextInput.js";
import {
  WizardFieldKind,
  WizardKeyboardHintCopy,
  WizardKeyboardHintKey,
  WizardValidationCopy,
  type WizardFieldKindValue,
} from "./WizardConstants.js";

export interface WizardStepField {
  readonly key: string;
  readonly label: string;
  readonly placeholder?: string;
  readonly kind?: WizardFieldKindValue;
  readonly options?: readonly WizardStepFieldOption[];
  readonly defaultValue?: string;
  readonly required?: boolean;
  readonly validate?: (value: string, values: Record<string, string>) => string | null;
}

export interface WizardStepFieldOption {
  readonly value: string;
  readonly label: string;
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
  readonly onBack?: () => void;
  readonly initialStepIndex?: number;
  readonly initialValues?: Readonly<Record<string, string>>;
  readonly dispatchError?: string | null;
  readonly disabled?: boolean;
  readonly progressLabel?: string | WizardProgressLabelResolver;
  readonly extraHints?: readonly WizardFooterHint[];
  readonly onInput?: (input: string, key: WizardInputKey) => boolean;
}

const OVERLAY_MIN_WIDTH = 88;
const YES_NO_VALUES = {
  yes: "yes",
  no: "no",
} as const;

export interface WizardFooterHint {
  readonly char: string;
  readonly label: string;
}

export type WizardProgressLabelResolver = (
  currentStepIndex: number,
  totalSteps: number,
) => string | undefined;

export interface WizardInputKey {
  readonly upArrow?: boolean;
  readonly downArrow?: boolean;
  readonly leftArrow?: boolean;
  readonly rightArrow?: boolean;
  readonly return?: boolean;
  readonly escape?: boolean;
  readonly tab?: boolean;
  readonly shift?: boolean;
  readonly ctrl?: boolean;
  readonly meta?: boolean;
}

export function Wizard({
  title,
  steps,
  onConfirm,
  onCancel,
  onBack,
  initialStepIndex = 0,
  initialValues = {},
  dispatchError = null,
  disabled = false,
  progressLabel,
  extraHints = [],
  onInput,
}: WizardProps): React.ReactElement {
  const boundedInitialStepIndex = Math.min(
    Math.max(initialStepIndex, 0),
    Math.max(steps.length - 1, 0),
  );
  const initialValuesWithDefaults = withStepDefaultValues(
    steps[boundedInitialStepIndex]?.fields ?? [],
    { ...initialValues },
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(
    boundedInitialStepIndex,
  );
  const [values, setValues] = useState<Record<string, string>>({
    ...initialValuesWithDefaults,
  });
  const valuesRef = useRef<Record<string, string>>({
    ...initialValuesWithDefaults,
  });
  const [activeFieldIndex, setActiveFieldIndex] = useState(0);
  const activeFieldRef = useRef(0);
  const stepIndexRef = useRef(boundedInitialStepIndex);
  const [focusedOptionIndexes, setFocusedOptionIndexes] = useState<
    Record<string, number>
  >({});
  const focusedOptionIndexesRef = useRef<Record<string, number>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const panelRef = useRef<DOMElement | null>(null);
  const [innerWidth, setInnerWidth] = useState(OVERLAY_MIN_WIDTH - 8);
  const initialValuesKey = JSON.stringify(initialValues);

  useLayoutEffect(() => {
    const nextStepIndex = Math.min(
      Math.max(initialStepIndex, 0),
      Math.max(steps.length - 1, 0),
    );
    const nextValues = withStepDefaultValues(
      steps[nextStepIndex]?.fields ?? [],
      { ...initialValues },
    );

    stepIndexRef.current = nextStepIndex;
    activeFieldRef.current = 0;
    valuesRef.current = nextValues;
    focusedOptionIndexesRef.current = {};
    setCurrentStepIndex(nextStepIndex);
    setActiveFieldIndex(0);
    setValues({ ...nextValues });
    setFocusedOptionIndexes({});
    setValidationErrors({});
  }, [initialStepIndex, initialValuesKey, steps]);

  useLayoutEffect(() => {
    if (panelRef.current) {
      const { width } = measureElement(panelRef.current);
      const inner = Math.max(1, width - 8);
      if (inner !== innerWidth) {
        setInnerWidth(inner);
      }
    }
  });

  const renderedStepIndex = Math.min(
    Math.max(currentStepIndex, 0),
    Math.max(steps.length - 1, 0),
  );
  const currentStep = steps[renderedStepIndex];
  const isFirstStep = renderedStepIndex === 0;
  const isLastStep = renderedStepIndex === steps.length - 1;
  const totalSteps = steps.length;
  const currentFields = currentStep.fields;
  const activeField = currentFields[activeFieldIndex];
  const showSpaceToggleHint =
    activeField?.kind === WizardFieldKind.MULTI_SELECT ||
    activeField?.kind === WizardFieldKind.SINGLE_SELECT ||
    activeField?.kind === WizardFieldKind.YES_NO;
  const showBackHint = !isFirstStep || onBack !== undefined;
  const footerProgressLabel =
    typeof progressLabel === "function"
      ? progressLabel(renderedStepIndex, totalSteps) ??
        `${renderedStepIndex + 1}/${totalSteps}`
      : progressLabel ?? `${renderedStepIndex + 1}/${totalSteps}`;
  const footerProgressWidth = footerProgressLabel.length;
  const footerHintsWidth = Math.max(1, innerWidth - footerProgressWidth - 2);
  const footerHints = [
    ...(showBackHint
      ? [
          {
            char: WizardKeyboardHintKey.back,
            label: WizardKeyboardHintCopy.back,
            compact: true,
          },
        ]
      : []),
    {
      char: WizardKeyboardHintKey.submit,
      label: disabled
        ? WizardKeyboardHintCopy.working
        : isLastStep
          ? WizardKeyboardHintCopy.confirm
          : WizardKeyboardHintCopy.next,
      compact: true,
    },
    {
      char: WizardKeyboardHintKey.cancel,
      label: WizardKeyboardHintCopy.cancel,
      compact: true,
    },
    ...(currentFields.length > 1
      ? [
          {
            char: WizardKeyboardHintKey.field,
            label: WizardKeyboardHintCopy.field,
            compact: true,
          },
        ]
      : []),
    ...(showSpaceToggleHint
      ? [
          {
            char: WizardKeyboardHintKey.toggle,
            label: WizardKeyboardHintCopy.toggle,
            compact: true,
          },
        ]
      : []),
    ...extraHints.map((hint) => ({ ...hint, compact: true })),
  ];

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

  const handleFocusedOptionIndexChange = (
    fieldKey: string,
    nextIndex: number,
  ) => {
    focusedOptionIndexesRef.current = {
      ...focusedOptionIndexesRef.current,
      [fieldKey]: nextIndex,
    };
    setFocusedOptionIndexes({ ...focusedOptionIndexesRef.current });
  };

  useInput((input, key) => {
    if (disabled) {
      return;
    }

    if (key.escape) {
      onCancel();
      return;
    }

    if (onInput?.(input, key)) {
      return;
    }

    const stepIdx = stepIndexRef.current;
    const step = steps[stepIdx];
    const fields = step.fields;
    const fieldIdx = activeFieldRef.current;
    const activeField = fields[fieldIdx];
    const lastStep = stepIdx === steps.length - 1;
    const navigateBack = () => {
      if (stepIdx > 0) {
        const prevIdx = stepIdx - 1;
        stepIndexRef.current = prevIdx;
        activeFieldRef.current = 0;
        setCurrentStepIndex(prevIdx);
        setActiveFieldIndex(0);
        setValidationErrors({});
        return;
      }
      onBack?.();
    };

    if (key.leftArrow && !input) {
      navigateBack();
      return;
    }

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
      } else {
        navigateBack();
      }
      return;
    }

    if (
      activeField?.kind !== WizardFieldKind.MULTI_SELECT &&
      activeField?.kind !== WizardFieldKind.SINGLE_SELECT &&
      key.upArrow
    ) {
      if (fieldIdx > 0) {
        activeFieldRef.current = fieldIdx - 1;
        setActiveFieldIndex(fieldIdx - 1);
      }
      return;
    }

    if (
      activeField?.kind !== WizardFieldKind.MULTI_SELECT &&
      activeField?.kind !== WizardFieldKind.SINGLE_SELECT &&
      key.downArrow
    ) {
      if (fieldIdx < fields.length - 1) {
        activeFieldRef.current = fieldIdx + 1;
        setActiveFieldIndex(fieldIdx + 1);
      }
      return;
    }

    if (activeField?.kind === WizardFieldKind.YES_NO) {
      if (input === "y" || input === "Y") {
        handleFieldChange(activeField.key, YES_NO_VALUES.yes);
        return;
      }

      if (input === "n" || input === "N") {
        handleFieldChange(activeField.key, YES_NO_VALUES.no);
        return;
      }

      if (input === " ") {
        handleFieldChange(
          activeField.key,
          resolveFieldValue(activeField, valuesRef.current) === YES_NO_VALUES.yes
            ? YES_NO_VALUES.no
            : YES_NO_VALUES.yes,
        );
        return;
      }
    }

    if (activeField?.kind === WizardFieldKind.MULTI_SELECT) {
      const options = activeField.options ?? [];
      const currentOptionIndex =
        focusedOptionIndexesRef.current[activeField.key] ?? 0;

      if (key.upArrow && options.length > 0) {
        handleFocusedOptionIndexChange(
          activeField.key,
          Math.max(currentOptionIndex - 1, 0),
        );
        return;
      }

      if (key.downArrow && options.length > 0) {
        handleFocusedOptionIndexChange(
          activeField.key,
          Math.min(currentOptionIndex + 1, options.length - 1),
        );
        return;
      }

      if (input === " " && options[currentOptionIndex] !== undefined) {
        handleFieldChange(
          activeField.key,
          toggleMultiSelectValue(
            resolveFieldValue(activeField, valuesRef.current),
            options[currentOptionIndex].value,
          ),
        );
        return;
      }
    }

    if (activeField?.kind === WizardFieldKind.SINGLE_SELECT) {
      const options = activeField.options ?? [];
      const currentOptionIndex =
        focusedOptionIndexesRef.current[activeField.key] ?? 0;

      if (key.upArrow && options.length > 0) {
        const nextIndex = Math.max(currentOptionIndex - 1, 0);
        handleFocusedOptionIndexChange(activeField.key, nextIndex);
        handleFieldChange(activeField.key, options[nextIndex].value);
        return;
      }

      if (key.downArrow && options.length > 0) {
        const nextIndex = Math.min(currentOptionIndex + 1, options.length - 1);
        handleFocusedOptionIndexChange(activeField.key, nextIndex);
        handleFieldChange(activeField.key, options[nextIndex].value);
        return;
      }

      if (input === " " && options[currentOptionIndex] !== undefined) {
        handleFieldChange(activeField.key, options[currentOptionIndex].value);
        return;
      }
    }

    if (key.return) {
      if (fieldIdx < fields.length - 1) {
        activeFieldRef.current = fieldIdx + 1;
        setActiveFieldIndex(fieldIdx + 1);
        return;
      }
      const currentValues = withStepDefaultValues(fields, valuesRef.current);
      const errors: Record<string, string> = {};
      for (const field of fields) {
        const fieldValue = resolveFieldValue(field, currentValues);
        if (field.required !== false && fieldValue.trim().length === 0) {
          errors[field.key] = WizardValidationCopy.required;
          continue;
        }
        const validationError = field.validate?.(fieldValue, currentValues);
        if (validationError !== undefined && validationError !== null) {
          errors[field.key] = validationError;
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
            const fieldValue = resolveFieldValue(field, values);
            const isFocused = fieldIndex === activeFieldIndex;
            if (field.kind === WizardFieldKind.YES_NO) {
              return (
              <WizardYesNoToggle
                key={field.key}
                label={field.label}
                value={fieldValue}
                focused={isFocused}
                error={validationErrors[field.key]}
              />
              );
            }

            if (field.kind === WizardFieldKind.MULTI_SELECT) {
              return (
                <WizardMultiSelect
                  key={field.key}
                  label={field.label}
                  value={fieldValue}
                  options={field.options ?? []}
                  focused={isFocused}
                  focusedOptionIndex={focusedOptionIndexes[field.key] ?? 0}
                  error={validationErrors[field.key]}
                />
              );
            }

            if (field.kind === WizardFieldKind.SINGLE_SELECT) {
              return (
                <WizardSingleSelect
                  key={field.key}
                  label={field.label}
                  value={fieldValue}
                  options={field.options ?? []}
                  focused={isFocused}
                  focusedOptionIndex={focusedOptionIndexes[field.key] ?? 0}
                  error={validationErrors[field.key]}
                />
              );
            }

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

        {dispatchError !== null && (
          <Box marginTop={1} width={innerWidth}>
            <Text color={SemanticColors.error} wrap="wrap">
              {dispatchError}
            </Text>
          </Box>
        )}

        <Box marginTop={1} width={innerWidth}>
          <Text
            color={BaseColors.shade5}
            backgroundColor={BaseColors.black}
          >
            {TuiGlyphs.divider.repeat(innerWidth)}
          </Text>
        </Box>

        <Box marginTop={1} width={innerWidth}>
          <Box
            width={footerHintsWidth}
            flexWrap="wrap"
            columnGap={2}
            rowGap={0}
          >
            {footerHints.map((hint) => (
              <KeyBadge
                key={`${hint.char}-${hint.label}`}
                char={hint.char}
                label={hint.label}
                compact={hint.compact}
              />
            ))}
          </Box>
          <Box flexGrow={1} />
          <Box width={footerProgressWidth}>
            <Text color={SemanticColors.secondary}>{footerProgressLabel}</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

interface WizardSingleSelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly WizardStepFieldOption[];
  readonly focused: boolean;
  readonly focusedOptionIndex: number;
  readonly error?: string;
}

function WizardSingleSelect({
  label,
  value,
  options,
  focused,
  focusedOptionIndex,
  error,
}: WizardSingleSelectProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={0}>
      <Text color={SemanticColors.inputLabel} bold={focused} dimColor>
        {label}
      </Text>
      <Box flexDirection="column">
        {options.map((option, index) => {
          const optionFocused = focused && index === focusedOptionIndex;
          const selected = value === option.value;
          return (
            <Text
              key={option.value}
              color={optionFocused ? BaseColors.brandBlue : SemanticColors.primary}
              bold={optionFocused}
            >
              {optionFocused ? TuiGlyphs.selector : " "} ({selected ? "x" : " "}){" "}
              {option.label}
            </Text>
          );
        })}
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

interface WizardMultiSelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly WizardStepFieldOption[];
  readonly focused: boolean;
  readonly focusedOptionIndex: number;
  readonly error?: string;
}

function WizardMultiSelect({
  label,
  value,
  options,
  focused,
  focusedOptionIndex,
  error,
}: WizardMultiSelectProps): React.ReactElement {
  const selectedValues = parseMultiSelectValue(value);

  return (
    <Box flexDirection="column" gap={0}>
      <Text color={SemanticColors.inputLabel} bold={focused} dimColor>
        {label}
      </Text>
      <Box flexDirection="column">
        {options.map((option, index) => {
          const optionFocused = focused && index === focusedOptionIndex;
          const selected = selectedValues.includes(option.value);
          return (
            <Text
              key={option.value}
              color={optionFocused ? BaseColors.brandBlue : SemanticColors.primary}
              bold={optionFocused}
            >
              {optionFocused ? TuiGlyphs.selector : " "} [{selected ? "x" : " "}]{" "}
              {option.label}
            </Text>
          );
        })}
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

interface WizardYesNoToggleProps {
  readonly label: string;
  readonly value: string;
  readonly focused: boolean;
  readonly error?: string;
}

function WizardYesNoToggle({
  label,
  value,
  focused,
  error,
}: WizardYesNoToggleProps): React.ReactElement {
  return (
    <Box flexDirection="column" gap={0}>
      <Text color={SemanticColors.inputLabel} bold={focused} dimColor>
        {label}
      </Text>
      <Box gap={2}>
        <WizardYesNoOption
          label="Yes"
          selected={value === YES_NO_VALUES.yes}
          focused={focused}
        />
        <WizardYesNoOption
          label="No"
          selected={value !== YES_NO_VALUES.yes}
          focused={focused}
        />
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

interface WizardYesNoOptionProps {
  readonly label: string;
  readonly selected: boolean;
  readonly focused: boolean;
}

function WizardYesNoOption({
  label,
  selected,
  focused,
}: WizardYesNoOptionProps): React.ReactElement {
  const color = selected
    ? focused
      ? BaseColors.brandBlue
      : SemanticColors.primary
    : SemanticColors.muted;

  return (
    <Text color={color} bold={selected}>
      {selected ? TuiGlyphs.selector : " "} {label}
    </Text>
  );
}

function resolveFieldValue(
  field: WizardStepField,
  values: Record<string, string>,
): string {
  return values[field.key] ?? field.defaultValue ?? "";
}

function withStepDefaultValues(
  fields: readonly WizardStepField[],
  values: Record<string, string>,
): Record<string, string> {
  return fields.reduce<Record<string, string>>(
    (nextValues, field) => {
      if (
        nextValues[field.key] === undefined &&
        field.defaultValue !== undefined
      ) {
        nextValues[field.key] = field.defaultValue;
      }
      return nextValues;
    },
    { ...values },
  );
}

function parseMultiSelectValue(value: string): readonly string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toggleMultiSelectValue(value: string, optionValue: string): string {
  const selectedValues = parseMultiSelectValue(value);
  const nextValues = selectedValues.includes(optionValue)
    ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
    : [...selectedValues, optionValue];

  return nextValues.join(",");
}
