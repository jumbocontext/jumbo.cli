import { jest, describe, expect, it, afterEach } from "@jest/globals";
import { TuiDaemonOutputEventParser } from "../../../../src/presentation/tui/daemon-subprocesses/TuiDaemonOutputEventParser.js";

describe("TuiDaemonOutputEventParser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("parses structured daemon events and supplies missing timestamps", () => {
    const parser = new TuiDaemonOutputEventParser();
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    expect(parser.parseOutputLine("refiner", "{\"daemon\":\"refiner\",\"status\":\"processing\",\"goalId\":\"goal_123\"}")).toEqual({
      daemon: "refiner",
      status: "processing",
      goalId: "goal_123",
      timestampMs: 1767272400000,
    });
  });

  it("turns plain output into bounded model-output events", () => {
    const parser = new TuiDaemonOutputEventParser();
    const line = `${"x".repeat(3_000)}tail`;
    jest.spyOn(Date, "now").mockReturnValue(1767272400000);

    const event = parser.parseOutputLine("codifier", line);

    expect(event).toEqual({
      daemon: "codifier",
      status: "processing",
      source: "codifier",
      category: "model-output",
      message: expect.stringMatching(/tail$/),
      timestampMs: 1767272400000,
    });
    expect(event.message).toHaveLength(2_048);
  });
});
