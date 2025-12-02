import { PDistribution } from  "./src/main/model/PDistribution.js";
import assert from "assert";
import { GaussianModel } from "./src/main/model/GaussianModel.js";
import { GaussianModeller } from "./src/main/modeller/GaussianModeller.js";
import { MixtureEMTrainer } from "./src/main/trainer/MixtureEMTrainer.js";
import { Classifier, ORDER, SORTER, TrueSet } from "@fizzwiz/sorted";
import { SplashSplitProjector } from "./src/main/generator/SplashSplitProjector.js";

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
assert.strictEqual(entries[0][1].length, 2, "the dest point should have dim 2");  
assert(!Array.isArray(entries[0][1][0]));     // the component of the dest point are numbers, not Arrays
