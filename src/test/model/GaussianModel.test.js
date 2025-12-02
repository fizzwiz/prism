import assert from "assert";
import { GaussianModel } from "../../main/model/GaussianModel.js"; // adjust path as needed

describe("GaussianModel", function() {

    describe("1D Gaussian", function() {
        const mean = 5;
        const cov = 4; // variance = 4
        const model = new GaussianModel(mean, cov);

        it("should store mean and covariance correctly", function() {
            assert.deepStrictEqual(model.mean, [mean]);
            assert.deepStrictEqual(model.cov, [[cov]]);
        });

        it("likelihood at mean should be maximum", function() {
            const valAtMean = model.likelihood([mean]);
            const valElse = model.likelihood([mean + 1]);
            assert(valAtMean > valElse, "Likelihood at mean should be higher");
        });

        it("sample should return a number", function() {
            const s = model.sample();
            assert.strictEqual(typeof s, "number");
        });
    });

    describe("2D Gaussian", function() {
        const mean = [0, 0];
        const cov = [
            [1, 0.5],
            [0.5, 2]
        ];
        const model = new GaussianModel(mean, cov);

        it("should store mean and covariance correctly", function() {
            assert.deepStrictEqual(model.mean, mean);
            assert.deepStrictEqual(model.cov, cov);
        });

        it("likelihood at mean should be higher than off-center", function() {
            const valAtMean = model.likelihood([0, 0]);
            const valElse = model.likelihood([1, 1]);
            assert(valAtMean > valElse, "Likelihood at mean should be higher");
        });

        it("sample should return an array of correct length", function() {
            const s = model.sample();
            assert(Array.isArray(s));
            assert.strictEqual(s.length, mean.length);
        });

        it("should handle single number input as 1D internally", function() {
            const model1D = new GaussianModel(0, [[1]]);
            assert.strictEqual(model1D.likelihood([0]), model1D.likelihood([0]));
        });
    });

    describe("Invalid covariance", function() {
        it("should throw for non-square covariance", function() {
            assert.throws(() => new GaussianModel([0,0], [[1,0]]), /Covariance matrix must be square/);
        });

        it("should throw for non-positive-definite covariance", function() {
            assert.throws(() => new GaussianModel([0,0], [[1,2],[2,1]]), /Covariance matrix is not positive definite/);
        });
    });
});
