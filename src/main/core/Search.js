import { Each } from "@fizzwiz/fluent";

/**
 * Base class for defining declarative, lazy algorithms.
 *
 * A `Search` defines a non-executable local process that explores
 * candidate solutions via lazy iteration. Each candidate is
 * produced on-demand through a queue-driven exploration strategy.
 *
 * Features:
 * - Define initial candidates via {@link from}
 * - Describe expansion of candidates via {@link through}
 * - Control exploration order with {@link via}
 * - Limit branching using {@link max}
 *
 * Transformation and termination are fluent, leveraging methods from {@link Each}.
 */
export class Search extends Each {

  /** 
   * Initial candidates to seed the search. 
   * @type {Iterable|undefined}
   */
  start;

  /**
   * Expansion function describing the search space.
   * Should return an iterable of new candidates or `undefined` to stop expansion.
   * @type {function(*): (Iterable|undefined)|undefined}
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
   * Create a new `Search` instance.
   *
   * @param {Iterable} [start] Initial candidates.
   * @param {function(*): (Iterable|undefined)} [space] Expansion function.
   * @param {Object} [queue] Queue instance controlling iteration order.
   * @param {number} [max] Maximum queue size.
   */
  constructor(start = undefined, space = undefined, queue = undefined, max = undefined) {
    super();
    this.start = start;
    this.space = space;
    this.queue = queue;
    this.max = max;
  }

  // ─── Fluent Builder Methods ──────────────────────────────────

  /**
   * Define the starting candidates for the search.
   *
   * @param {...*} starts One or more initial candidates.
   * @returns {Search} The current search instance (for chaining).
   */
  from(...starts) { 
    this.start = starts; 
    return this; 
  }

  /**
   * Define the expansion logic (search space).
   *
   * @param {function(*): (Iterable|undefined)} space Function describing the search space.
   * @returns {Search} The current search instance (for chaining).
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
   * @returns {Search} The current search instance (for chaining).
   */
  via(queue, max = undefined) {
    this.queue = queue;
    if (max !== undefined) this.max = max;
    return this;
  }

  // ─── Iterator Logic ─────────────────────────────────────────

  /**
   * Lazily iterate over candidate items, expanding them according
   * to the queue strategy and space function.
   *
   * @yields {*} The next candidate in the search process.
   * @throws {Error} If the expansion function fails or returns invalid data.
   */
  *[Symbol.iterator]() {
    const queue = this.queue;
    const space = this.space;
    const starts = Each.as(this.start);
    const max = this.max;

    queue.clear();
    queue.addAll(starts);

    while (queue.n() > 0) {
      const item = queue.poll();

      // Expand search space
      let more;
      try {
        more = space(item);
      } catch (err) {
        throw new Error(`Search expansion failed at item: ${item}\n${err}`);
      }

      if (more !== undefined) {
        queue.addAll(Each.as(more));
        if (max !== undefined) queue.select(max);
      }

      yield item;
    }
  }
}
