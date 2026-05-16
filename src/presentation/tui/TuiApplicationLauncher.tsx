import React from "react";
import { render } from "ink";
import type { IApplicationContainer } from "../../application/host/IApplicationContainer.js";
import { GetProjectSummaryQueryHandler } from "../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import { TuiApp } from "./TuiApp.js";
import type { TuiStateReaderControllers } from "./state/TuiStateReader.js";
import type { InitFlowActionControllers } from "./flows/InitFlow.js";

export class TuiApplicationLauncher {
  constructor(
    private readonly version: string,
    private readonly container: IApplicationContainer | null,
  ) {}

  async launch(): Promise<void> {
    const application = render(
      <TuiApp
        version={this.version}
        stateReaderControllers={this.buildStateReaderControllers()}
        actionControllers={this.buildActionControllers()}
      />,
    );

    await application.waitUntilExit();
  }

  private buildStateReaderControllers(): TuiStateReaderControllers {
    if (this.container === null) {
      return {};
    }

    return {
      getProjectSummaryQueryHandler: new GetProjectSummaryQueryHandler(
        this.container.projectContextReader,
      ),
      getGoalsController: this.container.getGoalsController,
      getSessionsController: this.container.getSessionsController,
      getComponentsController: this.container.getComponentsController,
      getDecisionsController: this.container.getDecisionsController,
      getDependenciesController: this.container.getDependenciesController,
      getGuidelinesController: this.container.getGuidelinesController,
      getInvariantsController: this.container.getInvariantsController,
    };
  }

  private buildActionControllers(): InitFlowActionControllers {
    if (this.container === null) {
      return {};
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
