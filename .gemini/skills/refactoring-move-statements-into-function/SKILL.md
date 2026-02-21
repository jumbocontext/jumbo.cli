---
name: refactoring-move-statements-into-function
description: Use when the same statements appear at every call site of a function, indicating they logically belong inside the function itself.
---

# Move Statements into Function

**Prompt:** Apply the "Move Statements into Function" refactoring to absorb repeated code that always accompanies a function call directly into the function body, eliminating duplication.

*This technique was designed by Martin Fowler and is documented in his book "Refactoring: Improving the Design of Existing Code" (2nd Edition).*

## Motivation

When you see the same statements appearing at every call site of a function, that repetition is a sign that the statements belong inside the function itself. Duplication means that any change to the repeated logic must be made in multiple places, which is error-prone and increases maintenance cost. By moving those statements into the function, you establish a single source of truth and make each call site simpler and more intention-revealing.

## Mechanics

1. If the repeated code is not identical at every call site, first use Slide Statements to bring the repeated code next to the function call, then verify the code is identical.
2. If only one caller exists, simply cut the statements from the caller, paste them into the function, test, and stop.
3. For multiple callers, extract the combination of the repeated statements plus the original function call into a new function, using a temporary name.
4. Remove the duplicate statements from all call sites, replacing them with calls to the new function. Test after each change.
5. Apply Inline Function on the original function to fold it into the new function.
6. Rename the new function to the original name (or a better one).
7. Test.

## Example

### Before

```typescript
interface Photo {
  title: string;
  location: string;
  dateTaken: Date;
}

function emitPhotoHeader(outStream: string[], photo: Photo): void {
  outStream.push(`<h2>${photo.title}</h2>`);
}

function renderPhoto(outStream: string[], photo: Photo): void {
  emitPhotoHeader(outStream, photo);
  outStream.push(`<p>Location: ${photo.location}</p>`);
  outStream.push(`<p>Date: ${photo.dateTaken.toDateString()}</p>`);
}

function renderPhotoCard(outStream: string[], photo: Photo): void {
  emitPhotoHeader(outStream, photo);
  outStream.push(`<p>Location: ${photo.location}</p>`);
  outStream.push(`<p>Date: ${photo.dateTaken.toDateString()}</p>`);
  outStream.push(`<div class="card-footer"></div>`);
}
```

### After

```typescript
interface Photo {
  title: string;
  location: string;
  dateTaken: Date;
}

function emitPhotoHeader(outStream: string[], photo: Photo): void {
  outStream.push(`<h2>${photo.title}</h2>`);
  outStream.push(`<p>Location: ${photo.location}</p>`);
  outStream.push(`<p>Date: ${photo.dateTaken.toDateString()}</p>`);
}

function renderPhoto(outStream: string[], photo: Photo): void {
  emitPhotoHeader(outStream, photo);
}

function renderPhotoCard(outStream: string[], photo: Photo): void {
  emitPhotoHeader(outStream, photo);
  outStream.push(`<div class="card-footer"></div>`);
}
```

## When to Use

- The same statements appear before or after every call to a particular function.
- The repeated statements logically belong with the function and would always need to stay in sync with it.
- Moving the statements into the function would not cause unwanted side effects for any caller.

## Reference

This refactoring technique was originally cataloged by Martin Fowler in *Refactoring: Improving the Design of Existing Code* (2nd Edition). The examples above are original and created for instructional purposes.

