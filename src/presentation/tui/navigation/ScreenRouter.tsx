import React from "react";
import {
  DEFAULT_SCREEN_INDEX,
  SCREEN_DEFINITIONS,
} from "./ScreenDefinitions.js";
import { CockpitScreen } from "../cockpit/CockpitScreen.js";
import { ComponentsScreen } from "../memory/components/ComponentsScreen.js";
import { DecisionsScreen } from "../memory/decisions/DecisionsScreen.js";
import { DependenciesScreen } from "../memory/dependencies/DependenciesScreen.js";
import { GoalsScreen } from "../goals/GoalsScreen.js";
import { GuidelinesScreen } from "../memory/guidelines/GuidelinesScreen.js";
import { InvariantsScreen } from "../memory/invariants/InvariantsScreen.js";
import { SessionScreen } from "../sessions/SessionScreen.js";
import type { ProjectLifecycleState } from "../../../application/context/project/ProjectLifecycleState.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";

interface ScreenRouterProps {
  activeScreenIndex: number;
  projectLifecycleState?: ProjectLifecycleState;
  shortcutsEnabled?: boolean;
  terminalWidth?: number;
  terminalHeight?: number;
  launchAnimationEnabled?: boolean;
  bannerAnimationComplete?: boolean;
  billboardAnimationComplete?: boolean;
  onBannerAnimationComplete?: () => void;
  onBillboardAnimationComplete?: () => void;
  settingsReader?: Pick<ISettingsReader, "read" | "write">;
}

const SCREEN_COMPONENTS: Record<
  (typeof SCREEN_DEFINITIONS)[number]["key"],
  () => React.ReactElement
> = {
  cockpit: CockpitScreen,
  components: ComponentsScreen,
  decisions: DecisionsScreen,
  dependencies: DependenciesScreen,
  goals: GoalsScreen,
  guidelines: GuidelinesScreen,
  invariants: InvariantsScreen,
  session: SessionScreen,
};

const MEMORY_SCREEN_KEYS = new Set([
  "components",
  "decisions",
  "dependencies",
  "guidelines",
  "invariants",
]);

export function ScreenRouter({
  activeScreenIndex,
  projectLifecycleState,
  shortcutsEnabled = true,
  terminalWidth,
  terminalHeight,
  launchAnimationEnabled = true,
  bannerAnimationComplete,
  billboardAnimationComplete,
  onBannerAnimationComplete,
  onBillboardAnimationComplete,
  settingsReader,
}: ScreenRouterProps): React.ReactElement {
  const definition = SCREEN_DEFINITIONS[activeScreenIndex];
  const ScreenComponent = definition
    ? SCREEN_COMPONENTS[definition.key]
    : SCREEN_COMPONENTS.cockpit;

  const defaultScreenKey = SCREEN_DEFINITIONS[DEFAULT_SCREEN_INDEX].key;

  if ((definition?.key ?? defaultScreenKey) === defaultScreenKey) {
    return (
      <CockpitScreen
        state={projectLifecycleState}
        shortcutsEnabled={shortcutsEnabled}
        terminalWidth={terminalWidth}
        terminalHeight={terminalHeight}
        launchAnimationEnabled={launchAnimationEnabled}
        bannerAnimationComplete={bannerAnimationComplete}
        billboardAnimationComplete={billboardAnimationComplete}
        onBannerAnimationComplete={onBannerAnimationComplete}
        onBillboardAnimationComplete={onBillboardAnimationComplete}
        settingsReader={settingsReader}
      />
    );
  }

  if (definition !== undefined && MEMORY_SCREEN_KEYS.has(definition.key)) {
    switch (definition.key) {
      case "components":
        return <ComponentsScreen shortcutsEnabled={shortcutsEnabled} />;
      case "decisions":
        return <DecisionsScreen shortcutsEnabled={shortcutsEnabled} />;
      case "dependencies":
        return <DependenciesScreen shortcutsEnabled={shortcutsEnabled} />;
      case "guidelines":
        return <GuidelinesScreen shortcutsEnabled={shortcutsEnabled} />;
      case "invariants":
        return <InvariantsScreen shortcutsEnabled={shortcutsEnabled} />;
    }
  }

  return <ScreenComponent />;
}
