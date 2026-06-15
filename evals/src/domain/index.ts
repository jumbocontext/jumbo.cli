/**
 * Canonical barrel for the domain model. The types are organised into focused
 * modules by concern; import them from here (or, for back-compat, from
 * `./types.js`).
 */

export * from './scenario.js';
export * from './jumbo-plan.js';
export * from './jumbo-memory.js';
export * from './jumbo-lifecycle.js';
export * from './workspace.js';
export * from './timing.js';
export * from './tamper.js';
export * from './tamper-provenance.js';
export * from './clock.js';
export * from './validation.js';
export * from './session.js';
export * from './heartbeat.js';
export * from './result.js';
export * from './result-factories.js';
