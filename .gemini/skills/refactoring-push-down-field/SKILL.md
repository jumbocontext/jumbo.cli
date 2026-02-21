---
name: refactoring-push-down-field
description: Use when a superclass field is only accessed by one or a few subclasses and does not represent a concept shared across the entire hierarchy.
---

# Push Down Field

**Prompt:** Apply the "Push Down Field" refactoring to move a field from a superclass into only the subclass(es) that actually use it.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

A field declared in a superclass that is only read or written by one or two subclasses adds noise to every other subclass in the hierarchy. It suggests a relationship between the data and the general concept that does not really exist. Pushing the field down clarifies which subclasses actually own that data and prevents accidental use elsewhere. It also reduces the memory footprint of subclasses that never populate the field.

## Mechanics

1. Identify every reference to the field across the hierarchy. Confirm it is only used in specific subclasses.
2. Declare the field in each subclass that uses it.
3. Remove the field from the superclass.
4. Update constructors: move any assignment of the field from the superclass constructor into the relevant subclass constructors.
5. Test to verify that all subclass behavior is preserved and that classes that never used the field are unaffected.

## Example

### Before

```typescript
class MediaItem {
  protected title: string;
  protected durationSeconds: number; // only relevant to audio/video, not images
  protected fileSize: number;

  constructor(title: string, durationSeconds: number, fileSize: number) {
    this.title = title;
    this.durationSeconds = durationSeconds;
    this.fileSize = fileSize;
  }
}

class AudioTrack extends MediaItem {
  constructor(title: string, durationSeconds: number, fileSize: number) {
    super(title, durationSeconds, fileSize);
  }

  durationMinutes(): number {
    return this.durationSeconds / 60;
  }
}

class Photo extends MediaItem {
  constructor(title: string, fileSize: number) {
    super(title, 0, fileSize); // duration is meaningless for a photo
  }
}
```

### After

```typescript
class MediaItem {
  protected title: string;
  protected fileSize: number;

  constructor(title: string, fileSize: number) {
    this.title = title;
    this.fileSize = fileSize;
  }
}

class AudioTrack extends MediaItem {
  private durationSeconds: number;

  constructor(title: string, durationSeconds: number, fileSize: number) {
    super(title, fileSize);
    this.durationSeconds = durationSeconds;
  }

  durationMinutes(): number {
    return this.durationSeconds / 60;
  }
}

class Photo extends MediaItem {
  constructor(title: string, fileSize: number) {
    super(title, fileSize);
  }
}
```

## When to Use

- A superclass field is only accessed by one or a few subclasses.
- The field does not represent a concept shared across the entire hierarchy.
- Other subclasses are forced to initialize the field with dummy or default values.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

