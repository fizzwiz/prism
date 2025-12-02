import { describe, it } from 'mocha';
import assert from "assert";
import { SplashSplitProjector } from "../../main/generator/SplashSplitProjector.js";
import { GaussianModeller } from "../../main/modeller/GaussianModeller.js";
import { PDistribution } from "../../main/model/PDistribution.js";
import { Path } from "@fizzwiz/fluent";

/** Utility: make a simple probability distribution */
function makeFactor(...items) {
    const entries = items.map(item => [item, 1]);
    return new PDistribution(pt => pt).addAll(entries);
}

/** Utility: simple deterministic modeller */
function makeModeller() {
    return new GaussianModeller();
}

/** Utility: construct Projection.ofPoints from arrays of qualities */
function makeProjection(...pts) {
    return SplashSplitProjector.Projection.ofPoints(pts);
}

describe("SplashSplitProjector.Projection", function () {

    it("creates a Projection with one path per top-level quality", function () {
        const P = makeProjection(["a"], ["b"], ["c"]);

        assert.ok(P instanceof SplashSplitProjector.Projection);
        assert.strictEqual(P.paths.length, 3);
        P.paths.forEach(path => assert.ok(path instanceof Path));
        assert.strictEqual(P.depth(), 0, "initial projection has depth 0");
    });

    it("isSplash() returns true at depth 0", function () {
        const P = makeProjection(["q"]);
        assert.strictEqual(P.depth(), 0);
        assert.strictEqual(P.isSplash(), true);
    });
 
    it("splash(factor, modeller) increases all path lengths by +1", function () {
        const P = makeProjection(["a"], ["b"]);
        const factor = makeFactor(0, 1);
        const modeller = makeModeller();

        const convergenceThreshold = 0.9;
        const trainSteps = 1;
        const Q = P.splash(factor, modeller, convergenceThreshold, trainSteps);

        assert.ok(Q instanceof SplashSplitProjector.Projection);
        assert.strictEqual(Q.paths.length, 2);

        Q.paths.forEach(path => {
            assert.strictEqual(path.length, 1, "each path gained 1 Match");
            assert.ok(path.last.trainedModel, "match has a trained model");
        });
    });

    it("split(modeller) replaces each path with one child per node child", function () {
        //
        // Create a projection with paths pointing to nodes that have children.
        //

        // Construct a TrueSet with hierarchy:
        //
        //   root
        //    ├── A → A1, A2
        //    └── B → B1
        //
        const P = makeProjection(["A", "A1"], ["A", "A2"], ["B", "B1"]);
        const factor = makeFactor(0, 1);
        const modeller = makeModeller();

        const convergenceThreshold = 0.9;
        const trainSteps = 1;
        const Q = P.splash(factor, modeller, convergenceThreshold, trainSteps);

        const R = Q.split(modeller, convergenceThreshold, trainSteps)

        // A had 2 children → expands to 2 paths
        // B had 1 child  → expands to 1 path
        assert.strictEqual(R.paths.length, 3);

    });
/** */
    it("resolve() converts each path into a flat target point if all the factors are numeric", function () {
        const P = makeProjection(["A", "A1"], ["A", "A2"], ["B", "B1"]);
        const factor = makeFactor(0, 1);
        const modeller = makeModeller();

        const convergenceThreshold = 0.9;
        const trainSteps = 1;
        const Q = P.splash(factor, modeller, convergenceThreshold, trainSteps);

        const R = Q.split(modeller, convergenceThreshold, trainSteps);

        const resolved = R.resolve();

        const entries = [...resolved.entries()];
        console.log(entries);
        assert.strictEqual(entries[0][1].length, 1, "the dest point should have dim 1");  
        assert(!Array.isArray(entries[0][1][0]));     // the component of the dest point are numbers, not Arrays

    });

    it("resolve() converts each path into a crisp target point if some factor is a distr of arrays", function () {
        const P = makeProjection(["A", "A1"], ["A", "A2"], ["B", "B1"]);
        const factor = makeFactor([0, 0], [1, 1]); // arrays as dest points
        const modeller = makeModeller();

        const convergenceThreshold = 0.9;
        const trainSteps = 1;
        const Q = P.splash(factor, modeller, convergenceThreshold, trainSteps);

        const R = Q.split(modeller, convergenceThreshold, trainSteps);

        const resolved = R.resolve();

        const entries = [...resolved.entries()];
        console.log(entries);
        assert.strictEqual(entries[0][1].length, 1, "the dest point should have dim 1");  
        assert(Array.isArray(entries[0][1][0]));     // the component of the dest point are Arrays

    });

});
