import { EntityRenderer } from './EntityRenderer';
import { Annotation } from '../Annotation';

/**
 * DependencyContextView from ContextualGoalView
 */
export interface DependencyContextView {
  readonly dependencyId: string;
  readonly name: string;
  readonly version?: string;
  readonly purpose: string;
}

/**
 * Renders Dependency entities for terminal output.
 */
export class DependencyRenderer implements EntityRenderer<DependencyContextView> {
  toHumanReadable(dependency: DependencyContextView): string {
    const version = dependency.version ? ` (v${dependency.version})` : '';
    return `- ${dependency.name}${version}: ${dependency.purpose}`;
  }

  toJSON(dependency: DependencyContextView): unknown {
    return {
      dependencyId: dependency.dependencyId,
      name: dependency.name,
      version: dependency.version,
      purpose: dependency.purpose,
    };
  }

  getDefaultAnnotation(): Annotation {
    return {
      type: 'instruction',
      text: 'INSTRUCTION: You (the developer) MUST consider the following dependencies while implementing this goal.',
    };
  }

  getGroupHeader(): string {
    return '## Relevant Dependencies:';
  }
}
