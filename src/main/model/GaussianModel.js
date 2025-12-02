import { CenteredModel } from "./CenteredModel.js";

/**
 * A multivariate Gaussian (normal) distribution model.
 *
 * Represents:
 *    N(x | mean, covariance)
 *
 * Provides:
 *  - likelihood(x):  probability density at point x
 *  - sample():       random sample drawn from the distribution
 *
 * Supports arbitrary dimension `d`. Single numbers are treated as 1D.
 */
export class GaussianModel extends CenteredModel {

    /**
     * Constructs a Gaussian model.
     *
     * @param {number|Array<number>} mean - Mean value (number) or vector μ of the Gaussian. Single number is treated as 1D.
     * @param {number|Array<number[]>} covariance - Covariance scalar (1D) or matrix Σ. Must match mean dimension.
     */
    constructor(mean, covariance) {
        if (!Array.isArray(mean)) mean = [mean];
        super(mean);

        this.mean = mean;

        if (!Array.isArray(covariance[0])) covariance = [[covariance]];

        this.cov = covariance;
        const d = this.mean.length;

        if (covariance.length !== d || covariance.some(r => r.length !== d)) {
            throw new Error("Covariance matrix must be square with same dimension as the mean vector");
        }

        this.cholesky = GaussianModel.choleskyDecomposition(covariance);
        const det = GaussianModel.matrixDeterminant(covariance);
        this.norm = 1 / Math.sqrt((2 * Math.PI) ** d * det);
    }

    /**
     * Computes the multivariate Gaussian density:
     *    N(x | mean, covariance)
     *
     * @param {number|Array<number>} x - Evaluation point. Single number is treated as 1D.
     * @returns {number} - PDF value at x.
     */
    likelihood(x) {
        if (!Array.isArray(x)) x = [x];
        const diff = x.map((v, i) => v - this.mean[i]);
        const y = GaussianModel.solveLowerTriangular(this.cholesky, diff);
        const quad = y.reduce((sum, v) => sum + v * v, 0);
        return this.norm * Math.exp(-0.5 * quad);
    }

    /**
     * @overrides 
     */
    get center() {
        return this._center.length === 1? this._center[0]: this._center;
    }

    /**
     * Generates a random sample from the Gaussian.
     *
     * Uses: x = μ + L z, where z ~ N(0, I), L is Cholesky factor of Σ.
     *
     * @returns {number|Array<number>} - Sampled point (number for 1D, array for multivariate).
     */
    sample() {
        const d = this.mean.length;
        const z = Array.from({ length: d }, () => GaussianModel.random());
        const x = GaussianModel.multiplyLowerTriangular(this.cholesky, z);
        const sample = x.map((v, i) => v + this.mean[i]);
        return d === 1 ? sample[0] : sample;
    }

    // -------------------------------------------------------------------------
    //  INTERNAL NUMERICAL HELPERS
    // -------------------------------------------------------------------------

    /**
     * Standard normal random variable (mean 0, variance 1)
     * @returns {number}
     */
    static random() {
        const u = Math.random();
        const v = Math.random();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    /**
     * Cholesky decomposition: Σ = L Lᵀ
     *
     * @param {Array<Array<number>>} A - Positive-definite matrix
     * @returns {Array<Array<number>>} L - Lower-triangular matrix
     */
    static choleskyDecomposition(A) {
        const n = A.length;
        const L = Array.from({ length: n }, () => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j <= i; j++) {
                let sum = A[i][j];
                for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k];
                if (i === j) {
                    if (sum <= 0) throw new Error("Covariance matrix is not positive definite");
                    L[i][j] = Math.sqrt(sum);
                } else {
                    L[i][j] = sum / L[j][j];
                }
            }
        }
        return L;
    }

    /**
     * Determinant of a positive-definite matrix via Cholesky decomposition
     *
     * @param {Array<Array<number>>} A
     * @returns {number} determinant
     */
    static matrixDeterminant(A) {
        const L = GaussianModel.choleskyDecomposition(A);
        const diagProd = L.reduce((prod, row, i) => prod * row[i], 1);
        return diagProd * diagProd;
    }

    /**
     * Solve lower triangular system L y = b
     *
     * @param {Array<Array<number>>} L - Lower triangular matrix
     * @param {Array<number>} b - Right-hand side
     * @returns {Array<number>} y - Solution
     */
    static solveLowerTriangular(L, b) {
        const n = L.length;
        const y = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            let sum = b[i];
            for (let j = 0; j < i; j++) sum -= L[i][j] * y[j];
            y[i] = sum / L[i][i];
        }
        return y;
    }

    /**
     * Multiply lower triangular matrix L by vector z: x = L z
     *
     * @param {Array<Array<number>>} L
     * @param {Array<number>} z
     * @returns {Array<number>} x
     */
    static multiplyLowerTriangular(L, z) {
        const n = L.length;
        const x = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
            let sum = 0;
            for (let j = 0; j <= i; j++) sum += L[i][j] * z[j];
            x[i] = sum;
        }
        return x;
    }
}
