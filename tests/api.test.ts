import test from "node:test";
import assert from "node:assert/strict";
import { parseJsonResponse } from "../src/lib/api.ts";

test("interpreta JSON puro", () => {
  assert.deepEqual(parseJsonResponse('{"headline":"Teste"}'), { headline: "Teste" });
});
test("remove cercas markdown antes de interpretar", () => {
  assert.deepEqual(parseJsonResponse('```json\n{"headline":"Teste"}\n```'), { headline: "Teste" });
});
test("retorna erro amigável para resposta inválida", () => {
  assert.throws(() => parseJsonResponse("não é json"), /resposta incompleta/);
});
