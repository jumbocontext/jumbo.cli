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
}

export function TuiApp({
  version = "",
  stateReaderControllers,
  stateReaderOptions,
  actionControllers,
}: TuiAppProps = {}): React.ReactElement {
  return (
    <TuiStateReaderProvider
      controllers={stateReaderControllers}
      options={stateReaderOptions}
    >
      <TuiAppFrame
        version={version}
        actionControllers={actionControllers}
      />
    </TuiStateReaderProvider>
  );
}

interface TuiAppFrameProps {
  readonly version: string;
  readonly actionControllers?: InitFlowActionControllers;
}

function TuiAppFrame({
  version,
  actionControllers,
}: TuiAppFrameProps): React.ReactElement {
  const { exit } = useApp();
  const { columns, rows } = useTerminalDimensions();
  const projectContext = useProjectContext();
  const [activeScreenIndex, setActiveScreenIndex] = useState(
    DEFAULT_SCREEN_INDEX,
  );
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [initFlowOpen, setInitFlowOpen] = useState(false);

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
    if (input === "i" || input === "I") {
      setInitFlowOpen(true);
    }
  });

  const handleInitComplete = useCallback(
    async (_values: Record<string, string>) => {
      await projectContext.refresh();
      setInitFlowOpen(false);
    },
    [projectContext],
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
              projectLifecycleState={
                projectContext.data?.lifecycleState ?? "uninitialized"
              }
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
        />
      </Box>
    </Box>
  );
}
