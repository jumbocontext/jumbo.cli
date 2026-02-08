import { SessionContextQueryHandler } from "./SessionContextQueryHandler.js";
import { SessionStartContextEnricher } from "./SessionStartContextEnricher.js";
import { SessionStartContext } from "./SessionStartContext.js";
import { ISessionSummaryReader } from "./ISessionSummaryReader.js";
import { IGoalStatusReader } from "../../goals/IGoalStatusReader.js";
import { IProjectContextReader } from "../../project/query/IProjectContextReader.js";
import { IAudienceContextReader } from "../../audiences/query/IAudienceContextReader.js";
import { IAudiencePainContextReader } from "../../audience-pains/query/IAudiencePainContextReader.js";
import { UnprimedBrownfieldQualifier } from "../../../application/UnprimedBrownfieldQualifier.js";

/**
 * SessionStartContextQueryHandler - Composes base context query with start-specific enrichment
 *
 * Uses SessionContextQueryHandler for reusable base context assembly,
 * then applies SessionStartContextEnricher for start-specific orientation.
 */
export class SessionStartContextQueryHandler {
  private readonly sessionContextQueryHandler: SessionContextQueryHandler;
  private readonly enricher: SessionStartContextEnricher;

  constructor(
    sessionSummaryReader: ISessionSummaryReader,
    goalStatusReader: IGoalStatusReader,
    projectContextReader?: IProjectContextReader,
    audienceContextReader?: IAudienceContextReader,
    audiencePainContextReader?: IAudiencePainContextReader,
    unprimedBrownfieldQualifier?: UnprimedBrownfieldQualifier
  ) {
    this.sessionContextQueryHandler = new SessionContextQueryHandler(
      sessionSummaryReader,
      goalStatusReader,
      projectContextReader,
      audienceContextReader,
      audiencePainContextReader,
      unprimedBrownfieldQualifier
    );
    this.enricher = new SessionStartContextEnricher();
  }

  /**
   * Execute query to assemble enriched session start context
   *
   * @returns SessionStartContext with base data and start-specific enrichment
   */
  async execute(): Promise<SessionStartContext> {
    const baseContext = await this.sessionContextQueryHandler.execute();
    return this.enricher.enrich(baseContext);
  }
}
