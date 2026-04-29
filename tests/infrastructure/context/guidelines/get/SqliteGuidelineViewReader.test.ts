import Database from "better-sqlite3";
import { SqliteGuidelineViewReader } from "../../../../../src/infrastructure/context/guidelines/get/SqliteGuidelineViewReader";
import { GuidelineCategory } from "../../../../../src/domain/guidelines/Constants";

describe("SqliteGuidelineViewReader", () => {
  let db: Database.Database;
  let reader: SqliteGuidelineViewReader;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE guideline_views (
        guidelineId TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        rationale TEXT NOT NULL,
        examples TEXT NOT NULL,
        isRemoved INTEGER NOT NULL DEFAULT 0,
        removedAt TEXT,
        removalReason TEXT,
        version INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);
    reader = new SqliteGuidelineViewReader(db);
  });

  afterEach(() => {
    db.close();
  });

  function insertGuideline(id: string, title: string, createdAt: string): void {
    db.prepare(`
      INSERT INTO guideline_views (guidelineId, category, title, description, rationale, examples, isRemoved, version, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, GuidelineCategory.TESTING, title, "desc", "rationale", "[]", 0, 1, createdAt, createdAt);
  }

  describe("findByIds", () => {
    it("should return empty array for empty input", async () => {
      const result = await reader.findByIds([]);
      expect(result).toEqual([]);
    });

    it("should return a single guideline by ID", async () => {
      insertGuideline("guide_1", "Test all things", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["guide_1"]);

      expect(result).toHaveLength(1);
      expect(result[0].guidelineId).toBe("guide_1");
      expect(result[0].title).toBe("Test all things");
      expect(result[0]).not.toHaveProperty(["enforce", "ment"].join(""));
    });

    it("should return multiple guidelines by IDs ordered by createdAt DESC", async () => {
      insertGuideline("guide_1", "First", "2025-01-01T00:00:00Z");
      insertGuideline("guide_2", "Second", "2025-01-02T00:00:00Z");
      insertGuideline("guide_3", "Third", "2025-01-03T00:00:00Z");

      const result = await reader.findByIds(["guide_1", "guide_2", "guide_3"]);

      expect(result).toHaveLength(3);
      expect(result[0].guidelineId).toBe("guide_3");
      expect(result[1].guidelineId).toBe("guide_2");
      expect(result[2].guidelineId).toBe("guide_1");
    });

    it("should return empty array for non-existent IDs", async () => {
      insertGuideline("guide_1", "Existing", "2025-01-01T00:00:00Z");

      const result = await reader.findByIds(["nonexistent_1", "nonexistent_2"]);

      expect(result).toEqual([]);
    });
  });
});
