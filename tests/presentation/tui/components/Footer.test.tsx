import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { BaseColors } from "../../../../src/presentation/shared/DesignTokens.js";
import {
  Footer,
  NOTIFICATION_NOTIFIER_COLOR,
} from "../../../../src/presentation/tui/components/Footer.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("Footer", () => {
  it("renders a non-empty frame", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
  });

  it("renders the notification notifier in the right status slot", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    const frame = lastFrame()!;

    expect(frame).toContain("menu");
    expect(frame).toContain("quit");
    expect(frame).toContain("help");
    expect(frame).toContain("n  ● notifications (3)");
    expect(frame).not.toContain("drawer");
    expect(frame).toContain("● notifications (3)");
    expect(frame).not.toContain("daemons: idle");
    expect(frame.indexOf("help")).toBeLessThan(
      frame.indexOf("● notifications (3)"),
    );
  });

  it("colors the notification notifier with brand yellow", () => {
    expect(NOTIFICATION_NOTIFIER_COLOR).toBe(BaseColors.brandYellow);
  });

  it("toggles the notification drawer with n", async () => {
    const { lastFrame, stdin } = render(<Footer terminalWidth={80} />);

    stdin.write("n");
    await tick();
    expect(lastFrame()).toContain("Notifications");

    stdin.write("n");
    await tick();
    expect(lastFrame()).not.toContain("Notifications");
  });

  it("updates the notification count when a notification is dismissed", async () => {
    const { lastFrame, stdin } = render(<Footer terminalWidth={80} />);

    stdin.write("n");
    await tick();
    stdin.write("d");
    await tick();

    expect(lastFrame()).toContain("notifications (2)");
    expect(lastFrame()).not.toContain("New CLI version available");
  });
});
