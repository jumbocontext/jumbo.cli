import { BaseAggregate, AggregateState } from "../BaseAggregate.js";
import { UUID } from "../BaseEvent.js";
import { ValidationRuleSet } from "../validation/ValidationRule.js";
import {
  DependencyEvent,
  DependencyAddedEvent,
  DependencyUpdatedEvent,
  DependencyRemovedEvent
} from "./EventIndex.js";
import { DependencyEventType, DependencyStatus, DependencyStatusType, DependencyErrorMessages } from "./Constants.js";
import { CONSUMER_ID_RULES } from "./rules/ConsumerIdRules.js";
import { PROVIDER_ID_RULES } from "./rules/ProviderIdRules.js";
import { ENDPOINT_RULES } from "./rules/EndpointRules.js";
import { CONTRACT_RULES } from "./rules/ContractRules.js";
import { STATUS_RULES } from "./rules/StatusRules.js";

// Domain state: business properties + aggregate metadata
export interface DependencyState extends AggregateState {
  id: UUID;
  consumerId: string;
  providerId: string;
  endpoint: string | null;
  contract: string | null;
  status: DependencyStatusType;
  version: number;
}

export class Dependency extends BaseAggregate<DependencyState, DependencyEvent> {
  private constructor(state: DependencyState) {
    super(state);
  }

  /**
   * Applies a single event to mutate state in place.
   * Called by BaseAggregate.makeEvent() and during rehydration.
   */
  static apply(state: DependencyState, event: DependencyEvent): void {
    switch (event.type) {
      case DependencyEventType.ADDED: {
        const e = event as DependencyAddedEvent;
        state.consumerId = e.payload.consumerId;
        state.providerId = e.payload.providerId;
        state.endpoint = e.payload.endpoint;
        state.contract = e.payload.contract;
        state.status = DependencyStatus.ACTIVE;
        state.version = e.version;
        break;
      }
      case DependencyEventType.UPDATED: {
        const e = event as DependencyUpdatedEvent;
        if (e.payload.endpoint !== undefined) state.endpoint = e.payload.endpoint;
        if (e.payload.contract !== undefined) state.contract = e.payload.contract;
        if (e.payload.status !== undefined) state.status = e.payload.status;
        state.version = e.version;
        break;
      }
      case DependencyEventType.REMOVED: {
        state.status = DependencyStatus.REMOVED;
        state.version = event.version;
        break;
      }
    }
  }

  static create(id: UUID): Dependency {
    const state: DependencyState = {
      id,
      consumerId: "",
      providerId: "",
      endpoint: null,
      contract: null,
      status: DependencyStatus.ACTIVE,
      version: 0,
    };
    return new Dependency(state);
  }

  /**
   * Rehydrates aggregate state from full event history.
   * Used to rebuild Dependency from event store.
   */
  static rehydrate(id: UUID, history: DependencyEvent[]): Dependency {
    const state: DependencyState = {
      id,
      consumerId: "",
      providerId: "",
      endpoint: null,
      contract: null,
      status: DependencyStatus.ACTIVE,
      version: 0,
    };

    for (const event of history) {
      Dependency.apply(state, event);
    }

    return new Dependency(state);
  }

  add(
    consumerId: string,
    providerId: string,
    endpoint?: string,
    contract?: string
  ): DependencyAddedEvent {
    // Validation using rule pattern
    ValidationRuleSet.ensure(consumerId, CONSUMER_ID_RULES);
    ValidationRuleSet.ensure(providerId, PROVIDER_ID_RULES);
    if (endpoint) ValidationRuleSet.ensure(endpoint, ENDPOINT_RULES);
    if (contract) ValidationRuleSet.ensure(contract, CONTRACT_RULES);

    // Use BaseAggregate.makeEvent
    return this.makeEvent<DependencyAddedEvent>(
      DependencyEventType.ADDED,
      {
        consumerId,
        providerId,
        endpoint: endpoint || null,
        contract: contract || null,
      },
      Dependency.apply
    );
  }

  update(
    endpoint?: string | null,
    contract?: string | null,
    status?: DependencyStatusType
  ): DependencyUpdatedEvent {
    // Validation for updated fields
    if (endpoint !== undefined && endpoint !== null) {
      ValidationRuleSet.ensure(endpoint, ENDPOINT_RULES);
    }
    if (contract !== undefined && contract !== null) {
      ValidationRuleSet.ensure(contract, CONTRACT_RULES);
    }
    if (status !== undefined) {
      ValidationRuleSet.ensure(status, STATUS_RULES);
    }

    return this.makeEvent<DependencyUpdatedEvent>(
      DependencyEventType.UPDATED,
      {
        endpoint: endpoint !== undefined ? endpoint : undefined,
        contract: contract !== undefined ? contract : undefined,
        status: status !== undefined ? status : undefined,
      },
      Dependency.apply
    );
  }

  remove(reason?: string): DependencyRemovedEvent {
    // 1. State validation - can't remove if already removed
    if (this.state.status === DependencyStatus.REMOVED) {
      throw new Error(DependencyErrorMessages.ALREADY_REMOVED);
    }

    // 2. No additional input validation needed for optional reason
    // (Could add reason length validation if desired)

    // 3. Create and return event
    return this.makeEvent<DependencyRemovedEvent>(
      DependencyEventType.REMOVED,
      {
        reason: reason || null
      },
      Dependency.apply
    );
  }
}
