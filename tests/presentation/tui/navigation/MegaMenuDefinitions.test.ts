import { describe, expect, it } from "@jest/globals";
import {
  MEGA_MENU_SECTIONS,
  MAX_MENU_DEPTH,
} from "../../../../src/presentation/tui/navigation/MegaMenuDefinitions.js";
import { ComponentType } from "../../../../src/domain/components/Constants.js";
import { DecisionStatus } from "../../../../src/domain/decisions/Constants.js";
import { GoalStatus } from "../../../../src/domain/goals/Constants.js";
import { GuidelineCategory } from "../../../../src/domain/guidelines/Constants.js";

describe("MegaMenuDefinitions", () => {
  it("defines top-level sections with Memory as a category", () => {
    expect(MEGA_MENU_SECTIONS).toHaveLength(4);
    const keys = MEGA_MENU_SECTIONS.map((s) => s.key);
    expect(keys).toEqual(["cockpit", "goals", "memory", "session"]);
  });

  it("assigns sequential shortcut numbers", () => {
    const shortcuts = MEGA_MENU_SECTIONS.map((s) => s.shortcut);
    expect(shortcuts).toEqual(["1", "2", "3", "4"]);
  });

  it("links Memory submenu items to dedicated entity screens", () => {
    const memorySection = MEGA_MENU_SECTIONS.find(
      (section) => section.key === "memory",
    );

    expect(memorySection?.screenKey).toBeUndefined();
    expect(memorySection?.children.map((child) => child.screenKey)).toEqual([
      "decisions",
      "invariants",
      "components",
      "dependencies",
      "guidelines",
    ]);
  });

  it("every section has at least one child", () => {
    for (const section of MEGA_MENU_SECTIONS) {
      expect(section.children.length).toBeGreaterThan(0);
    }
  });

  it("every level-2 item has at least one child", () => {
    for (const section of MEGA_MENU_SECTIONS) {
      for (const child of section.children) {
        expect(child.children).toBeDefined();
        expect(child.children!.length).toBeGreaterThan(0);
      }
    }
  });

  it("sets max menu depth to 3", () => {
    expect(MAX_MENU_DEPTH).toBe(3);
  });

  it("uses domain constants for domain-valued submenu keys", () => {
    const cockpitSection = MEGA_MENU_SECTIONS[0];
    const goalsSection = MEGA_MENU_SECTIONS[1];
    const memorySection = MEGA_MENU_SECTIONS[2];

    expect(cockpitSection.children[1].children?.map((item) => item.key)).toEqual([
      GoalStatus.DOING,
      GoalStatus.BLOCKED,
      GoalStatus.DONE,
    ]);
    expect(goalsSection.children[0].children?.slice(0, 2).map((item) => item.key)).toEqual([
      GoalStatus.TODO,
      GoalStatus.REFINED,
    ]);
    expect(memorySection.children[0].children?.map((item) => item.key)).toEqual([
      DecisionStatus.ACTIVE,
      DecisionStatus.SUPERSEDED,
      DecisionStatus.REVERSED,
    ]);
    expect(memorySection.children[2].children?.map((item) => item.key)).toEqual([
      ComponentType.SERVICE,
      ComponentType.UI,
      ComponentType.LIB,
    ]);
    expect(memorySection.children[4].children?.map((item) => item.key)).toEqual([
      GuidelineCategory.CODING_STYLE,
      GuidelineCategory.TESTING,
      GuidelineCategory.PROCESS,
    ]);
  });

  it("all items have unique keys within their level", () => {
    const sectionKeys = MEGA_MENU_SECTIONS.map((s) => s.key);
    expect(new Set(sectionKeys).size).toBe(sectionKeys.length);

    for (const section of MEGA_MENU_SECTIONS) {
      const childKeys = section.children.map((c) => c.key);
      expect(new Set(childKeys).size).toBe(childKeys.length);
    }
  });
});
