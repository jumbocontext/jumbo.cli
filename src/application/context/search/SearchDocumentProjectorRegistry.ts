import { ComponentSearchDocumentProjector } from "./projectors/ComponentSearchDocumentProjector.js";
import { DecisionSearchDocumentProjector } from "./projectors/DecisionSearchDocumentProjector.js";
import { DependencySearchDocumentProjector } from "./projectors/DependencySearchDocumentProjector.js";
import { GuidelineSearchDocumentProjector } from "./projectors/GuidelineSearchDocumentProjector.js";
import { InvariantSearchDocumentProjector } from "./projectors/InvariantSearchDocumentProjector.js";

export class SearchDocumentProjectorRegistry {
  createMemoryProjectors() {
    return [
      new ComponentSearchDocumentProjector(),
      new DependencySearchDocumentProjector(),
      new DecisionSearchDocumentProjector(),
      new GuidelineSearchDocumentProjector(),
      new InvariantSearchDocumentProjector(),
    ] as const;
  }
}
