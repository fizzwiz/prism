import assert from "assert";
import { MixtureEMTrainer } from "../../main/trainer/MixtureEMTrainer.js";
import { GaussianModel } from "../../main/model/GaussianModel.js";
import { GaussianModeller } from "../../main/modeller/GaussianModeller.js";
import { PDistribution } from "../../main/model/PDistribution.js";

// ------------------------------------------------------------
// Utilities
// ------------------------------------------------------------
function buildObservation(repr, g1, g2, n1 = 500, n2 = 500) {
    const obs = PDistribution.sample(g1, repr, n1);
    const o2 = PDistribution.sample(g2, repr, n2);

    return obs.addAll(o2.entries());
}

function hasConverged(mixture, trueSamples, nSamples, repr, similarityThreshold = 0.65) {
    return mixture.every((model, i) => 
        PDistribution.sample(model, repr, nSamples).similarity(trueSamples[i]) >= similarityThreshold
    );
}
/** */
// ------------------------------------------------------------
// Test Suite
// ------------------------------------------------------------
describe("MixtureEMTrainer (distribution-based convergence)", function () {

    const trueA = new GaussianModel(0, 1);
    const trueB = new GaussianModel(6, 1);
    const repr = x => Math.floor(x / 0.1) * 0.1;

    const observation = buildObservation(repr, trueA, trueB);
    const modeller = new GaussianModeller();
    const trainer = new MixtureEMTrainer(observation, modeller);

    const maxSteps = 50;
    const nSamples = 500;
    const trueSamples = [trueA, trueB].map(model => PDistribution.sample(model, repr, nSamples));

    it("should converge when both initial models start in-between the true Gaussians", () => {
        const init1 = new GaussianModel(2, 2);
        const init2 = new GaussianModel(4, 5);

        const trained = trainer.train([init1, init2])
            .when(maxSteps, false)
            .when(mixture => hasConverged(mixture, trueSamples, nSamples, repr))
            .what();

        assert.ok(
            trained !== undefined,
            "Mixture should converge to the original Gaussians"
        );
    });

    it("should converge when both initial models start at the extremes", () => {
        const init1 = new GaussianModel(-10, 5);
        const init2 = new GaussianModel(16, 5);

        const trained = trainer.train([init1, init2])
            .when(maxSteps, false)
            .when(mixture => hasConverged(mixture, trueSamples, nSamples, repr))
            .what();

        assert.ok(
            trained !== undefined,
            "Mixture should converge to the original Gaussians from extreme initializations"
        );
    });

    it("should converge when one initial model is in-between and the other at an extreme", () => {
        const init1 = new GaussianModel(2, 5);
        const init2 = new GaussianModel(16, 5);

        const trained = trainer.train([init1, init2])
            .when(maxSteps, false)
            .when(mixture => hasConverged(mixture, trueSamples, nSamples, repr))
            .what();

        assert.ok(
            trained !== undefined,
            "Mixture should converge to the original Gaussians from mixed initialization"
        );
    });

    
})
