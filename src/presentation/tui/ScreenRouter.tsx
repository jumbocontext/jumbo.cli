import React from "react";
import { SCREEN_DEFINITIONS } from "./ScreenDefinitions.js";
import { CockpitScreen } from "./screens/CockpitScreen.js";
import { ComponentsScreen } from "./screens/ComponentsScreen.js";
import { DecisionsScreen } from "./screens/DecisionsScreen.js";
import { DependenciesScreen } from "./screens/DependenciesScreen.js";
import { GoalsScreen } from "./screens/GoalsScreen.js";
import { GuidelinesScreen } from "./screens/GuidelinesScreen.js";
import { InvariantsScreen } from "./screens/InvariantsScreen.js";
import { SessionScreen } from "./screens/SessionScreen.js";

interface ScreenRouterProps {
  activeScreenIndex: number;
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

export function ScreenRouter({
  activeScreenIndex,
}: ScreenRouterProps): React.ReactElement {
  const definition = SCREEN_DEFINITIONS[activeScreenIndex];
  const ScreenComponent = definition
    ? SCREEN_COMPONENTS[definition.key]
    : SCREEN_COMPONENTS.cockpit;

  return <ScreenComponent />;
}
