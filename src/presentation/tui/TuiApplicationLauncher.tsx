import React from "react";
import { render } from "ink";
import type { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { GetProjectSummaryQueryHandler } from "../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import { TuiApp } from "./TuiApp.js";
import type { TuiStateReaderControllers } from "./state/TuiStateReader.js";
import type { InitFlowActionControllers } from "./flows/InitFlow.js";
import { TuiSubprocessManager } from "./subprocess/TuiSubprocessManager.js";

export class TuiApplicationLauncher {
  constructor(
    private readonly version: string,
    private readonly container: IApplicationContainer | null,
    private readonly fallbackActionControllers: InitFlowActionControllers = {},
    private readonly fallbackStateReaderControllerFactory?: () => Promise<TuiStateReaderControllers>,
  ) {}

  async launch(): Promise<void> {
    const application = render(
      <TuiApp
        version={this.version}
        stateReaderControllers={this.buildStateReaderControllers()}
        actionControllers={this.buildActionControllers()}
        onProjectInitialized={this.fallbackStateReaderControllerFactory}
        subprocessManager={new TuiSubprocessManager(this.container?.logger)}
      />,
    );

    await application.waitUntilExit();
  }

  private buildStateReaderControllers(
    container: IApplicationContainer | null = this.container,
  ): TuiStateReaderControllers {
    if (container === null) {
      return {};
    }

    return {
      getProjectSummaryQueryHandler: new GetProjectSummaryQueryHandler(
        container.projectContextReader,
      ),
      getGoalsController: container.getGoalsController,
      getSessionsController: container.getSessionsController,
      getComponentsController: container.getComponentsController,
      getDecisionsController: container.getDecisionsController,
      getDependenciesController: container.getDependenciesController,
      getGuidelinesController: container.getGuidelinesController,
      getInvariantsController: container.getInvariantsController,
    };
  }

  private buildActionControllers(): InitFlowActionControllers {
    if (this.container === null) {
      return this.fallbackActionControllers;
    }

    return {
      planProjectInitController: this.container.planProjectInitController,
      initializeProjectController: this.container.initializeProjectController,
      addAudienceController: this.container.addAudienceController,
      addValuePropositionController:
        this.container.addValuePropositionController,
    };
  }
}
