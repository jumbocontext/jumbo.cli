// Dependency event types
export const DependencyEventType = {
  ADDED: 'DependencyAddedEvent',
  UPDATED: 'DependencyUpdatedEvent',
  REMOVED: 'DependencyRemovedEvent'
} as const;

// Status enum
export const DependencyStatus = {
  ACTIVE: 'active',
  DEPRECATED: 'deprecated',
  REMOVED: 'removed'
} as const;

export type DependencyStatusType = typeof DependencyStatus[keyof typeof DependencyStatus];

// Error messages
export const DependencyErrorMessages = {
  CONSUMER_ID_REQUIRED: 'Consumer ID must be provided',
  CONSUMER_ID_TOO_LONG: 'Consumer ID must be less than {max} characters',
  PROVIDER_ID_REQUIRED: 'Provider ID must be provided',
  PROVIDER_ID_TOO_LONG: 'Provider ID must be less than {max} characters',
  ENDPOINT_TOO_LONG: 'Endpoint must be less than {max} characters',
  CONTRACT_TOO_LONG: 'Contract must be less than {max} characters',
  ALREADY_REMOVED: 'Dependency is already removed',
  NOT_FOUND: 'Dependency with id {id} not found',
  INVALID_STATUS: 'Status must be one of: active, deprecated, removed',
} as const;

// Numeric limits
export const DependencyLimits = {
  CONSUMER_ID_MAX_LENGTH: 200,
  PROVIDER_ID_MAX_LENGTH: 200,
  ENDPOINT_MAX_LENGTH: 500,
  CONTRACT_MAX_LENGTH: 500,
} as const;

// Helper function
export function formatErrorMessage(template: string, replacements: Record<string, string | number>): string {
  return Object.entries(replacements).reduce(
    (msg, [key, value]) => msg.replace(`{${key}}`, String(value)),
    template
  );
}
