/**
 * Tests for AgentFileProtocol infrastructure implementation
 */

import * as fs from "fs-extra";
import * as path from "path";
import { AgentFileProtocol } from "../../../../../src/infrastructure/context/project/init/AgentFileProtocol";
import { AgentsMdContent } from "../../../../../src/domain/project/AgentsMdContent";
import { AgentFileReferenceContent } from "../../../../../src/domain/project/AgentFileReferenceContent";
import { CopilotInstructionsContent } from "../../../../../src/domain/project/CopilotInstructionsContent";

describe("AgentFileProtocol", () => {
  let tmpDir: string;
  let protocol: AgentFileProtocol;
  const skillPlatforms = [".agents/skills", ".claude/skills", ".gemini/skills", ".vibe/skills"];

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(process.cwd(), "test-agent-files-"));
    protocol = new AgentFileProtocol(path.join(tmpDir, "templates", "skills"));
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
      expect(content).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
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
      expect(content).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
    });

    it("should replace outdated Jumbo section with current version", async () => {
      // Arrange - write AGENTS.md with outdated Jumbo section
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const outdatedContent = `# Agents.md\n\n${currentMarker}\n\nOld outdated instructions.\n`;
      await fs.writeFile(agentsMdPath, outdatedContent, "utf-8");

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain(AgentsMdContent.getJumboSection());
      expect(content).not.toContain("Old outdated instructions.");
      const markerRegex = new RegExp(currentMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
      const occurrences = (content.match(markerRegex) || []).length;
      expect(occurrences).toBe(1);
    });

    it("should replace legacy Jumbo section with current version", async () => {
      // Arrange - write AGENTS.md with legacy section marker
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
      const legacyContent = `# Agents.md\n\n${legacyMarker}\n\nLegacy instructions.\n`;
      await fs.writeFile(agentsMdPath, legacyContent, "utf-8");

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const content = await fs.readFile(agentsMdPath, "utf-8");
      expect(content).toContain(AgentsMdContent.getJumboSection());
      expect(content).not.toContain("Legacy instructions.");
      expect(content).not.toContain(legacyMarker);
    });

    it("should preserve non-Jumbo content when replacing", async () => {
      // Arrange
      const agentsMdPath = path.join(tmpDir, "AGENTS.md");
      const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
      const content = `# Agents.md\n\n## My Custom Section\n\nKeep this.\n\n${currentMarker}\n\nOld.\n`;
      await fs.writeFile(agentsMdPath, content, "utf-8");

      // Act
      await protocol.ensureAgentsMd(tmpDir);

      // Assert
      const result = await fs.readFile(agentsMdPath, "utf-8");
      expect(result).toContain("My Custom Section");
      expect(result).toContain("Keep this.");
      expect(result).toContain(AgentsMdContent.getJumboSection());
      expect(result).not.toContain("\nOld.\n");
    });

    it("should handle errors gracefully without throwing", async () => {
      // Arrange - use invalid path
      const invalidPath = path.join(tmpDir, "nonexistent", "deeply", "nested");

      // Act & Assert - should not throw
      await expect(protocol.ensureAgentsMd(invalidPath)).resolves.not.toThrow();
    });
  });

  describe("ensureAgentConfigurations()", () => {
    it("should install skills from template root outside project root", async () => {
      // Arrange
      const externalTemplateRoot = await fs.mkdtemp(path.join(process.cwd(), "external-template-skills-"));
      protocol = new AgentFileProtocol(externalTemplateRoot);

      const externalSkillPath = path.join(externalTemplateRoot, "external-skill");
      await fs.ensureDir(externalSkillPath);
      await fs.writeFile(path.join(externalSkillPath, "SKILL.md"), "# External Skill\n", "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      for (const platformSkillRoot of skillPlatforms) {
        const installedSkillPath = path.join(tmpDir, platformSkillRoot, "external-skill", "SKILL.md");
        expect(await fs.pathExists(installedSkillPath)).toBe(true);
      }

      await fs.remove(externalTemplateRoot);
    });

    it("should install template-managed skills to all configured platform skill directories", async () => {
      // Arrange
      const templateSkillPath = path.join(tmpDir, "templates", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n\nFrom template.\n", "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      for (const platformSkillRoot of skillPlatforms) {
        const installedSkillPath = path.join(tmpDir, platformSkillRoot, "my-skill", "SKILL.md");
        expect(await fs.pathExists(installedSkillPath)).toBe(true);
        expect(await fs.readFile(installedSkillPath, "utf-8")).toContain("From template.");
      }
    });

    it("should keep user-created skills and avoid overwriting managed skills during additive install", async () => {
      // Arrange
      const templateSkillPath = path.join(tmpDir, "templates", "skills", "managed-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# Managed\n\nTemplate version.\n", "utf-8");

      const userSkillPath = path.join(tmpDir, ".claude", "skills", "my-custom-skill");
      await fs.ensureDir(userSkillPath);
      await fs.writeFile(path.join(userSkillPath, "SKILL.md"), "# User\n\nKeep me.\n", "utf-8");

      const managedSkillPath = path.join(tmpDir, ".claude", "skills", "managed-skill");
      await fs.ensureDir(managedSkillPath);
      await fs.writeFile(path.join(managedSkillPath, "SKILL.md"), "# Managed\n\nLocal customization.\n", "utf-8");

      // Act
      await protocol.ensureAgentConfigurations(tmpDir);

      // Assert
      const userSkillContent = await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8");
      expect(userSkillContent).toContain("Keep me.");

      const managedSkillContent = await fs.readFile(path.join(managedSkillPath, "SKILL.md"), "utf-8");
      expect(managedSkillContent).toContain("Local customization.");
      expect(managedSkillContent).not.toContain("Template version.");
    });

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
      expect(settings.hooks?.SessionEnd).toBeUndefined();
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
      expect(settings.hooks?.SessionEnd).toBeUndefined();
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
      const initialContent = AgentFileReferenceContent.getAgentFileReference();
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
        expect(content).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
      });

      it("should replace outdated Jumbo section", async () => {
        // Arrange - write AGENTS.md with current marker but outdated content
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
        const outdatedContent = `# Agents.md\n\n${currentMarker}\n\nOld outdated content.\n`;
        await fs.writeFile(agentsMdPath, outdatedContent, "utf-8");

        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain(AgentsMdContent.getJumboSection());
        expect(content).not.toContain("Old outdated content.");
      });

      it("should replace legacy Jumbo section with current version", async () => {
        // Arrange - write AGENTS.md with legacy marker
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const legacyMarker = AgentsMdContent.getLegacyJumboSectionMarkers()[0];
        const legacyContent = `# Agents.md\n\n${legacyMarker}\n\nLegacy content.\n`;
        await fs.writeFile(agentsMdPath, legacyContent, "utf-8");

        // Act
        await protocol.repairAgentsMd(tmpDir);

        // Assert
        const content = await fs.readFile(agentsMdPath, "utf-8");
        expect(content).toContain(AgentsMdContent.getJumboSection());
        expect(content).not.toContain("Legacy content.");
        expect(content).not.toContain(legacyMarker);
      });

      it("should preserve non-Jumbo content", async () => {
        // Arrange
        const agentsMdPath = path.join(tmpDir, "AGENTS.md");
        const currentMarker = AgentsMdContent.getCurrentJumboSectionMarker();
        const content = `# Agents.md\n\n## My Custom Section\n\nKeep this.\n\n${currentMarker}\n\nOld.\n`;
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
        expect(content).toContain(AgentsMdContent.getCurrentJumboSectionMarker());
      });
    });

    describe("repairAgentConfigurations()", () => {
      it("should overwrite template-managed skills and preserve user-created skills", async () => {
        // Arrange
        const templateSkillPath = path.join(tmpDir, "templates", "skills", "managed-skill");
        await fs.ensureDir(templateSkillPath);
        await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# Managed\n\nTemplate current version.\n", "utf-8");

        const managedSkillPath = path.join(tmpDir, ".agents", "skills", "managed-skill");
        await fs.ensureDir(managedSkillPath);
        await fs.writeFile(path.join(managedSkillPath, "SKILL.md"), "# Managed\n\nOutdated version.\n", "utf-8");

        const userSkillPath = path.join(tmpDir, ".agents", "skills", "my-custom-skill");
        await fs.ensureDir(userSkillPath);
        await fs.writeFile(path.join(userSkillPath, "SKILL.md"), "# User\n\nKeep me.\n", "utf-8");

        // Act
        await protocol.repairAgentConfigurations(tmpDir);

        // Assert
        const repairedManagedContent = await fs.readFile(path.join(managedSkillPath, "SKILL.md"), "utf-8");
        expect(repairedManagedContent).toContain("Template current version.");
        expect(repairedManagedContent).not.toContain("Outdated version.");

        const preservedUserContent = await fs.readFile(path.join(userSkillPath, "SKILL.md"), "utf-8");
        expect(preservedUserContent).toContain("Keep me.");
      });

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
        expect(content).toContain(AgentFileReferenceContent.getAgentFileReference().trim());
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
        expect(content).toContain(CopilotInstructionsContent.getCopilotInstructions());
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
        const markerRegex = new RegExp(
          AgentsMdContent.getCurrentJumboSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        const agentsOccurrences = (agentsContent.match(markerRegex) || []).length;
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
      const markerRegex = new RegExp(
        AgentsMdContent.getCurrentJumboSectionMarker().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "g"
      );
      const occurrences = (content.match(markerRegex) || []).length;
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

  describe("getPlannedFileChanges()", () => {
    it("should include planned skill sync changes when templates are present", async () => {
      // Arrange
      const templateSkillPath = path.join(tmpDir, "templates", "skills", "my-skill");
      await fs.ensureDir(templateSkillPath);
      await fs.writeFile(path.join(templateSkillPath, "SKILL.md"), "# My Skill\n", "utf-8");

      // Act
      const changes = await protocol.getPlannedFileChanges(tmpDir);

      // Assert
      expect(changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            path: ".agents/skills/my-skill",
            description: expect.stringContaining("templates/skills"),
          }),
          expect.objectContaining({
            path: ".claude/skills/my-skill",
            description: expect.stringContaining("templates/skills"),
          }),
          expect.objectContaining({
            path: ".gemini/skills/my-skill",
            description: expect.stringContaining("templates/skills"),
          }),
          expect.objectContaining({
            path: ".vibe/skills/my-skill",
            description: expect.stringContaining("templates/skills"),
          }),
        ])
      );
    });
  });
});
