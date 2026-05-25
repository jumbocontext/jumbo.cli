import React from "react";
import { render } from "ink";
import type { IApplicationContainer } from "../../../application/host/IApplicationContainer.js";
import type { ILogger } from "../../../application/logging/ILogger.js";
import { GetProjectSummaryQueryHandler } from "../../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import { TuiApp } from "./TuiApp.js";
import type { TuiAppActionControllers } from "./TuiApp.js";
import type { TuiStateReaderControllers } from "../state-reading/TuiStateReader.js";
import type { ISubprocessManager } from "../daemon-subprocesses/ISubprocessManager.js";

export type TuiSubprocessManagerFactory = (logger?: ILogger) => ISubprocessManager;

export class TuiApplicationLauncher {
  constructor(
    private readonly version: string,
    private readonly container: IApplicationContainer | null,
    private readonly fallbackActionControllers: TuiAppActionControllers = {},
    private readonly fallbackStateReaderControllerFactory?: () => Promise<TuiStateReaderControllers>,
    private readonly subprocessManagerFactory?: TuiSubprocessManagerFactory,
    private readonly directoryPath: string = process.cwd(),
  ) {}

  async launch(): Promise<void> {
    const application = render(
      <TuiApp
        version={this.version}
        directoryPath={this.directoryPath}
        stateReaderControllers={this.buildStateReaderControllers()}
        actionControllers={this.buildActionControllers()}
        onProjectInitialized={this.fallbackStateReaderControllerFactory}
        subprocessManager={this.subprocessManagerFactory?.(this.container?.logger)}
        settingsReader={this.container?.settingsReader}
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

  private buildActionControllers(): TuiAppActionControllers {
    if (this.container === null) {
      return this.fallbackActionControllers;
    }

    return {
      planProjectInitController: this.container.planProjectInitController,
      initializeProjectController: this.container.initializeProjectController,
      addAudienceController: this.container.addAudienceController,
      addValuePropositionController:
        this.container.addValuePropositionController,
      addGoalController: this.container.addGoalController,
    };
  }
}
