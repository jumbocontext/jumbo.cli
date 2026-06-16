/**
 * Back-compatibility barrel. The domain model was split into focused modules
 * (scenario, jumbo-plan, jumbo-memory, jumbo-lifecycle, workspace, timing,
 * tamper, session, heartbeat, result); this file preserves the historical
 * `domain/types.js` import path. Prefer importing from `./index.js`.
 */

export * from './index.js';
