import { describe, it, expect } from "@jest/globals";
import { MigrateDependenciesOutputBuilder } from "../../../../../../src/presentation/cli/commands/maintenance/migrate-dependencies/MigrateDependenciesOutputBuilder.js";
import { MigrateDependenciesResponse } from "../../../../../../src/application/maintenance/migrate-dependencies/MigrateDependenciesResponse.js";

describe("MigrateDependenciesOutputBuilder", () => {
  let builder: MigrateDependenciesOutputBuilder;

  beforeEach(() => {
    builder = new MigrateDependenciesOutputBuilder();
  });

  describe("buildSuccess", () => {
    it("renders nothing-to-migrate message when no legacy dependencies found", () => {
      const response: MigrateDependenciesResponse = {
        converted: [],
        skipped: [],
        totalLegacy: 0,
        dryRun: false,
      };

      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("No legacy component-coupling dependencies found");
      expect(text).toContain("Nothing to migrate");
    });

    it("renders conversion summary with counts", () => {
      const response: MigrateDependenciesResponse = {
        converted: [
          {
            dependencyId: "dep_1",
            relationId: "relation_abc",
            fromEntityId: "UserController",
            toEntityId: "AuthService",
          },
        ],
        skipped: [],
        totalLegacy: 1,
        dryRun: false,
      };

      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("Migration complete");
      expect(text).toContain("Legacy dependencies found:  1");
      expect(text).toContain("Converted to relations:     1");
      expect(text).toContain("Skipped:                    0");
      expect(text).toContain("UserController → AuthService");
      expect(text).toContain("relation_abc");
      expect(text).toContain("jumbo db rebuild --yes");
    });

    it("renders skipped records with reasons", () => {
      const response: MigrateDependenciesResponse = {
        converted: [],
        skipped: [
          { dependencyId: "dep_1", reason: "Already removed" },
          { dependencyId: "dep_2", reason: "Missing consumerId or providerId" },
        ],
        totalLegacy: 2,
        dryRun: false,
      };

      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("All 2 legacy dependencies were skipped");
      expect(text).toContain("dep_1: Already removed");
      expect(text).toContain("dep_2: Missing consumerId or providerId");
    });

    it("renders dry run prefix", () => {
      const response: MigrateDependenciesResponse = {
        converted: [
          {
            dependencyId: "dep_1",
            relationId: "(dry run)",
            fromEntityId: "A",
            toEntityId: "B",
          },
        ],
        skipped: [],
        totalLegacy: 1,
        dryRun: true,
      };

      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("[DRY RUN]");
      expect(text).not.toContain("jumbo db rebuild");
    });

    it("renders mixed converted and skipped", () => {
      const response: MigrateDependenciesResponse = {
        converted: [
          {
            dependencyId: "dep_1",
            relationId: "relation_abc",
            fromEntityId: "A",
            toEntityId: "B",
          },
        ],
        skipped: [
          { dependencyId: "dep_2", reason: "Already removed" },
        ],
        totalLegacy: 2,
        dryRun: false,
      };

      const output = builder.buildSuccess(response);
      const text = output.toHumanReadable();

      expect(text).toContain("Converted to relations:     1");
      expect(text).toContain("Skipped:                    1");
      expect(text).toContain("A → B");
      expect(text).toContain("dep_2: Already removed");
    });
  });

  describe("buildFailureError", () => {
    it("renders error message from Error object", () => {
      const output = builder.buildFailureError(new Error("Something went wrong"));
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to migrate dependencies");
    });

    it("renders error message from string", () => {
      const output = builder.buildFailureError("Something went wrong");
      const text = output.toHumanReadable();

      expect(text).toContain("Failed to migrate dependencies");
    });
  });
});
