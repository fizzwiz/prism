import { EventEmitter } from "events";

/**
 * Abstract base class for all locally executable processes.
 *
 * A `Run` instance represents a focused executable unit of logic.
 * Subclasses must implement the `run()` method, which performs the
 * main computation.
 *
 * Execution may:
 *  - Return a computed value
 *  - Return `this` (for fluent chaining)
 *  - Emit lifecycle or custom events
 *
 * Events typically used:
 *  - "start"      → invoked just before computation
 *  - "step"       → invoked periodically during execution
 *  - "end"        → invoked after successful completion
 *
 * This base class enforces the presence of `run()` in subclasses.
 */
export class Run extends EventEmitter {
    /**
     * Creates a new Run instance.
     * Subclasses may define their own parameters and internal state.
     */
    constructor() {
        super();
    }

    /**
     * Executes the algorithm implemented by the subclass.
     *
     * @abstract
     * @returns {any|Run} A computed result OR this instance.
     * @throws {Error} If the subclass does not override this method.
     */
    run() {
        throw new Error(
            `Abstract method "run()" must be implemented in ${this.constructor.name}.`
        );
    }

}
