import { describe, expect, it } from "vitest";
import { parseDecimalInput } from "./utils";

describe("parseDecimalInput", () => {
  it("aceita separador decimal com vírgula", () => {
    expect(parseDecimalInput("12,5")).toBe(12.5);
  });

  it("aceita separador decimal com ponto", () => {
    expect(parseDecimalInput("12.5")).toBe(12.5);
  });

  it("rejeita valores que não são números finitos", () => {
    expect(parseDecimalInput("12,5,3")).toBeNull();
    expect(parseDecimalInput("Infinity")).toBeNull();
  });
});
