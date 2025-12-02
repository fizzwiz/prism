/**
 * A Bayesian evaluator that assigns to each generated item a scalar `value`
 * proportional to the *posterior likelihood* of its associated model.
 *
 * ## Overview
 * For each item, the evaluator builds a `model = model(item)` and computes:
 *
 *    item.value = posterior(model | observation)
 *               ∝ likelihood(observation | model) * prior(model)
 *
 * This follows the standard Bayesian relation:
 *
 *    posterior(model | observation)
 *      = likelihood(observation | model) * prior(model)
 *        ------------------------------------------------
 *               evidence(observation)
 *
 * Since the evidence does not depend on the model and is constant across items,
 * the evaluator omits it and uses the *unnormalized posterior* as the score.
 *
 *
 * ## Required Methods
 * The evaluator object must implement:
 *
 * - `model(item) : Model`
 *      Builds a model representation from a race item.
 *
 * - `likelihood(observation, model) : number`
 *      Returns the likelihood `P(observation | model)`.
 *
 * - `prior(model) : number`
 *      Returns the prior probability `P(model)`.
 *
 *
 * ## Evaluation Process
 * For each generated item:
 *
 *    const m = model(item);
 *    const L = likelihood(observation, m);
 *    const P = prior(m);
 *    item.value = L * P;
 *
 * This value is used by the PopRace classifier to order items within partitions.
 *
 *
 * ## Notes
 * - All returned values should be non-negative.
 * - To prevent underflow in high-dimensional models, using log-likelihoods is recommended.
 * - If log-likelihoods are used, the caller should define:
 *        item.value = log(L) + log(P)
 *   and ensure the sorter uses descending order.
 */
export class BayesEvaluator {
    
}