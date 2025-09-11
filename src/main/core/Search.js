import { Each } from "@fizzwiz/fluent";
import { ArrayQueue } from "@fizzwiz/sorted";

/**
 * Base class for defining declarative, lazy algorithms.
 *
 * A `Search` defines a non-executable local process that explores
 * candidate solutions via lazy iteration. Each candidate is
 * produced on-demand through a queue-driven exploration strategy.
 *
 * Features:
 * - Define initial candidates via {@link start}
 * - Describe expansion of candidates via {@link space}
 * - Control exploration order with {@link queue}
 * - Limit branching using {@link max}
 *
 * Transformation and termination are fluent, leveraging methods from {@link Each}.
 *
 */
export class Search extends Each {

  /** Initial candidates to seed the search. */
  start;

  /**
   * Expansion function describing the search space.
   * Must be (candidate:any) => Iterable|undefined
   */
  space;

  /** Queue controlling search order (BFS, DFS, priority, etc.). */
  queue;

  /** Maximum queue size (limits branching). */
  max;

  constructor(start = undefined, space = undefined, queue = new ArrayQueue(), max = 256) {
    super();
    this.start = start;
    this.space = space;
    this.queue = queue;
    this.max = max;
  }

  // ─── Fluent Builder Methods ──────────────────────────────────

  /** Define starting candidates. */
  from(start) { this.start = start; return this; }

  /** Define expansion logic (search space). */
  through(space) { this.space = space; return this; }

  /**
   * Define the queue strategy and (optionally) a new max size.
   * @param {ArrayQueue} queue Queue implementation
   * @param {number} [max] Optional new maximum
   */
  via(queue, max = undefined) {
    this.queue = queue;
    if (max !== undefined) this.max = max;
    return this;
  }

  // ─── Iterator Logic ─────────────────────────────────────────

  /**
   * Lazily iterate over candidates, expanding according to
   * the queue and space function.
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
        more = typeof space === "function" ? space(item) : undefined;
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
