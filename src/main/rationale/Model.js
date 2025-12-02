import { Each } from "@fizzwiz/fluent";
import { Rationale } from "../core/Rationale.js";

/**
 * A **Model** represents a generative or probabilistic structure.
 *
 * It provides two essential capabilities:
 *
 * - **likelihood(obs)**  
 *   Returns a score proportional to P(obs | model).
 *
 * - **sample()**  
 *   Draws a random sample according to the model's distribution.
 *
 * This class is abstract: subclasses must implement `likelihood(obs)` and `sample()`.
 */
export class Model extends Rationale {

    /**
     * Returns a likelihood score for the given observation under this model.
     * @abstract
     */
    likelihood(obs) {
        throw new Error("Abstract method: likelihood(obs) must be implemented");
    }

    /**
     * Draws a random sample according to the model.
     * @abstract
     */
    sample() {
        throw new Error("Abstract method: sample() must be implemented");
    }

    /**
     * Returns a lazy infinite sequence of independent samples drawn
     * from this model.
     *
     * The sequence is represented as an `Each` instance, so it supports
     * the full fluent API (if(), sthen(), else(), when(), etc.).
     *
     * Each call to `.sample()` is performed on-demand.  
     * No samples are pre-computed, and iteration may continue indefinitely.
     *
     * **Example:**
     * ```js
     * const samples = model.samples().when(5, false).toArray();
     * // → [x1, x2, x3, x4, x5]
     * ```
     *
     * @returns {Each<any>}
     *     A lazy infinite `Each` iterable producing samples of the model.
     */
    samples() {
        const self = this;
        return Each.as(function*() {
            while (true) yield self.sample();
        }());
    }

}
