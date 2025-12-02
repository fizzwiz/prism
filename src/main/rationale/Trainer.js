import { Each } from "@fizzwiz/fluent";

/**
 * Abstract base class representing an iterative refinement process.
 *
 * A Trainer defines how an object (called the "state" or "model") is improved
 * step-by-step.  The core responsibility is:
 *
 *   - `step(state)` performs *one* update/improvement.
 *   - `train(initialState)` returns the infinite (or finite-terminating) sequence
 *      obtained by repeatedly applying `step`.
 *
 * Subclasses implement the actual update rule in `step()`.
 */
export class Trainer {

    /**
     * Performs a single refinement/update step on the given state.
     * Must be implemented by subclasses.
     *
     * @abstract
     * @param {*} state - The current state to update.
     * @returns {*} The updated/improved state.
     */
    step(state) {
        throw new Error('Trainer.step() is abstract: subclasses must implement it');
    }

    /**
     * Returns an iterable representing the full improvement trajectory starting
     * from the given initial state.  At each iteration the next state is produced
     * by applying `step` to the previous one.
     *
     * This does not impose termination: the returned iterable may be infinite.
     *
     * @param {*} initialState - The starting state before any updates.
     * @returns {Iterable<*>} An iterable sequence of progressively updated states.
     */
    train(initialState) {
        return Each.along(initialState, this.step.bind(this));
    }
}
