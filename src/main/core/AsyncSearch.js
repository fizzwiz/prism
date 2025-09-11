import { AsyncEach } from "@fizzwiz/fluent";
import { ArrayQueue } from "@fizzwiz/sorted";

/**
 * Base class for defining declarative, asynchronous lazy algorithms.
 *
 * `AsyncSearch` defines a process that can span multiple machines,
 * exploring candidate solutions via asynchronous lazy iteration. 
 * Candidates are produced on-demand through a local queue, while 
 * the expansion function may execute asynchronously across different machines.
 *
 * Features:
 * - Define initial candidates via {@link start}
 * - Describe async expansion of candidates via {@link space}
 * - Control exploration order with {@link queue}
 * - Limit branching using {@link max}
 * - Limit concurrency using {@link cores}, which can be dynamic at runtime
 *
 * Internally, the search iterates in **batches of candidates**, each up to {@link cores} in size,
 * which are expanded in parallel. Through `[Symbol.asyncIterator]()`,
 * `AsyncSearch` yields **individual candidates** in a flattened stream,
 * maintaining semantic consistency with the synchronous {@link Search}.
 *
 * Candidate transformation and iteration termination are fluent,
 * leveraging methods from {@link AsyncEach}.
 */
export class AsyncSearch extends AsyncEach {

  /** Initial candidates (or Promises or AsyncEach of candidates) to seed the search. */
  start;

  /**
   * Expansion function describing the search space. 
   * Must be `(candidate:any) => AsyncIterable|Iterable|Promise<Iterable>|undefined`.
   */
  space;

  /** Queue controlling search order. */
  queue;

  /** Maximum queue size (selects the best max candidates). */
  max;

    /**
     * Number of concurrent expansions per batch, or a function returning
     * a number (possibly async) to determine concurrency at runtime.
     *
     * @type {(number|function(): (number|Promise<number>))}
     */
  cores;

  constructor(start = undefined, space = undefined, queue = new ArrayQueue(), max = 256, cores = 16) {
    super();
    this.start = start;
    this.space = space;
    this.queue = queue;
    this.max = max;
    this.cores = cores;
  }

  // ─── Fluent Builder Methods ──────────────────────────────────

  from(start) { this.start = start; return this; }
  through(space) { this.space = space; return this; }
  via(queue, max = undefined) {
    this.queue = queue;
    if (max !== undefined) this.max = max;
    return this;
  }
  inParallel(cores) { this.cores = cores; return this; }

  // ─── Helper Methods ─────────────────────────────────────────

  /**
   * Resolve the number of concurrent expansions for this batch.
   * Ensures at least 1 candidate per batch.
   */
  async resolveCores() {
    let batchLength = typeof this.cores === 'number' ? this.cores : await this.cores();
    return Math.max(1, batchLength);
  }

  // ─── Async Iterator Logic ────────────────────────────────────

  /**
   * Lazily iterate over candidates asynchronously in **batches**.
   * Each batch contains up to {@link cores} candidates.
   *
   * @async
   * @generator
   * @yields {Array<any>} A batch of candidates
   */
  async *batchIterator() {
    const queue = this.queue;
    const space = this.space;
    const starts = this.start;
    const max = this.max;

    queue.clear();
    queue.addAll(await AsyncEach.as(starts).toArray());

    while (queue.n() > 0) {
      const batchLength = await this.resolveCores();

      // Poll the first `batchLength` items as the current batch
      const batch = queue.select(queue.n() - batchLength, false);

      // Expand search space concurrently
      let more;
      try {
        more = (await AsyncEach.as(await Promise.all(batch.map(space))).toArray()).flat();
      } catch (err) {
        throw new Error(`AsyncSearch expansion failed at batch: ${JSON.stringify(batch)}\n${err}`);
      }

      queue.addAll(more);
      if (max !== undefined) queue.select(max);

      yield batch;
    }
  }

  /**
   * Lazily iterate over candidates asynchronously, yielding **individual candidates**.
   * Flattens the batches from {@link batchIterator}, maintaining consistency
   * with the synchronous {@link Search}.
   *
   * @async
   * @generator
   * @yields {any} Individual candidate
   */
  async *[Symbol.asyncIterator]() {
    for await (const batch of this.batchIterator()) {
      for (const candidate of batch) {
        yield candidate;
      }
    }
  }
}
