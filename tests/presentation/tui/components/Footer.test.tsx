import React from "react";
import { describe, expect, it } from "@jest/globals";
import { render } from "ink-testing-library";
import { Footer } from "../../../../src/presentation/tui/components/Footer.js";

const tick = () => new Promise((resolve) => setTimeout(resolve, 50));

describe("Footer", () => {
  it("renders a non-empty frame", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    expect((lastFrame() ?? "").trim().length).toBeGreaterThan(0);
  });

  it("renders a passive notification badge with placeholder unread count", () => {
    const { lastFrame } = render(<Footer terminalWidth={80} />);
    expect(lastFrame()).toContain("notifications (3)");
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
