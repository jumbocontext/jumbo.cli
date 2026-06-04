import { useCallback, useEffect, useState } from "react";
import type { ISettingsReader } from "../../../application/settings/ISettingsReader.js";

export function useCockpitLaunchpadWelcomeVisibility(
  settingsReader: Pick<ISettingsReader, "read" | "write"> | undefined,
): {
  readonly welcomeVisible: boolean | undefined;
  readonly hideWelcome: () => Promise<void>;
} {
  const [welcomeVisible, setWelcomeVisible] = useState<boolean | undefined>(
    settingsReader === undefined ? true : undefined,
  );

  useEffect(() => {
    let mounted = true;

    if (settingsReader === undefined) {
      setWelcomeVisible(true);
      return () => {
        mounted = false;
      };
    }

    setWelcomeVisible(undefined);
    void settingsReader
      .read()
      .then((settings) => {
        if (mounted) {
          setWelcomeVisible(settings.tui?.showLaunchpadWelcome ?? true);
        }
      })
      .catch(() => {
        if (mounted) {
          setWelcomeVisible(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [settingsReader]);

  const hideWelcome = useCallback(async () => {
    setWelcomeVisible(false);

    if (settingsReader === undefined) {
      return;
    }

    try {
      const settings = await settingsReader.read();
      await settingsReader.write({
        ...settings,
        tui: {
          ...settings.tui,
          showLaunchpadWelcome: false,
        },
      });
    } catch {
      // Keep the in-memory dismissal even if persistence is unavailable.
    }
  }, [settingsReader]);

  return { welcomeVisible, hideWelcome };
}
