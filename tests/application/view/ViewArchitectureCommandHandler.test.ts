/**
 * Tests for ViewArchitectureCommandHandler
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { ViewArchitectureCommandHandler } from "../../../src/application/context/architecture/view/ViewArchitectureCommandHandler.js";
import { IArchitectureViewer } from "../../../src/application/context/architecture/view/IArchitectureViewer.js";
import { ArchitectureView } from "../../../src/application/context/architecture/ArchitectureView.js";

describe("ViewArchitectureCommandHandler", () => {
  let commandHandler: ViewArchitectureCommandHandler;
  let mockViewer: jest.Mocked<IArchitectureViewer>;

  beforeEach(() => {
    mockViewer = {
      view: jest.fn(),
    } as jest.Mocked<IArchitectureViewer>;

    commandHandler = new ViewArchitectureCommandHandler(mockViewer);
  });

  describe("execute", () => {
    it("returns architecture view when available", async () => {
      const architectureView: ArchitectureView = {
        architectureId: "architecture",
        description: "Event-sourced system",
        organization: "Clean Architecture",
        patterns: ["DDD", "CQRS"],
        principles: ["SOLID"],
        dataStores: [
          {
            name: "primary",
            type: "sqlite",
            purpose: "projection store",
          },
        ],
        stack: ["TypeScript", "Node.js"],
        version: 2,
        createdAt: "2025-01-01T10:00:00Z",
        updatedAt: "2025-01-02T10:00:00Z",
      };

      mockViewer.view.mockResolvedValue(architectureView);

      const result = await commandHandler.execute();

      expect(result).toEqual(architectureView);
      expect(mockViewer.view).toHaveBeenCalledTimes(1);
    });

    it("returns null when no architecture is defined", async () => {
      mockViewer.view.mockResolvedValue(null);

      const result = await commandHandler.execute();

      expect(result).toBeNull();
      expect(mockViewer.view).toHaveBeenCalledTimes(1);
    });
  });
});
