import React from "react";
import { Box, Text } from "ink";
import { BaseColors, TuiColors, TuiGlyphs } from "../../shared/DesignTokens.js";
import { StatusIndicator } from "../components/StatusIndicator.js";

const GOAL_STATUS_COLORS: Record<string, string> = {
  doing: TuiColors.success,
  refused: TuiColors.muted,
  submitted: TuiColors.info,
  blocked: TuiColors.error,
  approved: TuiColors.accent,
};

const PLACEHOLDER_GOALS = [
  { title: "Implement user authentication", status: "doing" },
  { title: "Add dashboard analytics", status: "refused" },
  { title: "Write API documentation", status: "submitted" },
  { title: "Refactor database layer", status: "blocked" },
  { title: "Fix skipped state", status: "approved" },
  { title: "Extend Xyz entity", status: "refused" },
];

const PLACEHOLDER_SELECTED_GOAL = {
  meta: [
    { label: "id", value: "abcd1234-5678-90ab-cdef-25ef30dfe323" },
    { label: "title", value: "Add dashboard analytics" },
    { label: "manager", value: "c6a959fb-dfe5-4e96-8b1c-2f2d9d4b9d3d" },
    { label: "prerequisite(s)", value: "fc630366-abe7-ac7b-fe31-5b2347a48bb3" },
  ],
  objective:
    "Integrate analytics tracking into the dashboard to surface usage patterns, " +
    "performance metrics, and user engagement data for stakeholder reporting.",
  criteria: [
    "Dashboard renders analytics widgets with live data",
    "Usage patterns surfaced through chart components",
    "Performance metrics update on configurable interval",
    "User engagement data exportable as CSV",
    "All analytics queries respect tenant isolation",
    "Dashboard loads within acceptable latency threshold",
  ],
  scopeIn: [
    "src/presentation/dashboard",
    "src/application/analytics",
    "src/domain/analytics",
    "tests/presentation/dashboard",
    "tests/application/analytics",
  ],
  invariants: [
    {
      title: "Single Responsibility",
      description:
        "Each class/module has one reason to change.",
    },
    {
      title: "Dependency Inversion",
      description:
        "Depend on abstractions, not concretions. Application depends only on abstractions.",
    },
  ],
};

function SectionHeading({
  title,
}: {
  title: string;
}): React.ReactElement {
  return (
    <Box marginTop={1} marginBottom={0}>
      <Text color={TuiColors.headline} bold>
        | {title}
      </Text>
    </Box>
  );
}

export function CockpitLaunchpadView(): React.ReactElement {
  return (
    <Box flexDirection="row" paddingX={1} flexGrow={1}>
      <Box flexDirection="column" flexBasis="40%" paddingRight={2}>
        <SectionHeading title="GOALS" />
        {PLACEHOLDER_GOALS.map((goal) => (
          <Box key={goal.title}>
            <Text color={TuiColors.primary}>
              {TuiGlyphs.bullet} {goal.title}
            </Text>
            <Text color={GOAL_STATUS_COLORS[goal.status] ?? TuiColors.muted}>
              {" "}
              [{goal.status}]
            </Text>
          </Box>
        ))}
        <Box
          marginTop={1}
          flexDirection="column"
          alignItems="center"
          width="100%"
        >
          <Text>
            <Text color={TuiColors.primary}>Press </Text>
            <Text color={BaseColors.brandBlue} bold>
              [g]
            </Text>
            <Text color={TuiColors.primary}> to add a goal</Text>
          </Text>
        </Box>

        <SectionHeading title="WORKERS" />
        <Box flexDirection="column">
          <StatusIndicator label="Auto Goal Refiner" status="active" />
          <StatusIndicator label="Auto Goal Reviewer" status="error" />
          <StatusIndicator label="Auto Goal Implementor" status="error" />
          <StatusIndicator label="Auto Goal Codifier" status="idle" />
        </Box>
      </Box>

      <Box flexDirection="column" flexBasis="60%">
        <SectionHeading title="META-DATA" />
        {PLACEHOLDER_SELECTED_GOAL.meta.map((entry) => (
          <Box key={entry.label}>
            <Box width={18}>
              <Text color={TuiColors.muted}>{entry.label}:</Text>
            </Box>
            <Text color={TuiColors.primary}>{entry.value}</Text>
          </Box>
        ))}

        <SectionHeading title="OBJECTIVE" />
        <Text color={TuiColors.primary} wrap="wrap">
          {PLACEHOLDER_SELECTED_GOAL.objective}
        </Text>

        <SectionHeading title="CRITERIA" />
        {PLACEHOLDER_SELECTED_GOAL.criteria.map((criterion) => (
          <Box key={criterion}>
            <Text color={TuiColors.accent}>{TuiGlyphs.bullet} </Text>
            <Text color={TuiColors.primary}>{criterion}</Text>
          </Box>
        ))}

        <SectionHeading title="SCOPE-IN" />
        {PLACEHOLDER_SELECTED_GOAL.scopeIn.map((path) => (
          <Box key={path}>
            <Text color={TuiColors.accent}>{TuiGlyphs.bullet} </Text>
            <Text color={TuiColors.primary}>{path}</Text>
          </Box>
        ))}

        <SectionHeading title="RELATED-INVARIANTS" />
        {PLACEHOLDER_SELECTED_GOAL.invariants.map((invariant) => (
          <Box key={invariant.title} flexDirection="column" marginBottom={1}>
            <Text color={TuiColors.accent} bold>
              {invariant.title}
            </Text>
            <Box paddingLeft={2}>
              <Text color={TuiColors.primary} wrap="wrap">
                {invariant.description}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
