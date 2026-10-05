import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
test("service worker never caches private pages, mutations or external requests", async () => {
  const handlers: Record<
    string,
    (event: {
      request: Record<string, string>;
      respondWith: (response: Promise<Response>) => void;
    }) => void
  > = {};
  const fallback = new Response("offline");
  const context = {
    URL,
    Response,
    self: {
      location: { origin: "https://roohanamin.com" },
      addEventListener: (name: string, handler: (typeof handlers)[string]) => {
        handlers[name] = handler;
      },
    },
    caches: {
      match: async (path: string) => {
        assert.equal(path, "/offline.html");
        return fallback;
      },
    },
    fetch: async () => new Response("private account data"),
  };
  vm.runInNewContext(
    await readFile(new URL("../public/sw.js", import.meta.url), "utf8"),
    context,
  );
  let response: Promise<Response> | undefined;
  const respondWith = (value: Promise<Response>) => {
    response = value;
  };
  handlers.fetch({
    request: {
      url: "https://roohanamin.com/weight",
      method: "GET",
      mode: "navigate",
    },
    respondWith,
  });
  assert.equal(await (await response!).text(), "private account data");
  context.fetch = async () => {
    throw new Error("offline");
  };
  handlers.fetch({
    request: {
      url: "https://roohanamin.com/weight",
      method: "GET",
      mode: "navigate",
    },
    respondWith,
  });
  assert.equal(await (await response!).text(), "offline");
  response = undefined;
  handlers.fetch({
    request: {
      url: "https://roohanamin.com/weight",
      method: "POST",
      mode: "cors",
    },
    respondWith,
  });
  assert.equal(response, undefined);
  handlers.fetch({
    request: {
      url: "https://example.supabase.co/rest/v1/weight_entries",
      method: "GET",
      mode: "cors",
    },
    respondWith,
  });
  assert.equal(response, undefined);
});
