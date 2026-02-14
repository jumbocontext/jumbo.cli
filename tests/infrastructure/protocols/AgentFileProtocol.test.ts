/**
 * Tests for AgentFileProtocol infrastructure implementation
 */

import * as fs from "fs-extra";
import * as path from "path";
import { AgentFileProtocol } from "../../../src/infrastructure/context/project/init/AgentFileProtocol";
import { AgentInstructions } from "../../../src/domain/project/AgentInstructions";

describe("AgentFileProtocol", () => {
  let tmpDir: string;
  let protocol: AgentFileProtocol;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-agent-files-"));
    protocol = new AgentFileProtocol();
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
  });

  describe("ensureAgentsMd()", () => {
    it("should create AGENTS.md if it doesn't exist", async () => {
      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const exists = await fs.pathExists(agentsMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("# Agents.md");
      expect(content).toContain("## Instructions for Jumbo");
    });

    it("should append Jumbo section if AGENTS.md exists without it", async () => {
      // Arrange
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      await fs.writeFile(
        agentsMdPath,
        "# AI Agent Instructions\n\nExisting content here.",
        "utf-8"
      );

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain("Existing content here.");
      expect(content).toContain("## Instructions for Jumbo");
    });

    it("should not duplicate Jumbo section if already present", async () => {
      // Arrange
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const initialContent = AgentInstructions.getFullContent();
      await fs.writeFile(agentsMdPath, initialContent, "utf-8");

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const occurrences = (content.match(/## Instructions for Jumbo/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle errors gracefully without throwing", async () => {
      // Arrange - use invalid path
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");

      // Act & Assert - should not throw
      await expect(protocol.ensureAgentsMd(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("ensureAgentConfigurations()", () => {
    it("should create CLAUDE.md with AGENTS.md reference", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const exists = await fs.pathExists(claudeMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create GEMINI.md with AGENTS.md reference", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const exists = await fs.pathExists(geminiMdPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(geminiMdPath, "utf-8");
      expect(content).toContain("AGENTS.md");
    });

    it("should create .claude/settings.json with SessionStart hook", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".claude", "settings.json");
      const exists = await fs.pathExists(settingsPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.hooks?.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart[0].matcher).toBe("startup");
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("jumbo session start");
    });

    it("should create .claude/settings.json with jumbo --help permission", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".claude", "settings.json");
      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.permissions?.allow).toBeDefined();
      expect(settings.permissions.allow).toContain("Bash(jumbo --help)");
    });

    it("should create .gemini/settings.json with jumbo --help permission", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".gemini", "settings.json");
      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.tools?.allowed).toBeDefined();
      expect(settings.tools.allowed).toContain("run_shell_command(jumbo --help)");
    });

    it("should create .gemini/settings.json with SessionStart hook", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const settingsPath = path.join(tmpDir, ".gemini", "settings.json");
      const exists = await fs.pathExists(settingsPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(settingsPath, "utf-8");
      const settings = JSON.parse(content);
      expect(settings.hooks?.SessionStart).toBeDefined();
      expect(settings.hooks.SessionStart[0].matcher).toBe("startup");
      expect(settings.hooks.SessionStart[0].hooks[0].command).toBe("jumbo session start");
    });

    it("should create .github/copilot-instructions.md with Jumbo instructions", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const exists = await fs.pathExists(copilotPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(copilotPath, "utf-8");
      expect(content).toContain("Jumbo");
    });

    it("should append reference if CLAUDE.md exists without it", async () => {
      // Arrange
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(
        claudeMdPath,
        "# CLAUDE.md\n\nExisting instructions here.",
        "utf-8"
      );

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const content = await fs.readFile(claudeMdPath, "utf-8");
      expect(content).toContain("Existing instructions here.");
      expect(content).toContain("AGENTS.md");
    });

    it("should not duplicate reference if already present in CLAUDE.md", async () => {
      // Arrange
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const initialContent = AgentInstructions.getAgentFileReference();
      await fs.writeFile(claudeMdPath, initialContent, "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - verify reference block not duplicated by checking unique marker
      const content = await fs.readFile(claudeMdPath, "utf-8");
      const occurrences = (content.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should handle all agents independently", async () => {
      // Arrange - Create only CLAUDE.md
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      await fs.writeFile(claudeMdPath, "# CLAUDE.md\n\nExisting content.", "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - CLAUDE.md updated
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      expect(claudeContent).toContain("AGENTS.md");

      // Assert - GEMINI.md created
      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiExists = await fs.pathExists(geminiMdPath);
      expect(geminiExists).toBe(true);

      // Assert - .claude/settings.json created
      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettingsExists = await fs.pathExists(claudeSettingsPath);
      expect(claudeSettingsExists).toBe(true);

      // Assert - .gemini/settings.json created
      const geminiSettingsPath = path.join(tmpDir, ".gemini", "settings.json");
      const geminiSettingsExists = await fs.pathExists(geminiSettingsPath);
      expect(geminiSettingsExists).toBe(true);

      // Assert - .github/copilot-instructions.md created
      const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
      const copilotExists = await fs.pathExists(copilotPath);
      expect(copilotExists).toBe(true);

      // Assert - .github/hooks/hooks.json created
      const hooksPath = path.join(tmpDir, ".github", "hooks", "hooks.json");
      const hooksExists = await fs.pathExists(hooksPath);
      expect(hooksExists).toBe(true);
    });

    it("should create .github/hooks/hooks.json with SessionStart hook", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - .github/hooks/hooks.json created
      const hooksPath = path.join(tmpDir, ".github", "hooks", "hooks.json");
      const exists = await fs.pathExists(hooksPath);
      expect(exists).toBe(true);

      const content = await fs.readFile(hooksPath, "utf-8");
      const hooks = JSON.parse(content);
      
      // Assert structure
      expect(hooks.version).toBe(1);
      expect(hooks.hooks).toBeDefined();
      expect(hooks.hooks.sessionStart).toBeDefined();
      expect(hooks.hooks.sessionStart.length).toBeGreaterThan(0);
      
      // Assert jumbo session start hook
      const sessionStartHook = hooks.hooks.sessionStart[0];
      expect(sessionStartHook.type).toBe("command");
      expect(sessionStartHook.bash).toBe("jumbo session start");
    });
  });

  describe("repair", () => {
    describe("repairAgentsMd()", () => {
      it("should create AGENTS.md if missing", async () => {
        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const exists = await fs.pathExists(agentsMdPath);
        expect(exists).toBe(true);

        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("## Instructions for Jumbo");
      });

      it("should replace outdated Jumbo section", async () => {
        // Arrange - write AGENTS.md with outdated Jumbo section
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const outdatedContent =
          "# Agents.md\n\n## Instructions for Jumbo\n\nOld outdated content.\n";
        await fs.writeFile(agentsMdPath, outdatedContent, "utf-8");

        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain(AgentInstructions.getJumboSection());
        expect(content).not.toContain("Old outdated content.");
      });

      it("should preserve non-Jumbo content", async () => {
        // Arrange
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const content =
          "# Agents.md\n\n## My Custom Section\n\nKeep this.\n\n## Instructions for Jumbo\n\nOld.\n";
        await fs.writeFile(agentsMdPath, content, "utf-8");

        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const result = await fs.readFile(agentsMdPath, "utf-8");
        expect(result).toContain("My Custom Section");
        expect(result).toContain("Keep this.");
      });

      it("should append Jumbo section if not present", async () => {
        // Arrange
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        await fs.writeFile(agentsMdPath, "# Agents.md\n\nCustom content only.", "utf-8");

        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain("Custom content only.");
        expect(content).toContain("## Instructions for Jumbo");
      });
    });

    describe("repairAgentConfigurations()", () => {
      it("should call repair on each configurer", async () => {
        // Act
        await protocol.repairAgentConfigurations(tmpDir);

        // Assert - verify all agent files are present
        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        expect(await fs.pathExists(claudeMdPath)).toBe(true);

        const geminiMdPath = path.join(tmpDir, "GEMINI.md");
        expect(await fs.pathExists(geminiMdPath)).toBe(true);

        const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
        expect(await fs.pathExists(copilotPath)).toBe(true);
      });

      it("should replace outdated CLAUDE.md reference block", async () => {
        // Arrange - write CLAUDE.md with old reference
        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        const oldContent =
          "# CLAUDE.md\n\nCRITICAL STARTUP INSTRUCTION: Old instructions.\n\nOld middle.\n\n!!!IMPORTANT!!! Old.\n";
        await fs.writeFile(claudeMdPath, oldContent, "utf-8");

        // Act
        await protocol.repairAgentConfigurations(tmpDir);

        // Assert
        const content = await fs.readFile(claudeMdPath, "utf-8");
        expect(content).toContain(AgentInstructions.getAgentFileReference().trim());
        expect(content).not.toContain("Old instructions.");
      });

      it("should replace outdated copilot-instructions.md section", async () => {
        // Arrange
        const copilotPath = path.join(tmpDir, ".github", "copilot-instructions.md");
        await fs.ensureDir(path.join(tmpDir, ".github"));
        const oldContent =
          "# Copilot\n\n## Jumbo Context Management\n\nOld copilot content.\n";
        await fs.writeFile(copilotPath, oldContent, "utf-8");

        // Act
        await protocol.repairAgentConfigurations(tmpDir);

        // Assert
        const content = await fs.readFile(copilotPath, "utf-8");
        expect(content).toContain(AgentInstructions.getCopilotInstructions());
        expect(content).not.toContain("Old copilot content.");
      });
    });

    describe("repair idempotency", () => {
      it("should be safe to run repair multiple times", async () => {
        // Act
        await protocol.repairAgentsMd(tmpDir);
        await protocol.repairAgentConfigurations(tmpDir);
        await protocol.repairAgentsMd(tmpDir);
        await protocol.repairAgentConfigurations(tmpDir);

        // Assert - single occurrences
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const agentsContent = await fs.readFile(agentsMdPath, "utf-8");
        const agentsOccurrences = (agentsContent.match(/## Instructions for Jumbo/g) || []).length;
        expect(agentsOccurrences).toBe(1);

        const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
        const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
        const claudeOccurrences = (claudeContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
        expect(claudeOccurrences).toBe(1);
      });
    });
  });

  describe("idempotency", () => {
    it("should be safe to run ensureAgentsMd multiple times", async () => {
      // Act
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const content = await fs.readFile(agentsMdPath, "utf-8");
      const occurrences = (content.match(/## Instructions for Jumbo/g) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should be safe to run ensureAgentConfigurations multiple times", async () => {
      // Act
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert - verify reference block appears only once by checking for unique marker
      const claudeMdPath = path.join(tmpDir, "CLAUDE.md");
      const claudeContent = await fs.readFile(claudeMdPath, "utf-8");
      const claudeOccurrences = (claudeContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(claudeOccurrences).toBe(1);

      const geminiMdPath = path.join(tmpDir, "GEMINI.md");
      const geminiContent = await fs.readFile(geminiMdPath, "utf-8");
      const geminiOccurrences = (geminiContent.match(/CRITICAL STARTUP INSTRUCTION/g) || []).length;
      expect(geminiOccurrences).toBe(1);

      // Assert - settings.json not duplicating hooks
      // ClaudeConfigurer adds 2 SessionStart entries (startup and compact)
      const claudeSettingsPath = path.join(tmpDir, ".claude", "settings.json");
      const claudeSettings = JSON.parse(await fs.readFile(claudeSettingsPath, "utf-8"));
      expect(claudeSettings.hooks.SessionStart.length).toBe(2);
      expect(claudeSettings.hooks.SessionStart[0].hooks.length).toBe(1);
      expect(claudeSettings.hooks.SessionStart[1].hooks.length).toBe(1);
    });
  });
});
