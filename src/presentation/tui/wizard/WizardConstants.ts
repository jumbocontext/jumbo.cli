export const WizardFieldKind = {
  TEXT: "text",
  YES_NO: "yes-no",
  SINGLE_SELECT: "single-select",
  MULTI_SELECT: "multi-select",
} as const;

export type WizardFieldKindValue =
  (typeof WizardFieldKind)[keyof typeof WizardFieldKind];

export const WizardValidationCopy = {
  required: "Required",
} as const;

export const WizardKeyboardHintCopy = {
  back: "Back",
  working: "Working",
  confirm: "Confirm",
  next: "Next",
  cancel: "Cancel",
  field: "Field",
  toggle: "Toggle",
} as const;

export const WizardKeyboardHintKey = {
  back: "←",
  submit: "⏎",
  cancel: "esc",
  field: "↑↓",
  toggle: "space",
} as const;
