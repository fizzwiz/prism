/**
 * Computes the arithmetic or geometric mean entropy from an iterable of
 * PDistributions.
 *
 * Each PDistribution represents the posterior probability that a given model
 * belongs to each component of a mixture. These posteriors are typically
 * obtained via:
 *
 *      m → PDistribution.postProbability(mixture, m.center)
 *
 * The resulting sequence of PDistributions expresses, for each model, how
 * uncertain the mixture is about which component best explains its center.
 *
 * In many scenarios, the quality of a solution can be reduced to the aggregate
 * uncertainty of such a mixture. For example, after projecting a set of source
 * points into a continuous destination space, one might discretize that space
 * with a grid and assign each source point to one grid cell. Each assignment
 * induces a model centered at the matched location. The uncertainty of the
 * resulting mixture—formed by translating every model into its cell center—
 * can be evaluated by converting each model into its posterior distribution
 * and then aggregating their entropies.
 *
 * Arithmetic mean entropy measures *average* or *typical* uncertainty (OR-like).
 * Geometric mean entropy measures *consistent* or *unanimous* uncertainty
 * (AND-like): it is high only when *all* entropies are high.
 */
export class UncertaintyEvaluator extends Evaluator {

    geometric;
    normalize;

    /**
     * @param {boolean} geometric  Use geometric mean instead of arithmetic mean.
     * @param {boolean} normalize  If true, normalizes entropy to [0,1] using log(#components).
     */
    constructor(geometric = false, normalize = true) {
        super();
        this.geometric = geometric;
        this.normalize = normalize;
    }

    /**
     * Evaluates an iterable of PDistributions and returns their
     * arithmetic or geometric mean entropy.
     *
     * @param {Iterable<PDistribution>} pDistrs
     * @returns {number}
     */
    eval(pDistrs) {

        if (!Array.isArray(pDistrs)) pDistrs = [...pDistrs];
        if (pDistrs.length === 0)
            throw new Error("UncertaintyEvaluator.eval: at least one PDistribution is required.");

        // Number of mixture components (must come from the PDistribution)
        const first = pDistrs[0];
        const K = first.length ?? first.K ?? first.probs?.length;
        if (!K)
            throw new Error("UncertaintyEvaluator.eval: cannot determine number of mixture components.");

        const maxEntropy = Math.log(K);

        let sum = 0.0;

        for (const p of pDistrs) {

            let E = p.entropy();

            if (this.normalize && maxEntropy > 0)
                E /= maxEntropy;

            if (this.geometric) {
                if (E <= 0) return 0; // if any is zero, geometric mean is zero
                sum += Math.log(E);
            } else {
                sum += E;
            }
        }

        return this.geometric
            ? Math.exp(sum / pDistrs.length)
            : sum / pDistrs.length;
    }

}

