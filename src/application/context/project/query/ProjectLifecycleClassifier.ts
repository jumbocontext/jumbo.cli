import { ProjectKnowledgeInventoryView } from "../ProjectKnowledgeInventoryView.js";
import { ProjectLifecycleState } from "../ProjectLifecycleState.js";

/**
 * ProjectLifecycleClassifier - Classifies derived project lifecycle state.
 */
export class ProjectLifecycleClassifier {
  classify(inventory: ProjectKnowledgeInventoryView): ProjectLifecycleState {
    if (!inventory.projectInitialized) {
      return "uninitialized";
    }

    if (inventory.solutionContextItemCount === 0) {
      return "unprimed";
    }

    if (inventory.launchpadReadyGoalCount === 0) {
      return "primed-empty";
    }

    return "primed";
  }
}
