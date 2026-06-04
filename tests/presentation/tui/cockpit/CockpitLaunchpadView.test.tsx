import React from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { CockpitLaunchpadView } from "../../../../src/presentation/tui/cockpit/CockpitLaunchpadView.js";

describe("CockpitLaunchpadView", () => {
  it("renders the launch animation until the injected renderer reports completion", () => {
    const onDone = jest.fn();
    const onLaunchAnimationDone = jest.fn();
    const launchAnimationRenderer = jest.fn(({ onDone: complete }) => {
      onDone.mockImplementation(complete);
      return <Text>launching cockpit</Text>;
    });
    const { lastFrame, rerender, unmount } = render(
      <CockpitLaunchpadView
        launchAnimationSize={{ width: 80, height: 24 }}
        launchAnimationRenderer={launchAnimationRenderer}
        onLaunchAnimationDone={onLaunchAnimationDone}
      />,
    );

    expect(lastFrame()).toContain("launching cockpit");
    expect(launchAnimationRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ width: 80, height: 24 }),
    );

    onDone();
    rerender(
      <CockpitLaunchpadView
        launchAnimationSize={{ width: 80, height: 24 }}
        launchAnimationRenderer={launchAnimationRenderer}
        onLaunchAnimationDone={onLaunchAnimationDone}
      />,
    );

    expect(onLaunchAnimationDone).toHaveBeenCalledTimes(1);
    expect(lastFrame()).not.toContain("launching cockpit");
    unmount();
  });
});
