/**
 * Embedded context types for Goal aggregate.
 * These types represent context that can be embedded directly
 * into a goal when created with --interactive mode.
 */

export interface EmbeddedInvariant {
  title: string;
  description: string;
  rationale?: string;
}

export interface EmbeddedGuideline {
  title: string;
  description: string;
  rationale?: string;
  examples?: string[];
}

export interface EmbeddedDependency {
  consumer: string;  // component name
  provider: string;  // component name
}

export interface EmbeddedComponent {
  name: string;
  responsibility: string;
}

export interface EmbeddedArchitecture {
  description: string;
  organization: string;
  patterns?: string[];
  principles?: string[];
}
