import { UncertaintyEvaluator } from "../evaluator/UncertaintyEvaluator.js";

/**
 * Utility class for evaluating the uncertainty of a Mixture,
 * where a Mixture is an iterable of models, each providing a `.center`.
 *
 * This class overrides the `eval()` method of `UncertaintyEvaluator`
 * so that it accepts a mixture of models directly. Each model is mapped
 * to a posterior PDistribution via:
 *
 *      PDistribution.postProbability(mixture, model.center)
 *
 * The inherited evaluator then aggregates the entropies of all such
 * PDistributions using arithmetic or geometric mean logic.
 */
export class MixtureUncertaintyEvaluator extends UncertaintyEvaluator {
    
    constructor(geometric = false, normalize = true) {
        super(geometric, normalize);
    }

    /**
     * Evaluates the uncertainty of a mixture of models.
     * Each model must provide a `.center` which is used to compute its
     * posterior distribution relative to the whole mixture.
     *
     * @param {Iterable<Model>} mixture Iterable of models, each with `.center`.
     * @returns {number} Aggregated entropy of the induced PDistributions.
     */
    eval(mixture) {

        const pDistrs = [];

        for (const model of mixture) {
            const p = PDistribution.postProbability(mixture, model.center);
            pDistrs.push(p);
        }

        // Delegate to UncertaintyEvaluator.eval(PDistributions)
        return super.eval(pDistrs);
    }
}
