import React, { useState, useEffect, useCallback } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./components/Header.js";
import { Footer } from "./components/Footer.js";
import { MegaMenu } from "./components/MegaMenu.js";
import { ScreenRouter } from "./ScreenRouter.js";
import { InitFlow } from "./flows/InitFlow.js";
import type { InitFlowActionControllers } from "./flows/InitFlow.js";
import { DEFAULT_SCREEN_INDEX } from "./ScreenDefinitions.js";
import {
  TuiStateReaderProvider,
  useProjectContext,
  type TuiStateReaderControllers,
  type TuiStateReaderOptions,
} from "./state/TuiStateReader.js";
import { SubprocessManagerProvider, useSubprocessManager } from "./subprocess/SubprocessManagerContext.js";
import type { ISubprocessManager, TuiSubprocessSnapshot } from "./subprocess/ISubprocessManager.js";
import type { NotificationDrawerNotification } from "./components/NotificationDrawer.js";

const PLACEHOLDER_PROJECT_NAME = "Jumbo";

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
    stdout.on("resize", onResize);
    return () => {
      stdout.off("resize", onResize);
    };
  }, [stdout]);

  return dimensions;
}

interface TuiAppProps {
  readonly version?: string;
  readonly stateReaderControllers?: TuiStateReaderControllers;
  readonly stateReaderOptions?: TuiStateReaderOptions;
  readonly actionControllers?: InitFlowActionControllers;
  readonly onProjectInitialized?: () => Promise<TuiStateReaderControllers>;
  readonly subprocessManager?: ISubprocessManager;
}

export function TuiApp({
  version = "",
  stateReaderControllers,
  stateReaderOptions,
  actionControllers,
  onProjectInitialized,
  subprocessManager,
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
          actionControllers={actionControllers}
          onProjectInitialized={handleProjectInitialized}
          subprocessManagerEnabled={false}
        />
      ) : (
        <SubprocessManagerProvider manager={activeSubprocessManager}>
          <TuiAppFrame
            version={version}
            actionControllers={actionControllers}
            onProjectInitialized={handleProjectInitialized}
            subprocessManagerEnabled={true}
          />
        </SubprocessManagerProvider>
      )}
    </TuiStateReaderProvider>
  );
}

interface TuiAppFrameProps {
  readonly version: string;
  readonly actionControllers?: InitFlowActionControllers;
  readonly onProjectInitialized: () => Promise<boolean>;
  readonly subprocessManagerEnabled: boolean;
}

function TuiAppFrame({
  version,
  actionControllers,
  onProjectInitialized,
  subprocessManagerEnabled,
}: TuiAppFrameProps): React.ReactElement {
  const { exit } = useApp();
  const subprocessManager = useSubprocessManager();
  const { columns, rows } = useTerminalDimensions();
  const projectContext = useProjectContext();
  const [activeScreenIndex, setActiveScreenIndex] = useState(
    DEFAULT_SCREEN_INDEX,
  );
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [initFlowOpen, setInitFlowOpen] = useState(false);
  const [unprimedSkipped, setUnprimedSkipped] = useState(false);
  const [daemonStatuses, setDaemonStatuses] = useState<readonly TuiSubprocessSnapshot[]>(
    subprocessManager.getAllStatuses(),
  );
  const projectLifecycleState =
    projectContext.data?.lifecycleState ?? "uninitialized";
  const routedProjectLifecycleState =
    projectLifecycleState === "unprimed" && unprimedSkipped
      ? "primed-empty"
      : projectLifecycleState;
  const initShortcutEnabled =
    !projectContext.loading && projectLifecycleState === "uninitialized";

  useEffect(() => {
    if (projectLifecycleState !== "unprimed") {
      setUnprimedSkipped(false);
    }
  }, [projectLifecycleState]);

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
    if (megaMenuOpen || initFlowOpen) {
      return;
    }
    if (input === "q") {
      exit();
    }
    if (input === "m" || input === "M") {
      setMegaMenuOpen(true);
    }
    if (initShortcutEnabled && (input === "i" || input === "I")) {
      setInitFlowOpen(true);
    }
    if (
      activeScreenIndex === DEFAULT_SCREEN_INDEX &&
      projectLifecycleState === "unprimed" &&
      (input === "s" || input === "S")
    ) {
      setUnprimedSkipped(true);
    }
  });

  const handleInitComplete = useCallback(
    async (_values: Record<string, string>) => {
      const installedStateReaders = await onProjectInitialized();
      if (!installedStateReaders) {
        await projectContext.refresh();
      }
      setInitFlowOpen(false);
    },
    [onProjectInitialized, projectContext],
  );

  const handleInitCancel = useCallback(() => {
    setInitFlowOpen(false);
  }, []);

  const handleScreenSelect = (index: number) => {
    setActiveScreenIndex(index);
    setMegaMenuOpen(false);
  };

  const handleMegaMenuClose = () => {
    setMegaMenuOpen(false);
  };

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Box flexShrink={0}>
        <Header
          projectName={projectContext.data?.name ?? PLACEHOLDER_PROJECT_NAME}
          version={version}
          terminalWidth={columns}
        />
      </Box>
      <Box flexGrow={1} flexDirection="column" position="relative">
        <Box flexGrow={1} flexDirection="column">
          {megaMenuOpen ? (
            <MegaMenu
              activeScreenIndex={activeScreenIndex}
              onScreenSelect={handleScreenSelect}
              onClose={handleMegaMenuClose}
              terminalWidth={columns}
            />
          ) : (
            <ScreenRouter
              activeScreenIndex={activeScreenIndex}
              projectLifecycleState={routedProjectLifecycleState}
            />
          )}
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
      </Box>
      <Box flexShrink={0}>
        <Footer
          terminalWidth={columns}
          shortcutsEnabled={!megaMenuOpen && !initFlowOpen}
          daemonCounts={countDaemons(daemonStatuses)}
          notifications={buildDaemonFailureNotifications(daemonStatuses)}
        />
      </Box>
    </Box>
  );
}

function countDaemons(statuses: readonly TuiSubprocessSnapshot[]): {
  running: number;
  stopped: number;
  failed: number;
} {
  return {
    running: statuses.filter((status) => status.status === "running").length,
    stopped: statuses.filter((status) => status.status === "stopped").length,
    failed: statuses.filter((status) => status.status === "failed").length,
  };
}

function buildDaemonFailureNotifications(
  statuses: readonly TuiSubprocessSnapshot[],
): readonly NotificationDrawerNotification[] {
  return statuses
    .filter((status) => status.status === "failed")
    .map((status) => ({
      id: `daemon-${status.name}-failed`,
      title: `${status.name.toUpperCase()} daemon failed`,
      body: status.stderr[status.stderr.length - 1] ?? "The daemon process exited with a failure status.",
      unread: true,
    }));
}
