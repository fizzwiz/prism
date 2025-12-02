/**
 * Abstract base class representing a **Rationale** to be injected into a calculus.
 *
 * A Rationale encapsulates the logic behind:
 * - **Generation** of new items,
 * - **Evaluation** of items (e.g., scoring or assigning `.value`),
 * - **Partitioning** of items into populations.
 *
 * Concrete subclasses typically define the *purpose* of the rationale and may
 * organize multiple specialized strategies under that purpose.
 *
 * For example, an `Evaluator` rationale may define an abstract method:
 *
 *    eval(item, run)
 *
 * and then provide various concrete evaluators such as:
 * - `BayesEvaluator`
 * - etc.
 *
 * Each Rationale subclass customizes the logic of generation, evaluation, or partitioning
 * while remaining fully pluggable into any calculus engine that expects a
 * function.
 *
 * The core method is `toFunc()`, which returns a function consumable by the
 * calculus engine (e.g., `PopRace`).  
 * The returned function may leverage:
 * - preprocessed state stored inside the Rationale instance, and
 * - helper methods defined in the subclass.
 *
 * ## Example
 * ```js
 * class BayesEvaluator extends Evaluator {  // Evaluator extends Rationale
 *   constructor(observation) {
 *     super();
 *     this.observation = observation;
 *   }
 *
 *   model(item) {
 *     // Convert the item into a model representation (possibly using the observation)
 *   }
 *
 *   prior(model) {
 *     // Prior likelihood of the model: P(model)
 *   }
 *
 *   likelihood(model) {
 *     // Likelihood of the observation given the model: P(observation | model)
 *   }
 * 
 *   eval(item) {
 *      const model = this.model(item);
 *       // Posterior up to normalization:
 *       //    P(model | observation) ∝ P(observation | model) * P(model)
 *       return this.likelihood(model) * this.prior(model);
 *   }
 * 
 *   toFunc() { return item => this.eval(item); }
 * ```
 *
 * @abstract
 */
export class Rationale {
    /**
     * Converts this Rationale into a function consumable by a calculus engine.
     *
     * @abstract
     * @returns {Function}
     *   A function to be used as a generator, evaluator, or partitioner
     *   inside PopRace or another combinatorial calculus.
     */
    toFunc() {
        throw new Error('Abstract method "Rationale.toFunc()" must be implemented by subclasses');
    }
}
