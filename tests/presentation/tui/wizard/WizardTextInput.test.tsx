import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { WizardTextInput } from "../../../../src/presentation/tui/wizard/WizardTextInput.js";

describe("WizardTextInput", () => {
  it("renders the label", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("Name");
  });

  it("renders the current value", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="Alice" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("Alice");
  });

  it("renders placeholder when value is empty", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value=""
        placeholder="e.g. Alice"
        onChange={() => {}}
      />,
    );
    expect(lastFrame()).toContain("e.g. Alice");
  });

  it("renders the cursor indicator when focused", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value="test"
        onChange={() => {}}
        focused={true}
      />,
    );
    expect(lastFrame()).toContain("▎");
  });

  it("does not render cursor when not focused", () => {
    const { lastFrame } = render(
      <WizardTextInput
        label="Name"
        value="test"
        onChange={() => {}}
        focused={false}
      />,
    );
    expect(lastFrame()).not.toContain("▎");
  });

  it("renders the cursor for an empty focused input", () => {
    const { lastFrame } = render(
      <WizardTextInput label="Name" value="" onChange={() => {}} />,
    );
    expect(lastFrame()).toContain("▎");
  });
});
