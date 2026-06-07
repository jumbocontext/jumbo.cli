import React from "react";
import { Box, Text } from "ink";
import { BaseColors } from "../../shared/DesignTokens.js";
import { useProjectStats } from "../state-reading/useProjectStats.js";
import { HorizontalRule } from "../ui-primitives/HorizontalRule.js";

export function CockpitProjectStatsPanel(): React.ReactElement {
  const projectStats = useProjectStats();
  const snapshot = projectStats.data?.snapshot;

  if (projectStats.error !== null) {
    return (
      <Box width="100%" paddingBottom={1}>
        <Text color="red" bold>STATS// unavailable</Text>
      </Box>
    );
  }

  if (snapshot === undefined) {
    return (
      <Box width="100%" paddingBottom={1}>
        <Text color="gray" bold>STATS// loading</Text>
      </Box>
    );
  }

  return (
    <Box width="100%" flexDirection="column">
      <Box width="100%" paddingBottom={0}>
        <Text color={BaseColors.primary} bold>STATS//</Text>
      </Box>
      <HorizontalRule color={BaseColors.shade6} />
      <Box 
        flexDirection="column" 
        width="100%"  
        padding={2} 
        paddingTop={1} 
        paddingBottom={1}
      >
        <Box flexDirection="row" columnGap={1} flexWrap="wrap">
          <Text color={BaseColors.shade2} bold>PROJECT:</Text>
          <Box flexDirection="row" columnGap={0} flexWrap="wrap">
            <Text>{snapshot.project.audiences.totalAudiences}</Text>
            <Text color={BaseColors.shade3}> Audiences | </Text>
            <Text>{snapshot.project.audiencePains.audiencePainsCount}</Text>
            <Text color={BaseColors.shade3}> Pains | </Text>
            <Text>{snapshot.project.valuePropositions.valuePropositionsCount}</Text>
            <Text color={BaseColors.shade3}> Value Propositions</Text>
          </Box>
        </Box>
        <Box flexDirection="row" columnGap={2} flexWrap="wrap">
          <Text color={BaseColors.shade2} bold>GOALS:</Text>
          <Box flexDirection="row" columnGap={0} flexWrap="wrap">
            <Text>{snapshot.work.goals.definedGoalsCount}</Text>
            <Text color={BaseColors.shade3}> Defined  | </Text>
            <Text>{snapshot.work.goals.refinedGoalsCount}</Text>
            <Text color={BaseColors.shade3}> Refined | </Text>
            <Text>{snapshot.work.goals.inProgressGoalsCount}</Text>
            <Text color={BaseColors.shade3}> In Progress | </Text>
            <Text>{snapshot.work.goals.submittedGoalsCount}</Text>
            <Text color={BaseColors.shade3}> Submitted | </Text>
            <Text>{snapshot.work.goals.closedGoalsCount}</Text>
            <Text color={BaseColors.shade3}> Closed</Text>
          </Box>
        </Box>
        <Box flexDirection="row" columnGap={2} flexWrap="wrap">
          <Text color={BaseColors.shade2} bold>MEMORIES:</Text>
          <Box flexDirection="row" columnGap={0} flexWrap="wrap">
            <Text>{snapshot.memory.decisions.decisionsCount}</Text>
            <Text color={BaseColors.shade3}> Decisions | </Text>
            <Text>{snapshot.memory.components.componentsCount}</Text>
            <Text color={BaseColors.shade3}> Components | </Text>
            <Text>{snapshot.memory.dependencies.dependenciesCount}</Text>
            <Text color={BaseColors.shade3}> Dependencies: </Text>
            <Text>{snapshot.memory.invariants.invariantsCount}</Text>
            <Text color={BaseColors.shade3}> Invariants | </Text>
            <Text>{snapshot.memory.guidelines.guidelinesCount}</Text>
            <Text color={BaseColors.shade3}> Guidelines | </Text>
            <Text>{snapshot.graph.relationCount}</Text>
            <Text color={BaseColors.shade3}> Relations</Text>
          </Box>
        </Box>
      </Box>
      
    </Box>
  );
}
