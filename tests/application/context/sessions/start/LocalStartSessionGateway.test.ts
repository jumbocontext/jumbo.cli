import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { LocalStartSessionGateway } from "../../../../../src/application/context/sessions/start/LocalStartSessionGateway.js";
import { StartSessionCommandHandler } from "../../../../../src/application/context/sessions/start/StartSessionCommandHandler.js";
import { IBrownfieldStatusReader } from "../../../../../src/application/context/sessions/start/IBrownfieldStatusReader.js";

describe("LocalStartSessionGateway", () => {
  let startSessionCommandHandler: jest.Mocked<StartSessionCommandHandler>;
  let brownfieldStatusReader: jest.Mocked<IBrownfieldStatusReader>;
  let gateway: LocalStartSessionGateway;

  beforeEach(() => {
    startSessionCommandHandler = {
      execute: jest.fn().mockResolvedValue({ sessionId: "session_test-123" }),
    } as unknown as jest.Mocked<StartSessionCommandHandler>;

    brownfieldStatusReader = {
      isUnprimed: jest.fn().mockResolvedValue(false),
    } as jest.Mocked<IBrownfieldStatusReader>;

    gateway = new LocalStartSessionGateway(
      startSessionCommandHandler,
      brownfieldStatusReader
    );
  });

  it("should start a session and return router state", async () => {
    const result = await gateway.startSession({});

    expect(result).toEqual({
      sessionId: "session_test-123",
      status: "active",
      isUnprimedBrownfield: false,
    });
    expect(startSessionCommandHandler.execute).toHaveBeenCalledWith({});
  });

  it("should check brownfield status via qualifier", async () => {
    await gateway.startSession({});

    expect(brownfieldStatusReader.isUnprimed).toHaveBeenCalledTimes(1);
  });

  it("should preserve unprimed brownfield signal", async () => {
    brownfieldStatusReader.isUnprimed.mockResolvedValue(true);

    const result = await gateway.startSession({});

    expect(result.isUnprimedBrownfield).toBe(true);
  });
});
