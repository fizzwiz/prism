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
 * @abstract
 */
export class Run {
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

}
