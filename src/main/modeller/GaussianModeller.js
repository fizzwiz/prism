import { Each } from "@fizzwiz/fluent";
import { GaussianModel } from "../model/GaussianModel.js";
import { PDistribution } from "../model/PDistribution.js";

/**
 * Gaussian Modeller:
 * Generates a GaussianModel from a set (iterable) of observations (points).
 */
export class GaussianModeller {

    /**
     * Returns the best-fit Gaussian model for the given observation.
     *
     * The observation must be an iterable of entries:
     *      [point, weight]
     *
     * Each `point` may be:
     *   - a number,
     *   - an array of numbers,
     *   - any iterable producing numbers.
     *
     * Each `weight` must be convertible to a number.  
     * Entries with non-positive weights are ignored.
     *
     * The function automatically normalizes all points into numeric arrays.
     *
     * @param {PDistribution} observation
     *     PDistribution of points. Points may be numbers,
     *     arrays, or arbitrary iterables.
     *
     * @returns {GaussianModel}
     *     A GaussianModel containing the weighted mean vector and covariance matrix.
     *
     * @throws {Error}
     *     If `observation` is empty or contains no positive-weight entries.
     */
    model(observation, mean = undefined) {
        
        const sumW = observation.trueSet.n();
        if (sumW === 0) {
            throw new Error("Gaussian.model: all weights are zero or negative");
        }

        if (mean !== undefined && !Array.isArray(mean)) mean = Each.as(mean).toArray();
        const first = observation.trueSet.peek();
        const dim = Each.as(first).toArray().length;   // handle simple number D1

        if (!mean) {
            mean = Array(dim).fill(0);
            for (let [point, weight] of observation.entries()) {

                if (weight <= 0) continue;            
                if (!Array.isArray(point)) point = Each.as(point).toArray();

                for (let i = 0; i < point.length; i++) {
                    mean[i] += weight * point[i];
                }
            }

            // Normalize mean
            for (let i = 0; i < mean.length; i++) {
                mean[i] /= sumW;
            }
        }

        // Second pass: compute covariance
        const cov = Array.from({ length: dim }, () => Array(dim).fill(0));

        for (let [point, weight] of observation.entries()) {
            
            if (weight <= 0) continue;
            if (!Array.isArray(point)) point = Each.as(point).toArray(); 

            for (let j = 0; j < dim; j++) {
                const dj = point[j] - mean[j];
                for (let k = 0; k < dim; k++) {
                    cov[j][k] += weight * dj * (point[k] - mean[k]);
                }
            }
        }

        // Normalize covariance
        for (let j = 0; j < dim; j++) {
            for (let k = 0; k < dim; k++) {
                cov[j][k] /= sumW;
            }
        }

        // Regularize covariance to ensure positive-definiteness
        const eps = 1e-12;
        for (let j = 0; j < dim; j++) {
            cov[j][j] += eps;
        }

        return new GaussianModel(mean, cov);

    }


}