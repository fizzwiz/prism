import { BayesEvaluator } from "./BayesEvaluator.js";

/**
 * Evals any iterations of models over a given observation.
 * The method .converge(model) reshapes the model based on the observation
 */
export class MixtureEvaluator extends BayesEvaluator {
    /** A probability distribution of points */
    observation;

    constructor(observation, modeller) {
        this.observation = observation;
    }

    eval(mixture) {

    }

}