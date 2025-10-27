// test/core/AsyncSearch.test.js
import assert from "assert";
import { AsyncSearch } from "../../main/core/AsyncSearch.js";
import { ArrayQueue } from "@fizzwiz/sorted";

describe("AsyncSearch", () => {

  it("should yield candidates in BFS order (flattened)", async () => {
    const search = new AsyncSearch()
      .from(1)
      .through(async n => (n < 4 ? [n + 1, n + 2] : []))
      .via(new ArrayQueue(), 20)
      .inParallel(2);

    const results = [];
    for await (const item of search) {
      results.push(item);
      if (results.length >= 7) break; // stop early to avoid infinite expansion
    }

    // BFS expansion: [1], then [2,3], then [3,4], then [4,5]...
    assert.deepStrictEqual(results, [1, 2, 3, 3, 4, 4, 5]);
  });

  it("should yield batches of candidates in batchIterator", async () => {
    const search = new AsyncSearch()
      .from(0)
      .through(async n => (n < 3 ? [n + 1] : []))
      .via(new ArrayQueue(), 10)
      .inParallel(2);

    const batches = [];
    for await (const batch of search.batchIterator()) {
      batches.push(batch);
      if (batches.length >= 3) break;
    }

    // Expect batches of up to 2 (cores) candidates
    assert.ok(batches.every(b => Array.isArray(b)));
    assert.ok(batches.every(b => b.length <= 2));
    assert.deepStrictEqual(batches[0], [0]); // start batch
  });

  it("should allow fluent builder chaining", async () => {
    const results = [];
    const search = new AsyncSearch()
      .from(1)
      .through(async n => (n < 5 ? [n + 1] : []))
      .via(new ArrayQueue(), 10)
      .inParallel(3);

    for await (const item of search) {
      results.push(item);
      if (results.length >= 5) break;
    }

    assert.deepStrictEqual(results, [1, 2, 3, 4, 5]);
  });
  
  it("should respect max queue size", async () => {
    const max = 3;
    const search = new AsyncSearch()
      .from(1)
      .through(async n => [n + 1, n + 2])
      .via(new ArrayQueue(), max) // enforce queue cap
      .inParallel(2);
  
    let i = 0;
    const maxIterations = 20 * max; // safety guard
  
    for await (const item of search) {
      // The queue should never exceed `max` after any expansion
      assert.ok(search.queue.n() <= max, `Queue exceeded max size: ${search.queue.n()}`);
      
      i++;
      if (i >= maxIterations) break;
    }
  });
  
});
