import { AsyncEach } from "@fizzwiz/fluent";

/**
 * Base class for defining declarative, asynchronous lazy algorithms.
 *
 * `AsyncSearch` defines a process that can span multiple machines,
 * exploring candidate solutions via asynchronous lazy iteration. 
 * Candidates are produced on-demand through a local queue, while 
 * the expansion function may execute asynchronously across different machines.
 *
 * Features:
 * - Define initial candidates via {@link from}
 * - Describe asynchronous expansion of candidates via {@link through}
 * - Control exploration order with {@link via}
 * - Limit branching using {@link max}
 * - Limit concurrency using {@link inParallel}
 *
 * Internally, the search iterates in **batches of candidates**, each up to {@link cores} in size,
 * which are expanded in parallel. Through `[Symbol.asyncIterator]()`,
 * `AsyncSearch` yields **individual candidates** in a flattened stream,
 * maintaining semantic consistency with the synchronous {@link Search}.
 *
 * Candidate transformation and iteration termination are fluent,
 * leveraging methods from {@link AsyncEach}.
 * 
 */
export class AsyncSearch extends AsyncEach {

  /** 
   * Initial candidates to seed the search.
   * Can be an array, an async iterable, a promise, or an `AsyncEach` instance.
   * @type {Iterable|AsyncIterable|Promise<Iterable>|undefined}
   */
  start;

  /**
   * Expansion function describing the search space.
   * Should return an async iterable, iterable, or promise resolving to an iterable.
   * @type {function(*): (AsyncIterable|Iterable|Promise<Iterable>|undefined)|undefined}
   */
  space;

  /** 
   * Queue controlling search order (BFS, DFS, priority, etc.).
   * Must implement `.addAll()`, `.poll()`, `.clear()`, `.n()`, and optionally `.select()`.
   * @type {Object}
   */
  queue;

  /** 
   * Maximum queue size (limits branching).
   * @type {number|undefined}
   */
  max;

  /** 
   * Number of concurrent expansions per batch.
   * @type {number}
   */
  cores;

  /**
   * Create a new `AsyncSearch` instance.
   *
   * @param {Iterable|AsyncIterable|Promise<Iterable>} [start] Initial candidates.
   * @param {function(*): (AsyncIterable|Iterable|Promise<Iterable>|undefined)} [space] Expansion function.
   * @param {Object} [queue] Queue instance controlling iteration order.
   * @param {number} [max] Maximum queue size.
   * @param {number} [cores=16] Number of concurrent expansions per batch.
   */
  constructor(start = undefined, space = undefined, queue = undefined, max = undefined, cores = 16) {
    super();
    this.start = start;
    this.space = space;
    this.queue = queue;
    this.max = max;
    this.cores = cores;
  }

  // ─── Fluent Builder Methods ──────────────────────────────────

  /**
   * Define the starting candidates for the search.
   *
   * @param {...*} starts One or more initial candidates.
   * @returns {AsyncSearch} The current search instance (for chaining).
   */
  from(...starts) { 
    this.start = starts; 
    return this; 
  }

  /**
   * Define the asynchronous expansion logic (search space).
   *
   * @param {function(*): (AsyncIterable|Iterable|Promise<Iterable>|undefined)} space Function describing the search space.
   * @returns {AsyncSearch} The current search instance (for chaining).
   */
  through(space) { 
    this.space = space; 
    return this; 
  }

  /**
   * Define the queue strategy and optionally set a new maximum size.
   *
   * @param {Object} queue Queue implementation controlling exploration order.
   * @param {number} [max] Optional new maximum queue size.
   * @returns {AsyncSearch} The current search instance (for chaining).
   */
  via(queue, max = undefined) {
    this.queue = queue;
    if (max !== undefined) this.max = max;
    return this;
  }

  /**
   * Define the concurrency level (number of candidates processed in parallel).
   *
   * @param {number} cores Number of concurrent expansions.
   * @returns {AsyncSearch} The current search instance (for chaining).
   */
  inParallel(cores) { 
    this.cores = cores; 
    return this; 
  }

  // ─── Async Iterator Logic ────────────────────────────────────

  /**
   * Lazily iterate over candidates asynchronously in **batches**.
   * Each batch contains up to {@link cores} candidates.
   *
   * @async
   * @generator
   * @yields {Array<any>} A batch of candidates.
   * @throws {Error} If the expansion function fails or returns invalid data.
   */
  async *batchIterator() {
    const queue = this.queue;
    const space = this.space;
    const starts = this.start;
    const max = this.max;
    const batchLength = this.cores;

    queue.clear();
    queue.addAll(await AsyncEach.as(starts).toArray());

    while (queue.n() > 0) {
      // Poll the first `batchLength` items as the current batch
      const batch = queue.select(queue.n() - batchLength, false);

      // Expand search space concurrently
      let more;
      try {
        const expansions = await Promise.all(batch.map(space));
        more = (await AsyncEach.as(expansions).toArray()).flat();
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
   * @yields {*} Individual candidate.
   * @throws {Error} If the underlying batch iteration fails.
   */
  async *[Symbol.asyncIterator]() {
    for await (const batch of this.batchIterator()) {
      for (const candidate of batch) {
        yield candidate;
      }
    }
  }
}
