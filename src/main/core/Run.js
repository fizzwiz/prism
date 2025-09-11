import { What } from "@fizzwiz/fluent";

/**
 * Abstract base class for all locally executable processes.
 *
 * A `Run` encapsulates a focused, executable idea capable of solving
 * a category of problems through a defined algorithm.
 *
 * Subclasses must implement the `run()` method, which represents
 * the core computation. The execution can:
 * - Return a result directly (e.g., a value, object, or structure), or
 * - Mutate internal state and return `this` for fluent chaining.
 *
 * By extending `What`, `Run` inherits the `what()` interface,
 * which defaults to invoking `run()`.
 *
 * @abstract
 */
export class Run extends What {
    /**
     * Executes the computation defined by the subclass.
     * This method must be overridden in all concrete implementations.
     *
     * @abstract
     * @returns {Run|any} Either:
     *   - A computed result, or
     *   - `this` for fluent chaining if the computation mutates state.
     * @throws {Error} If not implemented in subclass.
     */
    run() {
        throw new Error("Abstract method 'run()' must be implemented by subclasses.");
    }

    /**
     * Invokes the `run()` method. This provides a standard entry point
     * when treating the process abstractly as a `What`.
     *
     * Subclasses may override to customize the entry point behavior
     * (e.g., pre/post-processing around `run()`).
     *
     * @returns {Run|any} The result of execution.
     */
    what() {
        return this.run();
    }

}
