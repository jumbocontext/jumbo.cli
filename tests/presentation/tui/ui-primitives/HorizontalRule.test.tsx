import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { Box, Text } from "ink";
import {
  HorizontalRule,
  HorizontalRuleText,
  resolveHorizontalRuleWidth,
} from "../../../../src/presentation/tui/ui-primitives/HorizontalRule.js";

describe("HorizontalRule", () => {
  it("renders a divider line at the requested width", () => {
    const { lastFrame } = render(
      <HorizontalRule color="cyan" width={12} />,
    );

    expect(lastFrame()).toBe("────────────");
  });

  it("passes the color to the rendered text", () => {
    const element = HorizontalRuleText({
      color: "#66b4f4",
      width: 4,
    });

    expect(element.type).toBe(Text);
    expect(element.props.color).toBe("#66b4f4");
  });

  it("truncates instead of wrapping when the available width is smaller", () => {
    const { lastFrame } = render(
      <Box width={10}>
        <HorizontalRule color="cyan" width={12} />
      </Box>,
    );

    expect(lastFrame()).toBe("──────────");
  });

  it("measures the available parent width when no explicit width is provided", () => {
    const { lastFrame } = render(
      <Box width={10}>
        <HorizontalRule color="cyan" />
      </Box>,
    );

    expect(lastFrame()).toBe("──────────");
  });

  it("uses terminal width when no explicit width is provided", () => {
    expect(resolveHorizontalRuleWidth(undefined, 132)).toBe(132);
  });

  it("falls back to 80 columns when width is unavailable", () => {
    expect(resolveHorizontalRuleWidth(undefined, undefined)).toBe(80);
  });
});
