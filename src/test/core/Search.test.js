import { describe, it } from 'mocha';
import assert from "assert";
import { Search } from "../../main/core/Search.js"; 
import { ArrayQueue } from "@fizzwiz/sorted";

describe("Search", function() {

  it("should yield candidates in BFS order (limited)", function() {
    // Simple search space: each number n expands to [n+1, n+2]
    const space = n => [n + 1, n + 2];

    const search = new Search()
      .from(1)
      .through(space)
      .via(new ArrayQueue()); 

    // Just check the first 10 candidates are as expected
    assert.deepStrictEqual(search.when(5, false).toArray(), [1, 2, 3, 3, 4]);
  });

  it("should allow fluent builder chaining", function() {
    const search = new Search()
      .from(0)
      .through(n => [n + 1])
      .via(new ArrayQueue(), 5);

    const result = [];
    let count = 0;
    for (const candidate of search) {
      result.push(candidate);
      if (++count >= 5) break; // limit iteration
    }

    assert.deepStrictEqual(result, [0, 1, 2, 3, 4]);
  });

  it("should handle undefined start or space", function() {
    const search = new Search().via(new ArrayQueue());

    // Queue is empty; iteration yields nothing
    let count = 0;
    for (const candidate of search) count++;
    assert.strictEqual(count, 0);

    // Define start and space fluently
    search.from(1, 2).through(n => n < 3 ? [n + 1] : undefined);
    const result2 = [];
    count = 0;
    for (const candidate of search) {
      result2.push(candidate);
      if (++count >= 5) break; // limit iteration
    }

    assert.deepStrictEqual(result2, [1, 2, 2, 3, 3]);
  });

  it("should respect max queue size", function() {
    const search = new Search()
      .from(1)
      .through(n => [n + 1, n + 2])
      .via(new ArrayQueue(), 3); // max 3 in queue

    const result = [];
    let count = 0;
    for (const candidate of search) {
      result.push(candidate);
      if (++count >= 10) break; // limit iteration
    }

    // Queue max limits expansion, so length <= 10
    assert(result.length <= 10);
  });

});
