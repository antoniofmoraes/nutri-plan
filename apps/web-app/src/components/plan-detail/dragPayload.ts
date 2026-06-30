export const PLAN_ITEM_DRAG_TYPE = 'application/x-portio-plan-item';

export type PlanItemDragPayload =
  | { type: 'food'; id: string }
  | { type: 'preset'; id: string };

export function encodePlanItemDragPayload(payload: PlanItemDragPayload) {
  return JSON.stringify(payload);
}

export function parsePlanItemDragPayload(value: string): PlanItemDragPayload | null {
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
