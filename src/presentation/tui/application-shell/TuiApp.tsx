import React, { useState, useEffect, useCallback } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./Header.js";
import { Footer } from "./Footer.js";
import { ScreenRouter } from "../navigation/ScreenRouter.js";
import { InitFlow } from "../project-initialization/InitFlow.js";
import type { InitFlowActionControllers } from "../project-initialization/InitFlow.js";
import { GoalAuthoringFlow } from "../goals/GoalAuthoringFlow.js";
import type { GoalAuthoringValues } from "../goals/GoalAuthoringFlow.js";
import { DEFAULT_SCREEN_INDEX } from "../navigation/ScreenDefinitions.js";
import { TuiActionDispatcher } from "../action-dispatch/TuiActionDispatcher.js";
import type { TuiRequestController } from "../action-dispatch/TuiRequestController.js";
import {
  TuiStateReaderProvider,
  useProjectContext,
  type TuiStateReaderControllers,
  type TuiStateReaderOptions,
} from "../state-reading/TuiStateReader.js";
import { SubprocessManagerProvider } from "../daemon-subprocesses/SubprocessManagerProvider.js";
import { useSubprocessManager } from "../daemon-subprocesses/useSubprocessManager.js";
import type { ISubprocessManager, TuiSubprocessSnapshot } from "../daemon-subprocesses/ISubprocessManager.js";
import type { NotificationDrawerNotification } from "./NotificationDrawer.js";
import type { AddGoalRequest } from "../../../application/context/goals/add/AddGoalRequest.js";
import type { AddGoalResponse } from "../../../application/context/goals/add/AddGoalResponse.js";
import type { ProjectLifecycleState } from "../../../application/context/project/ProjectLifecycleState.js";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";
import { ProjectLifecycle } from "../../../domain/project/Constants.js";
import { TuiSubprocessStatus } from "../daemon-subprocesses/TuiSubprocessStatus.js";
import {
  TERMINAL_RESIZE_EVENT,
  TUI_FRAME_CHROME_ROWS,
  TuiAppCopy,
  TuiAppShortcut,
} from "./TuiAppConstants.js";

const COCKPIT_FOOTER_SHORTCUTS = [
  TuiAppShortcut.TOGGLE_WORKER,
  TuiAppShortcut.CREATE_GOAL,
] as const;

function useTerminalDimensions(): { columns: number; rows: number } {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState({
    columns: stdout.columns ?? 80,
    rows: stdout.rows ?? 24,
  });

  useEffect(() => {
    const onResize = () => {
      setDimensions({
        columns: stdout.columns ?? 80,
        rows: stdout.rows ?? 24,
      });
    };
    stdout.on(TERMINAL_RESIZE_EVENT, onResize);
    return () => {
      stdout.off(TERMINAL_RESIZE_EVENT, onResize);
    };
  }, [stdout]);

  return dimensions;
}

interface TuiAppProps {
  readonly version?: string;
  readonly directoryPath?: string;
  readonly stateReaderControllers?: TuiStateReaderControllers;
  readonly stateReaderOptions?: TuiStateReaderOptions;
  readonly actionControllers?: TuiAppActionControllers;
  readonly onProjectInitialized?: () => Promise<TuiStateReaderControllers>;
  readonly subprocessManager?: ISubprocessManager;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
  readonly launchAnimationEnabled?: boolean;
}

export interface TuiAppActionControllers extends InitFlowActionControllers {
  readonly addGoalController?: TuiRequestController<
    AddGoalRequest,
    AddGoalResponse
  >;
}

