import React, { useState, useEffect } from "react";
import { Box, useApp, useInput, useStdout } from "ink";
import { Header } from "./components/Header.js";
import { Footer } from "./components/Footer.js";
import { MegaMenu } from "./components/MegaMenu.js";
import { ScreenRouter } from "./ScreenRouter.js";
import { DEFAULT_SCREEN_INDEX } from "./ScreenDefinitions.js";

const PLACEHOLDER_PROJECT_NAME = "Jumbo";
const PLACEHOLDER_VERSION = "0.0.0";

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

export function TuiApp(): React.ReactElement {
  const { exit } = useApp();
  const { columns, rows } = useTerminalDimensions();
  const [activeScreenIndex, setActiveScreenIndex] = useState(
    DEFAULT_SCREEN_INDEX,
  );
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);

  useInput((input) => {
    if (megaMenuOpen) {
      return;
    }
    if (input === "q") {
      exit();
    }
    if (input === "m" || input === "M") {
      setMegaMenuOpen(true);
    }
  });

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
          projectName={PLACEHOLDER_PROJECT_NAME}
          version={PLACEHOLDER_VERSION}
          terminalWidth={columns}
        />
      </Box>
      <Box flexGrow={1} flexDirection="column">
        {megaMenuOpen ? (
          <MegaMenu
            activeScreenIndex={activeScreenIndex}
            onScreenSelect={handleScreenSelect}
            onClose={handleMegaMenuClose}
            terminalWidth={columns}
          />
        ) : (
          <ScreenRouter activeScreenIndex={activeScreenIndex} />
        )}
      </Box>
      <Box flexShrink={0}>
        <Footer terminalWidth={columns} />
      </Box>
    </Box>
  );
}
