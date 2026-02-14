import * as path from "path";
import * as fs from "fs";
import { IProjectRootResolver } from "../../../application/context/project/IProjectRootResolver.js";

export class ProjectRootResolver implements IProjectRootResolver {
  resolve(): string {
    let dir = process.cwd();

    while (true) {
      const candidate = path.join(dir, ".jumbo");
      if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
        return dir;
      }

      const parent = path.dirname(dir);
      if (parent === dir) {
        throw new Error(
          "No Jumbo project found. Run `jumbo project init` from your project root."
        );
      }
      dir = parent;
    }
  }
}
