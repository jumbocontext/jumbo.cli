import { ISearchIndexRebuildStore } from "../../../../../application/context/search/ISearchIndexRebuildStore.js";
import { SearchIndexRebuildController } from "../../../../../application/context/search/SearchIndexRebuildController.js";
import { IApplicationContainer } from "../../../../../application/host/IApplicationContainer.js";
import { LocalSearchIndexRebuildGateway } from "../../../../../infrastructure/context/search/LocalSearchIndexRebuildGateway.js";
import { Renderer } from "../../../rendering/Renderer.js";
import { RenderData } from "../../../rendering/types.js";
import { CommandMetadata } from "../../registry/CommandMetadata.js";
import { IndexRebuildOutputBuilder } from "./IndexRebuildOutputBuilder.js";

export const metadata: CommandMetadata = {
  description: "Rebuild the projected global search index from persisted events",
  category: "project-knowledge",
  examples: [
    {
      command: "jumbo index rebuild",
      description: "Repair the project search index without rebuilding every projection",
    },
    {
      command: "jumbo index rebuild --format json",
      description: "Emit structured rebuild statistics for agents",
    },
  ],
  related: ["search", "heal", "evolve"],
  requiresProject: true,
};

type IndexRebuildOptions = Record<string, never>;

export async function indexRebuild(_options: IndexRebuildOptions, container: IApplicationContainer): Promise<void> {
  const renderer = Renderer.getInstance();
  const outputBuilder = new IndexRebuildOutputBuilder();
  const controller = new SearchIndexRebuildController(
    new LocalSearchIndexRebuildGateway(
      container.eventStore,
      container.searchIndexWriter as unknown as ISearchIndexRebuildStore,
      container.searchIndexReader,
      container.searchIndexWriter
    )
  );

  try {
    const response = await controller.handle({});
    const output = outputBuilder.buildSuccess(response);

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      return;
    }

    renderer.data(outputBuilder.buildStructuredOutput(response));
  } catch (error) {
    const output = outputBuilder.buildFailure(error instanceof Error ? error : String(error));

    if (renderer.getConfig().format === "text") {
      renderer.info(output.toHumanReadable());
      process.exit(1);
    }

    const data = output.getSections().find((section) => section.type === "data")?.content as RenderData;
    renderer.error(String(data.error), String(data.details));
    process.exit(1);
  }
}
