import { What } from "@fizzwiz/fluent";
import { Run } from "../core/Run.js";

/**
 * Base class for convergence-based iterative algorithms.
 * 
 * A ConvergingRun starts from an initial value and repeatedly applies
 * a stepper function until a convergence condition is met or a maximum
 * number of iterations is reached.
 */
export class ConvergingRun extends Run {

    /**
     * @param {*} start - The initial value for the iteration.
     * @param {function(*): *} stepper - A function that returns the next value from the current one.
     * @param {function(*, *): boolean} convergenceChecker - A function that compares previous and current values and returns true if convergence has been reached.
     */
    constructor(start, stepper, convergenceChecker) {
        super();
        this._start = start;
        this._stepper = stepper;
        this._convergenceChecker = convergenceChecker;
        this._result = start;
    }

    /**
     * The initial value.
     * @returns {*}
     */
    get start() {
        return this._start;
    }

    /**
     * The most recent result after running.
     * @returns {*}
     */
    get result() {
        return this._result;
    }

    /**
     * The function that computes the next step.
     * @returns {function}
     */
    get stepper() {
        return this._stepper;
    }

    /**
     * The function that checks if the process has converged.
     * @returns {function}
     */
    get convergenceChecker() {
        return this._convergenceChecker;
    }

    /**
     * Whether the last known result is already converged.
     * @returns {boolean}
     */
    get hasConverged() {
        const next = What.what(this.stepper, this._result);
        return What.what(this.convergenceChecker, this._result, next);
    }

    /**
     * Executes the convergence loop.
     * Iterates up to `maxSteps` or until convergence is achieved.
     * 
     * @param {number} maxSteps - The maximum number of iterations to attempt.
     * @returns {ConvergingRun} The instance itself, for chaining.
     */
    run(maxSteps) {
        let prev = this._result;

        for (let i = 0; i < maxSteps; i++) {
            const next = What.what(this.stepper, prev);
            const done = What.what(this.convergenceChecker, prev, next);
            if (done) break;
            prev = next;
        }

        this._result = prev;
        return this;
    }

}
