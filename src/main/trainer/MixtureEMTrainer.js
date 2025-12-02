import { Each } from "@fizzwiz/fluent";
import { Trainer } from "../rationale/Trainer.js";
import { PDistribution } from "../model/PDistribution.js";

/**
 * A generic Expectation–Maximization (EM) step for mixture models.
 *
 * MixtureEMTrainer operates on an empirical distribution of observed points and
 * a set of mixture components, each providing a `likelihood(point)` method.
 *
 * The trainer performs one mixture-update iteration:
 *
 * 1. **Expectation step (E-step)**  
 *    For each observed point x, compute the posterior responsibility:
 *        r(i | x) ∝ mixture[i].likelihood(x)
 *
 *    This gives the fraction of each point’s weight that should be assigned
 *    to component i.
 *
 * 2. **Maximization step (M-step)**  
 *    For each component i, construct a new weighted empirical distribution:
 *        w_i(x) = w(x) * r(i | x)
 *
 *    and pass it to the modeller to obtain the updated component model:
 *        newModel[i] = modeller.model(weightedObservation_i)
 *
 * The modeller determines the parametric form of each mixture component
 * (e.g., Gaussian, exponential, etc.).
 */
export class MixtureEMTrainer extends Trainer {

    /**
     * A probability distribution of observed points:
     *   PDistribution(repr).addAll(observation)
     *
     * Keys are points (normalized by `repr`), and values are weights.
     * @type {PDistribution}
     */
    observation;

    /**
     * Function that creates a statistical model from a weighted observation.
     * It must support:
     *     modeller.model(iterableOf([point, weight]))
     *
     * @type {{ model(observation: Iterable<[any, number]>): any }}
     */
    modeller;

    /**
     * @param {PDistribution} observation
     *      Weighted observation of the form [point, weight].
     *
     * @param {{ model(observation: Iterable<[any, number]>): any }} modeller
     *      Object responsible for computing the best-fit model for
     *      a weighted observation.
     */
    constructor(observation, modeller) {
        super();

        this.observation = observation;
        this.modeller = modeller;
    }

    /**
     * Performs one EM iteration on the mixture.
     *
     * 1. **E-step:**  
     *    For each observed point x, compute the posterior responsibilities:
     *        r_i(x) = p(i | x) ∝ mixture[i].likelihood(x)
     *
     *    This yields one PDistribution per point.
     *
     * 2. **M-step:**  
     *    For each component i:
     *      - reweight each point x by its responsibility r_i(x)
     *      - build a new weighted observation
     *      - fit a new model using the modeller
     *
     * @param {Iterable<any>} mixture
     *      Iterable of models, each supporting:
     *          model.likelihood(point)
     *
     * @returns {Array<any>}
     *      Updated mixture models after one EM step.
     */
    step(mixture) {

        // --- E-step -------------------------------------------------------------
        // responsibilities[j] is a PDistribution over components for point j
        const responsibilities = this.observation.trueSet
            .sthen(point => PDistribution.postProbability(mixture, point))
            .toArray();

        // --- M-step -------------------------------------------------------------
        const updated = Each.as(mixture)
            .sthen((_, componentIndex) => {

                // For each original point j,
                // weight it by the probability that this component has generated it
                const conditional = this.observation.map(
                    (_, __, j) => responsibilities[j].p(componentIndex)
                );

                // Fit new component parameters
                return this.modeller.model(conditional);
            })
            .toArray();

        return updated;
    }

    /**
     * Iteratively trains a mixture of models until convergence or maxSteps is reached.
     *
     * Convergence is evaluated by comparing the per–model conditional post–probability
     * distributions between successive iterations.
     * 
     * Each model is annotated with:  model.conditionedObservation
     *
     * @param {Array<Model>} mixture - Initial mixture of models
     * @param {number} convergenceLevel - Similarity threshold for convergence (0–1)
     * @param {number} maxSteps - Maximum number of training iterations
     * @returns {Array<Model>} - The latest (possibly converged) mixture of models
     */
    trained(mixture, convergenceLevel = 0.85, maxSteps = 16) {
        let prevMixture = null;

        const hasConverged = currentMixture => {
            
            // Attach conditional observation to each model
            currentMixture.forEach(model => {
                model.conditionedObservation = 
                    this.observation.post(model);
            });

            // If we have a previous mixture, compare similarities
            if (prevMixture) {
                const allConverged = currentMixture.every((model, i) =>
                    model.conditionedObservation.similarity(
                        prevMixture[i].conditionedObservation
                    ) >= convergenceLevel
                );

                if (allConverged) return true;
            }

            // Store the current mixture for next iteration
            prevMixture = currentMixture; 

            return false;
        };

        return this.train(mixture)   // returns an iterable of mixtures
            .which((mix, step) => 
                hasConverged(mix) || step + 1 >= maxSteps
            )
            .what(); // returns the earliest mixture satisfying the condition
    }

    /**
     * Produces random mixture of models concurring in explaining the observation.
     * Each model is annotated with its .conditionedObservation 
     * @param {number} nModels
     * @param {*} factor 
     */
    rnd(nModels, convergenceThreshold = 0.85, maxSteps = 16) {
        const sample = this.observation.samples().when(nModels, false).toArray(); // one random point per model to train
        const mixture = sample.map(point => this.modeller.model(this.observation, point));
        return this.trained(mixture, convergenceThreshold, maxSteps);
    }


}
