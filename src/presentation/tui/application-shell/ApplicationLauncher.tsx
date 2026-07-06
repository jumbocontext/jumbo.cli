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

const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;
const SIGNAL_EXIT_CODES: Record<(typeof SHUTDOWN_SIGNALS)[number], number> = {
  SIGINT: 130,
  SIGTERM: 143,
  SIGHUP: 129,
};

type ShutdownReason =
  | "ink-exit"
  | "launch-failure"
  | "beforeExit"
  | `signal:${(typeof SHUTDOWN_SIGNALS)[number]}`;

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
    const subprocessManager = this.subprocessManagerFactory?.(
      this.container?.logger,
    );
    const shutdown = new LauncherSubprocessShutdown(
      subprocessManager,
      this.container?.logger,
    );
    let pendingError: unknown;

    shutdown.install();

    try {
      try {
        const application = render(
          <App
            version={this.version}
            directoryPath={this.directoryPath}
            stateReaderControllers={this.buildStateReaderControllers()}
            actionControllers={this.buildActionControllers()}
            onProjectInitialized={this.fallbackStateReaderControllerFactory}
            subprocessManager={subprocessManager}
            settingsReader={this.container?.settingsReader}
            cliUpdateController={
              this.cliUpdateController ?? this.container?.cliUpdateController
            }
          />,
        );

        try {
          await application.waitUntilExit();
        } catch (error) {
          pendingError = error;
        } finally {
          pendingError = this.combineShutdownError(
            pendingError,
            await shutdown.cleanup("ink-exit"),
          );
        }
      } catch (error) {
        pendingError = this.combineShutdownError(
          pendingError === undefined ? error : pendingError,
          await shutdown.cleanup("launch-failure"),
        );
      }
    } finally {
      shutdown.uninstall();
    }

    if (pendingError !== undefined) {
      throw pendingError;
    }
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

  private combineShutdownError(
    primaryError: unknown,
    cleanupError: unknown,
  ): unknown {
    if (cleanupError === undefined) {
      return primaryError;
    }

    if (primaryError === undefined) {
      return cleanupError;
    }

    const combinedError = new Error(
      "Application launcher failed during TUI exit and daemon subprocess cleanup.",
    ) as Error & { readonly errors: readonly unknown[] };
    Object.defineProperty(combinedError, "errors", {
      value: [primaryError, cleanupError],
      enumerable: true,
    });

    return combinedError;
  }
}

class LauncherSubprocessShutdown {
  private cleanupPromise: Promise<unknown | undefined> | undefined;
  private installed = false;

  private readonly signalHandlers = new Map<
    (typeof SHUTDOWN_SIGNALS)[number],
    () => void
  >();

  private readonly beforeExitHandler = (): void => {
    void this.cleanup("beforeExit").finally(() => {
      this.uninstall();
    });
  };

  constructor(
    private readonly subprocessManager: ISubprocessManager | undefined,
    private readonly logger: ILogger | undefined,
  ) {}

  install(): void {
    if (this.subprocessManager === undefined || this.installed) {
      return;
    }

    process.on("beforeExit", this.beforeExitHandler);

    for (const signal of SHUTDOWN_SIGNALS) {
      const handler = (): void => {
        void this.cleanup(`signal:${signal}`).finally(() => {
          this.uninstall();
          process.exit(SIGNAL_EXIT_CODES[signal]);
        });
      };
      this.signalHandlers.set(signal, handler);
      process.on(signal, handler);
    }

    this.installed = true;
  }

  uninstall(): void {
    if (!this.installed) {
      return;
    }

    process.off("beforeExit", this.beforeExitHandler);

    for (const [signal, handler] of this.signalHandlers.entries()) {
      process.off(signal, handler);
    }

    this.signalHandlers.clear();
    this.installed = false;
  }

  async cleanup(reason: ShutdownReason): Promise<unknown | undefined> {
    if (this.subprocessManager === undefined) {
      return undefined;
    }

    this.cleanupPromise ??= this.terminateAll(reason);

    return this.cleanupPromise;
  }

  private async terminateAll(reason: ShutdownReason): Promise<unknown | undefined> {
    this.logger?.info("TUI daemon subprocess shutdown requested", { reason });

    try {
      await this.subprocessManager?.terminateAll();
      this.logger?.info("TUI daemon subprocess shutdown completed", { reason });
      return undefined;
    } catch (error) {
      this.logger?.error(
        "TUI daemon subprocess shutdown failed",
        error,
        { reason },
      );
      return error;
    }
  }
}
