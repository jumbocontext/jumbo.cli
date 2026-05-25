import { describe, expect, it } from "@jest/globals";
import { dispatchTuiAction } from "../../../../src/presentation/tui/action-dispatch/TuiActionDispatcher.js";

describe("dispatchTuiAction", () => {
  it("returns controller responses", async () => {
    const controller = {
      handle: async (request: { value: string }) => ({
        echoed: request.value,
      }),
    };

    await expect(
      dispatchTuiAction(controller, { value: "request" }),
    ).resolves.toEqual({
      ok: true,
      response: { echoed: "request" },
    });
  });

  it("returns controller errors without throwing", async () => {
    const controller = {
      handle: async () => {
        throw new Error("Request failed");
      },
    };

    const result = await dispatchTuiAction(controller, {});

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("Request failed");
    }
  });
});
