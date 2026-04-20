import { EntityRenderer } from './EntityRenderer.js';

/**
 * Registry for entity renderers.
 * Maps renderer type strings to renderer instances.
 */
export class EntityRendererRegistry {
  private renderers = new Map<string, EntityRenderer<any>>();

  register<T>(type: string, renderer: EntityRenderer<T>): void {
    this.renderers.set(type, renderer);
  }

  get<T>(type: string): EntityRenderer<T> | undefined {
    return this.renderers.get(type);
  }

  has(type: string): boolean {
    return this.renderers.has(type);
  }
}
