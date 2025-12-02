import { CenteredModel } from "./CenteredModel.js";

/**
 * An **Interval** represents a hyper-rectangle (axis-aligned bounding box)
 * in ℝⁿ defined by a start and end point.
 *
 * It is a PointModel whose center is the midpoint of the interval.
 *
 * - `likelihood(point)` returns 1 or 0 indicating whether
 *   each coordinate lies inside the interval.
 *
 * - `sample()` returns a uniformly sampled point inside the interval.
 */
export class Interval extends CenteredModel {

    /**
     * @param {number|number[]} start  Lower bound(s) of the interval.
     * @param {number|number[]} end    Upper bound(s) of the interval.
     */
    constructor(start, end) {
        if (!Array.isArray(start)) start = [start];
        if (!Array.isArray(end))   end   = [end];

        if (start.length !== end.length) {
            throw new Error(`Interval: 'start' and 'end' must have same dimension`);
        }

        const dim = start.length;
        const midpoint = start.map((a, i) => (a + end[i]) / 2);

        super(midpoint);

        this.start = start;
        this.end = end;
        this.dim = dim;
    }

    /**
     * Computes the likelihood of a point under this interval model.
     *
     * The interval represents an n-dimensional half-open hyperrectangle:
     *    [start[0], end[0]) × ... × [start[n-1], end[n-1])
     *
     * The likelihood is:
     *   - **1** if the point lies inside the interval in every dimension  
     *   - **0** otherwise
     *
     * @param {number[]} point
     *     An n-dimensional coordinate to evaluate.
     *
     * @returns {number}
     *     1 if `point` is inside the interval, 0 otherwise.
     */
    likelihood(point) {
        return point.every((x, i) =>
            this.start[i] <= x && x < this.end[i]
        ) ? 1 : 0;
    }


    /**
     * Uniformly samples a point inside the interval.
     *
     * @returns {number[]}
     */
    sample() {
        return this.start.map(
            (a, i) => a + Math.random() * (this.end[i] - a)
        );
    }
}