export function TuiApp({
  version = "",
  directoryPath = "",
  stateReaderControllers,
  stateReaderOptions,
  actionControllers,
  onProjectInitialized,
  subprocessManager,
  settingsReader,
  launchAnimationEnabled = true,
}: TuiAppProps = {}): React.ReactElement {
  const [activeStateReaderControllers, setActiveStateReaderControllers] =
    useState(stateReaderControllers);

  const handleProjectInitialized = useCallback(async (): Promise<boolean> => {
    if (onProjectInitialized === undefined) {
      return false;
    }

    setActiveStateReaderControllers(await onProjectInitialized());
    return true;
  }, [onProjectInitialized]);

  const activeSubprocessManager = subprocessManager;

  return (
    <TuiStateReaderProvider
      controllers={activeStateReaderControllers}
      options={stateReaderOptions}
    >
      {activeSubprocessManager === undefined ? (
        <TuiAppFrame
          version={version}
          directoryPath={directoryPath}
          actionControllers={actionControllers}
          onProjectInitialized={handleProjectInitialized}
          subprocessManagerEnabled={false}
          settingsReader={settingsReader}
          launchAnimationEnabled={launchAnimationEnabled}
        />
      ) : (
        <SubprocessManagerProvider manager={activeSubprocessManager}>
          <TuiAppFrame
            version={version}
            directoryPath={directoryPath}
            actionControllers={actionControllers}
            onProjectInitialized={handleProjectInitialized}
            subprocessManagerEnabled={true}
            settingsReader={settingsReader}
            launchAnimationEnabled={launchAnimationEnabled}
          />
        </SubprocessManagerProvider>
      )}
    </TuiStateReaderProvider>
  );
}

interface TuiAppFrameProps {
  readonly version: string;
  readonly directoryPath: string;
  readonly actionControllers?: TuiAppActionControllers;
  readonly onProjectInitialized: () => Promise<boolean>;
  readonly subprocessManagerEnabled: boolean;
  readonly settingsReader?: Pick<ISettingsReader, "read" | "write">;
  readonly launchAnimationEnabled: boolean;
}

