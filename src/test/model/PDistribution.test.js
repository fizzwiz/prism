import assert from 'assert';
import { PDistribution } from '../../main/model/PDistribution.js';
import { Each } from '@fizzwiz/fluent';

describe('PDistribution', function() {

    let dist;

    beforeEach(function() {
        // Initialize empty distribution
        dist = new PDistribution(item => item); // identity representation
    });

    it('should add items and count correctly', function() {
        dist.add('a');
        dist.add('b', 3);
        dist.add('a', 2);

        assert.strictEqual(dist.trueSet.n(), 6, 'Total count should be 6');

        // Check likelihood
        assert.strictEqual(dist.likelihood('a'), 3, 'Likelihood of "a" should be 3');
        assert.strictEqual(dist.likelihood('b'), 3, 'Likelihood of "b" should be 3');
        assert.strictEqual(dist.likelihood('c'), 0, 'Likelihood of "c" should be 0');

        // Check probabilities
        assert.strictEqual(dist.p('a'), 3 / 6);
        assert.strictEqual(dist.p('b'), 3 / 6);
        assert.strictEqual(dist.p('c'), 0);
    });

    it('should remove items correctly', function() {
        dist.add('x', 4);
        dist.add('y', 2);

        dist.remove('x', 2);

        assert.strictEqual(dist.likelihood('x'), 2);
        assert.strictEqual(dist.trueSet.n(), 4);
    });

    it('should sample items according to their probability', function() {
        dist.add('alpha', 1);
        dist.add('beta', 3);
        dist.add('gamma', 6);

        const counts = { alpha: 0, beta: 0, gamma: 0 };
        const trials = 10000;

        for (let i = 0; i < trials; i++) {
            const s = PDistribution.sampleNode(dist.trueSet.classifier);
            counts[s]++;
        }

        // Probabilities: alpha=1/10, beta=3/10, gamma=6/10
        const tolerance = 0.05;
        assert(Math.abs(counts.alpha / trials - 0.1) < tolerance, 'alpha probability off');
        assert(Math.abs(counts.beta / trials - 0.3) < tolerance, 'beta probability off');
        assert(Math.abs(counts.gamma / trials - 0.6) < tolerance, 'gamma probability off');
    });

    it('should throw when sampling from empty distribution', function() {
        const emptyDist = new PDistribution(x => x);
        assert.throws(() => PDistribution.sampleNode(emptyDist.trueSet.classifier),
            /empty distribution/, 'Should throw on empty node');
    });

    describe("PDistribution.map()", () => {

        // trivial repr: identity
        const repr = x => x;

        function makeDist() {
            const d = new PDistribution(repr);
            d.add("a", 2);
            d.add("b", 3);
            return d;
        }

        it("should map counts correctly (e.g. doubling)", () => {
            const d = makeDist();

            const d2 = d.map((item, count) => count * 2);

            assert.strictEqual(d2.likelihood("a"), 4);
            assert.strictEqual(d2.likelihood("b"), 6);
        });

        it("should remove items when mapped value <= 0", () => {
            const d = makeDist();

            // Remove "b"
            const d2 = d.map((item, count) =>
                item === "b" ? 0 : count
            );

            assert.strictEqual(d2.likelihood("b"), 0);
            assert.strictEqual(d2.likelihood("a"), 2);
        });

        it("should allow fractional values", () => {
            const d = makeDist();

            const d2 = d.map((item, count) => count * 0.5);

            assert.strictEqual(d2.likelihood("a"), 1);
            assert.strictEqual(d2.likelihood("b"), 1.5);
        });

        it("should not modify the original distribution", () => {
            const d = makeDist();
            const origA = d.likelihood("a");
            const origB = d.likelihood("b");

            d.map((item, count) => count * 10);

            assert.strictEqual(d.likelihood("a"), origA);
            assert.strictEqual(d.likelihood("b"), origB);
        });

        it("should return an empty distribution when all mapped to <= 0", () => {
            const d = makeDist();

            const d2 = d.map(() => 0);

            assert.strictEqual(d2.likelihood("a"), 0);
            assert.strictEqual(d2.likelihood("b"), 0);
            assert.strictEqual(d2.trueSet.n(), 0);
        });

    });
    
    describe('PDistribution.addAll', function() {
        it('should add items with corresponding weights', function() {
            const dist = new PDistribution(x => x); // identity repr function
    
            // Add items with matching weights
            dist.addAll([[1, 10], [2, 20], [3, 30]]);
    
            assert.strictEqual(dist.likelihood(1), 10);
            assert.strictEqual(dist.likelihood(2), 20);
            assert.strictEqual(dist.likelihood(3), 30);
        });
    
        it('should return `this` for chaining', function() {
            const dist = new PDistribution(x => x);
    
            const result = dist.addAll([[1, 2], [2, 3]]);
            assert.strictEqual(result, dist);
        });
    });
    
});
