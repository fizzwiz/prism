import assert from "assert";
import { GaussianModeller } from "../../main/modeller/GaussianModeller.js";
import { GaussianModel } from "../../main/model/GaussianModel.js";
import { PDistribution } from "../../main/model/PDistribution.js";

describe("GaussianModeller", () => {

    const TOL = 1e-6;

    // Helper to create observation quickly
    function makeObs(entries) {
        const p = new PDistribution(x => Array.isArray(x) ? x : [x]);
        p.addAll(entries);
        return p;
    }

    it("computes correct mean and variance for 1D data", () => {
        // Data: (x, w)
        const obs = makeObs([
            [1, 1],
            [3, 1]
        ]);

        const modeller = new GaussianModeller();
        const g = modeller.model(obs);

        assert.ok(g instanceof GaussianModel);

        const mean = g.mean;
        const cov = g.cov;

        assert.strictEqual(mean.length, 1);
        assert.strictEqual(mean[0], 2); // average of 1 and 3

        assert.strictEqual(cov.length, 1);
        assert.strictEqual(cov[0].length, 1);

        // variance: 1
        assert(Math.abs(cov[0][0] - 1) < TOL);
    });

    it("correctly handles weighted 1D data", () => {
        // Weighted data
        // mean = 2.5
        const obs = makeObs([
            [1, 1],
            [3, 3]
        ]);

        const modeller = new GaussianModeller();
        const g = modeller.model(obs);

        assert.strictEqual(g.mean[0], 2.5);

        // variance = 0.75
        assert(Math.abs(g.cov[0][0] - 0.75) < TOL);
    });

    it("computes correct 2D Gaussian mean and covariance", () => {
        // Two 2D points with weights
        const obs = makeObs([
            [[1, 2], 1],
            [[3, 4], 2]
        ]);

        const modeller = new GaussianModeller();
        const g = modeller.model(obs);

        const m = g.mean;
        const C = g.cov;

        // mean = (1*[1,2] + 2*[3,4]) / 3 = [7/3, 10/3]
        assert(Math.abs(m[0] - 7/3) < TOL);
        assert(Math.abs(m[1] - 10/3) < TOL);

        const totalW = 3;

        const c00 = (1*(16/9) + 2*(4/9)) / totalW; // 8/9
        const c01 = c00;
        const c11 = c00;

        assert(Math.abs(C[0][0] - c00) < TOL);
        assert(Math.abs(C[0][1] - c01) < TOL);
        assert(Math.abs(C[1][0] - c01) < TOL);
        assert(Math.abs(C[1][1] - c11) < TOL);
    });

    it("accepts points given as numbers, arrays, or iterables", () => {
        const obs = makeObs([
            [1, 1],              // number
            [[2], 1],            // array
            [new Set([3]), 1]    // iterable
        ]);

        const modeller = new GaussianModeller();
        const g = modeller.model(obs);

        // mean = 2
        assert.strictEqual(g.mean[0], 2);
    });

    it("ignores entries with zero or negative weight", () => {
        const obs = makeObs([
            [10, 0],     // ignore
            [20, -5],    // ignore
            [4, 2]       // only valid point
        ]);

        const modeller = new GaussianModeller();
        const g = modeller.model(obs);

        assert.strictEqual(g.mean[0], 4);
        assert(Math.abs(g.cov[0][0] - 0) < TOL);
    });

    it("throws an error when all weights are zero or negative", () => {
        const obs = makeObs([
            [5, 0],
            [7, -1]
        ]);

        const modeller = new GaussianModeller();

        assert.throws(
            () => modeller.model(obs),
            /all weights are zero/i
        );
    });

    it("throws an error for empty observation", () => {
        const obs = new PDistribution(x => [x]); // empty

        const modeller = new GaussianModeller();
        assert.throws(() => modeller.model(obs));
    });

});
