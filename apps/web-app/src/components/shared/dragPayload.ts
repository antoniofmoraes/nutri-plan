export const LIBRARY_ITEM_DRAG_TYPE = 'application/x-portio-library-item';

export type LibraryItemDragPayload =
  | { type: 'food'; id: string }
  | { type: 'preset'; id: string };

export function encodeLibraryItemDragPayload(payload: LibraryItemDragPayload) {
  return JSON.stringify(payload);
}

export function parseLibraryItemDragPayload(value: string): LibraryItemDragPayload | null {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'type' in parsed &&
      'id' in parsed &&
      (parsed.type === 'food' || parsed.type === 'preset') &&
      typeof parsed.id === 'string'
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function hasLibraryItemDragPayload(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(LIBRARY_ITEM_DRAG_TYPE);
}
