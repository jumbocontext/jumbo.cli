import { randomUUID } from "node:crypto";

export class IdGenerator {
  static generate(): string {
    return randomUUID();
  }
}
