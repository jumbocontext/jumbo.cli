import { UpgradeOutputBuilder } from "../../../../../../src/presentation/cli/commands/maintenance/upgrade/UpgradeOutputBuilder";

describe("UpgradeOutputBuilder", () => {
  let builder: UpgradeOutputBuilder;

  beforeEach(() => {
    builder = new UpgradeOutputBuilder();
  });

  it("should render success with migrated goals", () => {
    const output = builder.buildSuccess({
      migratedGoals: 3,
      eventsAppended: 3,
      success: true,
    });

    const text = output.toHumanReadable();
    expect(text).toContain("Migration complete");
    expect(text).toContain("Goals migrated:   3");
    expect(text).toContain("Events appended:  3");
    expect(text).toContain("jumbo db rebuild --yes");
  });

  it("should render success with zero migrations", () => {
    const output = builder.buildSuccess({
      migratedGoals: 0,
      eventsAppended: 0,
      success: true,
    });

    const text = output.toHumanReadable();
    expect(text).toContain("No goals require migration");
    expect(text).toContain("jumbo db rebuild --yes");
  });

  it("should render failure error", () => {
    const output = builder.buildFailureError(new Error("Something went wrong"));

    const text = output.toHumanReadable();
    expect(text).toContain("Failed to upgrade");
  });
});
