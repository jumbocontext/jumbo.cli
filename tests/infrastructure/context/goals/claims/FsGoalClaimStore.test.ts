/**
 * Tests for FsGoalClaimStore
 */

import * as fs from "fs-extra";
import * as path from "path";
import { FsGoalClaimStore } from "../../../../../src/infrastructure/context/goals/claims/FsGoalClaimStore";
import { GoalClaim } from "../../../../../src/application/context/goals/claims/GoalClaim";
import { createWorkerId } from "../../../../../src/application/host/workers/WorkerId";

describe("FsGoalClaimStore", () => {
  let tmpDir: string;
  let store: FsGoalClaimStore;

  const workerA = createWorkerId("worker-a-uuid");
  const workerB = createWorkerId("worker-b-uuid");

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-claims-"));
    store = new FsGoalClaimStore(tmpDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("getClaim", () => {
    it("returns null when no claim exists", () => {
      const claim = store.getClaim("goal_nonexistent");

      expect(claim).toBeNull();
    });

    it("returns null when claims file does not exist", () => {
      const claim = store.getClaim("goal_123");

      expect(claim).toBeNull();
    });

    it("returns stored claim after setClaim", () => {
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);
      const retrieved = store.getClaim("goal_123");

      expect(retrieved).toEqual(claim);
    });
  });

  describe("setClaim", () => {
    it("creates claims.json file on first setClaim", () => {
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);

      const filePath = path.join(tmpDir, "claims.json");
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it("persists claim with all required fields", () => {
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);

      const filePath = path.join(tmpDir, "claims.json");
      const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

      expect(content.claims["goal_123"]).toEqual(claim);
    });

    it("updates existing claim for same goalId", () => {
      const originalClaim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const updatedClaim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T11:00:00.000Z", // Extended
      };

      store.setClaim(originalClaim);
      store.setClaim(updatedClaim);

      const retrieved = store.getClaim("goal_123");
      expect(retrieved?.claimExpiresAt).toBe("2025-01-15T11:00:00.000Z");
    });

    it("stores multiple claims for different goals", () => {
      const claim1: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const claim2: GoalClaim = {
        goalId: "goal_456",
        claimedBy: workerB,
        claimedAt: "2025-01-15T10:05:00.000Z",
        claimExpiresAt: "2025-01-15T10:35:00.000Z",
      };

      store.setClaim(claim1);
      store.setClaim(claim2);

      expect(store.getClaim("goal_123")).toEqual(claim1);
      expect(store.getClaim("goal_456")).toEqual(claim2);
    });
  });

  describe("releaseClaim", () => {
    it("removes existing claim", () => {
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);
      store.releaseClaim("goal_123");

      expect(store.getClaim("goal_123")).toBeNull();
    });

    it("does not affect other claims", () => {
      const claim1: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      const claim2: GoalClaim = {
        goalId: "goal_456",
        claimedBy: workerB,
        claimedAt: "2025-01-15T10:05:00.000Z",
        claimExpiresAt: "2025-01-15T10:35:00.000Z",
      };

      store.setClaim(claim1);
      store.setClaim(claim2);
      store.releaseClaim("goal_123");

      expect(store.getClaim("goal_123")).toBeNull();
      expect(store.getClaim("goal_456")).toEqual(claim2);
    });

    it("handles releasing non-existent claim gracefully", () => {
      // Should not throw
      expect(() => store.releaseClaim("goal_nonexistent")).not.toThrow();
    });
  });

  describe("error handling", () => {
    it("starts fresh when claims file is corrupted", () => {
      const filePath = path.join(tmpDir, "claims.json");
      fs.writeFileSync(filePath, "{ invalid json", "utf-8");

      // Should not throw
      const claim = store.getClaim("goal_123");
      expect(claim).toBeNull();

      // Should be able to write new claims
      const newClaim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(newClaim);
      expect(store.getClaim("goal_123")).toEqual(newClaim);
    });
  });

  describe("persistence across instances", () => {
    it("loads claims from existing file", () => {
      const claim: GoalClaim = {
        goalId: "goal_123",
        claimedBy: workerA,
        claimedAt: "2025-01-15T10:00:00.000Z",
        claimExpiresAt: "2025-01-15T10:30:00.000Z",
      };

      store.setClaim(claim);

      // Create new instance
      const newStore = new FsGoalClaimStore(tmpDir);
      expect(newStore.getClaim("goal_123")).toEqual(claim);
    });
  });
});
