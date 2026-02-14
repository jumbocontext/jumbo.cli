import { ArchitectureView } from "../ArchitectureView.js";
import { IArchitectureViewer } from "./IArchitectureViewer.js";

/**
 * ViewArchitectureCommandHandler - Command handler for reading architecture view.
 */
export class ViewArchitectureCommandHandler {
  constructor(
    private readonly architectureViewer: IArchitectureViewer
  ) {}

  async execute(): Promise<ArchitectureView | null> {
    return this.architectureViewer.view();
  }
}