function TuiAppFrame({
  version,
  directoryPath,
  actionControllers,
  onProjectInitialized,
  subprocessManagerEnabled,
  settingsReader,
  launchAnimationEnabled,
}: TuiAppFrameProps): React.ReactElement {
  const { exit } = useApp();
  const subprocessManager = useSubprocessManager();
  const { columns, rows } = useTerminalDimensions();
  const projectContext = useProjectContext();
  const [activeScreenIndex, setActiveScreenIndex] = useState(
    DEFAULT_SCREEN_INDEX,
  );
  const [initFlowOpen, setInitFlowOpen] = useState(false);
  const [goalAuthoringOpen, setGoalAuthoringOpen] = useState(false);
  const [goalAuthoringError, setGoalAuthoringError] = useState<string | null>(null);
  const [goalAuthoringWorking, setGoalAuthoringWorking] = useState(false);
  const [lifecycleRouteOverride, setLifecycleRouteOverride] =
    useState<ProjectLifecycleState | null>(null);
  const [unprimedSkipped, setUnprimedSkipped] = useState(false);
  const [bannerAnimationComplete, setBannerAnimationComplete] = useState(
    !launchAnimationEnabled,
  );
  const [billboardAnimationComplete, setBillboardAnimationComplete] = useState(
    !launchAnimationEnabled,
  );
  const [daemonStatuses, setDaemonStatuses] = useState<readonly TuiSubprocessSnapshot[]>(
    subprocessManager.getAllStatuses(),
  );
  const projectLifecycleState =
    projectContext.data?.lifecycleState ?? ProjectLifecycle.UNINITIALIZED;
  const routedProjectLifecycleState =
    lifecycleRouteOverride ??
    (projectLifecycleState === ProjectLifecycle.UNPRIMED && unprimedSkipped
      ? ProjectLifecycle.PRIMED_EMPTY
      : projectLifecycleState);
  const initShortcutEnabled =
    !projectContext.loading &&
    projectLifecycleState === ProjectLifecycle.UNINITIALIZED;
  const frameShortcutsEnabled =
    !initFlowOpen && !goalAuthoringOpen;
  const cockpitLaunchpadVisible =
    !initFlowOpen &&
    !goalAuthoringOpen &&
    activeScreenIndex === DEFAULT_SCREEN_INDEX &&
    routedProjectLifecycleState === ProjectLifecycle.PRIMED;
  const goalAuthoringShortcutEnabled =
    !projectContext.loading &&
    activeScreenIndex === DEFAULT_SCREEN_INDEX &&
    (routedProjectLifecycleState === ProjectLifecycle.PRIMED_EMPTY ||
      cockpitLaunchpadVisible);

  useEffect(() => {
    if (projectLifecycleState !== ProjectLifecycle.UNPRIMED) {
      setUnprimedSkipped(false);
    }
  }, [projectLifecycleState]);

  useEffect(() => {
    if (!launchAnimationEnabled) {
      setBannerAnimationComplete(true);
      setBillboardAnimationComplete(true);
    }
  }, [launchAnimationEnabled]);

  useEffect(() => {
    if (
      lifecycleRouteOverride !== null &&
      projectLifecycleState === lifecycleRouteOverride
    ) {
      setLifecycleRouteOverride(null);
    }
  }, [lifecycleRouteOverride, projectLifecycleState]);

  useEffect(() => {
    if (!subprocessManagerEnabled) {
      return;
    }

    const timer = setInterval(() => {
      setDaemonStatuses(subprocessManager.getAllStatuses());
    }, 500);

    return () => {
      clearInterval(timer);
      void subprocessManager.terminateAll();
    };
  }, [subprocessManager, subprocessManagerEnabled]);

  useInput((input) => {
    if (initFlowOpen || goalAuthoringOpen) {
      return;
    }
    if (input === "q") {
      exit();
    }
    // MegaMenu is preserved for iteration but hidden from production users.
    // if (input === "m" || input === "M") {
    //   setMegaMenuOpen(true);
    // }
    if (initShortcutEnabled && (input === "i" || input === "I")) {
      setInitFlowOpen(true);
    }
    if (goalAuthoringShortcutEnabled && (input === "g" || input === "G")) {
      setGoalAuthoringError(null);
      setGoalAuthoringOpen(true);
    }
    if (
      activeScreenIndex === DEFAULT_SCREEN_INDEX &&
      projectLifecycleState === ProjectLifecycle.UNPRIMED &&
      (input === "s" || input === "S")
    ) {
      setUnprimedSkipped(true);
    }
  });

  const completeStateChangingOverlay = useCallback(
    async (
      closeOverlay: () => void,
      options: {
        readonly lifecycleRouteOverride?: ProjectLifecycleState;
        readonly reinstallStateReaders?: boolean;
      } = {},
    ) => {
      if (options.lifecycleRouteOverride !== undefined) {
        setLifecycleRouteOverride(options.lifecycleRouteOverride);
        setActiveScreenIndex(DEFAULT_SCREEN_INDEX);
      }

      if (options.reinstallStateReaders) {
        const installedStateReaders = await onProjectInitialized();
        if (!installedStateReaders) {
          await projectContext.refresh();
        }
      } else {
        await projectContext.refresh();
      }

      closeOverlay();
    },
    [onProjectInitialized, projectContext],
  );

  const handleInitComplete = useCallback(
    async (_values: Record<string, string>) => {
      await completeStateChangingOverlay(
        () => setInitFlowOpen(false),
        { reinstallStateReaders: true },
      );
    },
    [completeStateChangingOverlay],
  );

  const handleInitCancel = useCallback(() => {
    setInitFlowOpen(false);
  }, []);

  const handleGoalAuthoringComplete = useCallback(
    async (values: GoalAuthoringValues) => {
      const addGoalController = actionControllers?.addGoalController;
      if (addGoalController === undefined) {
        setGoalAuthoringError(TuiAppCopy.goalAuthoringUnavailable);
        return;
      }

      setGoalAuthoringWorking(true);
      setGoalAuthoringError(null);
      const result = await TuiActionDispatcher.dispatch(
        addGoalController,
        toAddGoalRequest(values),
      );
      setGoalAuthoringWorking(false);

      if (!result.ok) {
        setGoalAuthoringError(result.error.message);
        return;
      }

      await completeStateChangingOverlay(
        () => setGoalAuthoringOpen(false),
        { lifecycleRouteOverride: ProjectLifecycle.PRIMED },
      );
    },
    [actionControllers, completeStateChangingOverlay],
  );

  const handleGoalAuthoringCancel = useCallback(() => {
    setGoalAuthoringError(null);
    setGoalAuthoringOpen(false);
  }, []);

  const handleBannerAnimationComplete = useCallback(() => {
    setBannerAnimationComplete(true);
  }, []);

  const handleBillboardAnimationComplete = useCallback(() => {
    setBillboardAnimationComplete(true);
  }, []);

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box flexShrink={0}>
        <Header
          projectName={projectContext.data?.name ?? TuiAppCopy.placeholderProjectName}
          directoryPath={directoryPath}
          version={version}
          terminalWidth={columns}
        />
      </Box>
      <Box flexGrow={1} flexDirection="column" position="relative">
        <Box flexGrow={1} flexDirection="column">
          <ScreenRouter
            activeScreenIndex={activeScreenIndex}
            projectLifecycleState={routedProjectLifecycleState}
            shortcutsEnabled={frameShortcutsEnabled}
            terminalWidth={columns}
            terminalHeight={Math.max(1, rows - TUI_FRAME_CHROME_ROWS)}
            settingsReader={settingsReader}
            launchAnimationEnabled={launchAnimationEnabled}
            bannerAnimationComplete={bannerAnimationComplete}
            billboardAnimationComplete={billboardAnimationComplete}
            onBannerAnimationComplete={handleBannerAnimationComplete}
            onBillboardAnimationComplete={handleBillboardAnimationComplete}
          />
        </Box>
        {initFlowOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <InitFlow
              actionControllers={actionControllers}
              onComplete={handleInitComplete}
              onCancel={handleInitCancel}
            />
          </Box>
        )}
        {goalAuthoringOpen && (
          <Box
            position="absolute"
            width="100%"
            height="100%"
            flexDirection="column"
          >
            <GoalAuthoringFlow
              onComplete={handleGoalAuthoringComplete}
              onCancel={handleGoalAuthoringCancel}
              dispatchError={goalAuthoringError}
              disabled={goalAuthoringWorking}
            />
          </Box>
        )}
      </Box>
      <Box flexShrink={0}>
        <Footer
          terminalWidth={columns}
          shortcutsEnabled={frameShortcutsEnabled}
          contextualShortcuts={cockpitLaunchpadVisible ? COCKPIT_FOOTER_SHORTCUTS : []}
          notifications={buildDaemonFailureNotifications(daemonStatuses)}
        />
      </Box>
    </Box>
  );
}

function toAddGoalRequest(values: GoalAuthoringValues): AddGoalRequest {
  return {
    title: values.title,
    objective: values.objective,
    successCriteria: [...values.successCriteria],
    scopeIn: optionalList(values.scopeIn),
    scopeOut: optionalList(values.scopeOut),
    nextGoalId: optionalText(values.nextGoal),
    previousGoalId: optionalText(values.previousGoal),
    prerequisiteGoals: optionalList(values.prerequisiteGoals),
    branch: optionalText(values.branch),
    worktree: optionalText(values.worktree),
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalList(value: string): string[] | undefined {
  const values = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return values.length > 0 ? values : undefined;
}

function buildDaemonFailureNotifications(
  statuses: readonly TuiSubprocessSnapshot[],
): readonly NotificationDrawerNotification[] {
  return statuses
    .filter((status) => status.status === TuiSubprocessStatus.FAILED)
    .map((status) => ({
      id: `daemon-${status.name}-failed`,
      title: `${status.name.toUpperCase()} daemon failed`,
      body: status.stderr[status.stderr.length - 1] ?? TuiAppCopy.daemonFailureBody,
      unread: true,
    }));
}
