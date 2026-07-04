import React from "react";
import { render } from "ink";
import type { IApplicationContainer } from "../../../application/host/IApplicationContainer.js";
import type { ILogger } from "../../../application/logging/ILogger.js";
import { GetProjectSummaryQueryHandler } from "../../../application/context/project/query/GetProjectSummaryQueryHandler.js";
import type { CliUpdateController } from "../../../application/cli-metadata/update/CliUpdateController.js";
import { App } from "./App.js";
import type { AppActionControllers } from "./App.js";
import type { StateReaderControllers } from "../state-reading/StateReaderControllers.js";
import type { ISubprocessManager } from "../daemon-subprocesses/ISubprocessManager.js";

export type SubprocessManagerFactory = (logger?: ILogger) => ISubprocessManager;

export class ApplicationLauncher {
  constructor(
    private readonly version: string,
    private readonly container: IApplicationContainer | null,
    private readonly fallbackActionControllers: AppActionControllers = {},
    private readonly fallbackStateReaderControllerFactory?: () => Promise<StateReaderControllers>,
    private readonly subprocessManagerFactory?: SubprocessManagerFactory,
    private readonly directoryPath: string = process.cwd(),
    private readonly cliUpdateController?: Pick<CliUpdateController, "check" | "upgrade">,
  ) {}

  async launch(): Promise<void> {
    const application = render(
      <App
        version={this.version}
        directoryPath={this.directoryPath}
        stateReaderControllers={this.buildStateReaderControllers()}
        actionControllers={this.buildActionControllers()}
        onProjectInitialized={this.fallbackStateReaderControllerFactory}
        subprocessManager={this.subprocessManagerFactory?.(this.container?.logger)}
        settingsReader={this.container?.settingsReader}
        cliUpdateController={
          this.cliUpdateController ?? this.container?.cliUpdateController
        }
      />,
    );

    await application.waitUntilExit();
  }

  private buildStateReaderControllers(
    container: IApplicationContainer | null = this.container,
  ): StateReaderControllers {
    if (container === null) {
      return {};
    }

    return {
      getProjectSummaryQueryHandler: new GetProjectSummaryQueryHandler(
        container.projectContextReader,
      ),
      getGoalsController: container.getGoalsController,
      showGoalController: container.showGoalController,
      getSessionsController: container.getSessionsController,
      getComponentsController: container.getComponentsController,
      getDecisionsController: container.getDecisionsController,
      getDependenciesController: container.getDependenciesController,
      getGuidelinesController: container.getGuidelinesController,
      getInvariantsController: container.getInvariantsController,
      projectStatsController: container.projectStatsController,
      searchController: container.searchController,
    };
  }

  private buildActionControllers(): AppActionControllers {
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
