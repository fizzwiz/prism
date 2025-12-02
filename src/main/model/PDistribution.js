import { Classifier, SORTER, TrueSet } from "@fizzwiz/sorted";
import { ORDER } from "@fizzwiz/sorted";
import { Model } from "../rationale/Model.js";
import { Each } from "@fizzwiz/fluent";

/**
 * A **PDistribution** is an explicit discrete probability distribution.
 *
 * It keeps track of all observed items, their frequencies, and supports:
 *
 *  - `likelihood(item)` → count(item)
 *  - `p(item)`          → probability(item)
 *  - `sample()`         → random sample proportional to frequencies
 *
 * Internally it uses a `TrueSet`, mapping each item to an equivalence class
 * determined by a user-provided `repr(item)` function.
 */
export class PDistribution extends Model {

    /**
     * @param {Function} repr
     *      A representation function mapping an item to its equivalence key.
     *      Items with the same key are counted together.
     */
    constructor(repr) {
        super(); 

        /**
         * The TrueSet tracking equivalence classes and counts.
         * @type {TrueSet}
         */
        this.trueSet = new TrueSet(
            repr,
            new Classifier(
                SORTER.UNIFORM(
                    ORDER.ASCENDING, 
                    ORDER.SINGULAR  // single item per class
                )
            )
        );
    }

    /**
     * Discretizes the given model into a finite probability distribution.
     *
     * Samples `nSamples` points from the model, then maps each sample
     * through the provided `repr` function to create equivalence classes.
     *
     * The resulting `PDistribution` approximates the model and can be
     * used for computing probabilities, distance or similoarity among models.
     *
     * @param {function(*): *} repr - Maps a sample to its equivalence class.
     * @param {number} nSamples - Number of samples to draw.
     * @returns {PDistribution} - Discrete approximation of the model.
     */
    static sample(model, repr, nSamples) {
        const samples = model.samples().when(nSamples, false);
        const weights = Each.as(1).self().else(); // infinite 1
        const entries = samples.match(weights);  
        return new PDistribution(repr).addAll(entries);
    }

    /**
     * Computes the probability of each item posterior to the given model.
     *
     */
    post(model) {
        return this.map((item, count) => model.likelihood(item) * count);
    }

     /**
     * Computes the posterior probability distribution over mixture components
     * for a single observed point.
     *
     * Returns a PDistribution where:
     *   key = component index i
     *   value = likelihood(point | model_i)
     *
     * The PDistribution automatically normalizes these values into a
     * proper probability distribution.
     *
     * @param {any} point
     *      The raw observed point.
     *
     * @param {Iterable<any>} mixture
     *      An iterable of models supporting `likelihood(point)`.
     *
     * @returns {PDistribution<number>}
     *      A probability distribution over indices i.
     */
    static postProbability(mixture, observed) {
        const pDistr = new PDistribution(i => i);

        let i = 0;
        for (const model of mixture) {
            pDistr.add(i, model.likelihood(observed));
            i++;
        }

        return pDistr;
    }

    /**
     * Attempts to update the current most weighted item.
     * Recursively traverses the classifier tree to find the item with the highest weight.
     *
     * Uses pruning: if a node's total weight `n()` is not greater than the current
     * best weight, the entire subtree is skipped.
     *
     * @param {Classifier} node - Classifier node to traverse
     * @param {{item: *, weight: number}} most - Result accumulator object
     * @returns {boolean} - true if the most probable item was updated
     * @private
     */
    static updateMostProbable(node, most = { item: undefined, weight: -1 }) {

        // PRUNE: subtree cannot contain a heavier item
        if (node.n() <= most.weight) return false;

        let updated = false;

        // Check this node's own class
        if (node.nin > most.weight) {
            most.item = node.class.peek();
            most.weight = node.nin;
            updated = true;
        }

        // Recurse into children
        for (const child of node.children()) {
            updated = PDistribution.updateMostProbable(child, most) || updated;
        }

        return updated;
    }

    /**
     * Returns the most probable item in this distribution.
     *
     * @returns {*} The item with the highest weight or undefined if this distribution is empty.
     */
    most() {
        const most = { item: undefined, weight: -1 };
        PDistribution.updateMostProbable(this.trueSet.classifier, most);
        return most.item;
    }

    /**
     * Adds an item `xTimes` times to the distribution.
     *
     * @param {*} item 
     * @param {number} [xTimes=1]
     */
    add(item, xTimes = 1) {
        this.trueSet.add(item, xTimes);
    }

    /**
     * Adds all the given items with corresponding weights.
     *
     * @param {Iterable<Array<*,number>>} entries - The entries [item, weight] to add.
     * @returns {this} Returns the instance itself to allow method chaining.
     */
    addAll(entries) {
        Each.as(entries)
        .sthen(([item, weight]) => this.add(item, weight))
        .each();
        return this;
    }

    /**
     * Removes an item `xTimes` times from the distribution.
     *
     * @param {*} item 
     * @param {number} [xTimes=1]
     */
    remove(item, xTimes = 1) {
        this.trueSet.remove(item, xTimes);
    }

    /**
     * Returns the *raw count* of the item.
     * Equivalent to P(item) * N, not normalized.
     *
     * @param {*} item
     * @returns {number}
     */
    likelihood(item) {
        const node = this.trueSet.classifier.with(this.trueSet.repr(item));
        return node ? node.n() : 0;
    }

    /**
     * Returns the normalized probability p(item).
     *
     * @param {*} item
     * @returns {number}
     */
    p(item) {
        const total = this.trueSet.n();
        if (total < 1e-12) return 0;
        return this.likelihood(item) / total;
    }

    /**
     * Samples one item at random proportional to its frequency.
     *
     * @returns {*} sampled item
     */
    sample() {
        return PDistribution.sampleNode(this.trueSet.classifier);
    }

    /**
     * Recursively samples from a classifier subtree using cumulative weights.
     *
     * ## Classifier Semantics
     * This method assumes the classifier node implements:
     *
     * - `node.n()`  
     *     Total multiplicity/count of all items in this node's subtree.
     *
     * - `node.nin`  
     *     Number of occurrences represented *directly in this node's own class*  
     *     (not including children), counting each distinct representative once.
     *
     * - `node.class`  
     *     A set-like structure containing the canonical representatives of items
     *     belonging to this node's partition.
     *
     * Probability mass contributed by this node’s class = `node.nin`.
     * Probability mass contributed by each child = `child.n()`.
     *
     * @param {Object} node
     *      A classifier node conforming to the above semantics.
     *
     * @returns {*} A sampled item from the distribution represented by this node.
     */
    static sampleNode(node) {
        if (node.isEmpty()) {
            throw new Error("PDistribution.sampleNode: empty distribution");
        }

        // Draw uniform sample in [0, total)
        const target = Math.random() * node.n();
        let cumulative = 0;

        //
        // 1. Try this node's own class
        //
        if (!node.class.isEmpty()) {
            const classCount = node.nin; // distinct occurrences in this class

            if (cumulative + classCount >= target) {
                // Representative of this class
                return node.class.peek();
            }

            cumulative += classCount;
        }

        //
        // 2. Otherwise descend through children
        //
        let chosenChild = null;

        for (const child of node.keyToChild.values()) {
            const count = child.n();

            if (cumulative + count >= target) {
                chosenChild = child;
                break;
            }

            cumulative += count;
            chosenChild = child; // fallback to last child
        }

        if (!chosenChild) {
            // Should never happen unless the tree is malformed,
            // but prevents silent fallthrough
            throw new Error("PDistribution.sample: no child selected (inconsistent counts)");
        }

        return PDistribution.sampleNode(chosenChild);
    }

    /**
     * Creates a new `PDistribution` by applying a transformation function
     * to every equivalence class in this distribution.
     *
     * For each represented item, the function `f(item, count)` receives:
     *   - `item`  — the representative of the class
     *   - `count` — the current weight (possibly fractional)
     *
     * The returned value determines the new weight of that item in the resulting
     * distribution.  
     *
     * Notes:
     * - If `f(item, count)` returns a value **> 0**, the item is inserted with
     *   that weight.
     * - If it returns `0` or a negative number, the item is omitted.
     *
     * @param {function(item, weight, index) => number} f
     *     Mapping function transforming the weight of each item.
     *
     * @returns {PDistribution}
     *     A new transformed distribution.
     */
    map(f) {
        const got = new PDistribution(this.trueSet.repr);

        let index = 0;
        for (const item of this.trueSet) {
            
            const newCount = f(item, this.likelihood(item), index);

            if (newCount > 0)
                got.add(item, newCount);

            index++;
        }

        return got;
    }

    entries() {
        return this.trueSet.classifier.descendants()
            .which(node => node.nin > 0)
            .sthen(node => [node.class.peek(), node.nin]);
    }

    /**
     * Computes the Shannon entropy or cross-entropy of this distribution.
     *
     * - **Without arguments:** returns the Shannon entropy `H(P)` of this distribution,
     *   which is the expected number of nats (natural-log units) needed to encode items
     *   drawn from this distribution.
     *
     * - **With another distribution `that`:** returns the *cross-entropy* `H(P, Q)` between
     *   this distribution (`P`) and `that` (`Q`), i.e., the expected coding cost when
     *   samples from `P` are encoded using the probabilities of `Q`.
     *
     * This method uses **additive smoothing** to avoid infinite values:
     * probabilities smaller than `epsilon` are replaced by `epsilon` in the log computation.
     *
     * KL divergence can be computed as:
     * ```
     * D_KL(P || Q) = this.entropy(that) - this.entropy()
     * ```
     *
     * @param {PDistribution} [that] - Optional second distribution `Q` for cross-entropy.
     * @param {number} [epsilon=1e-12] - Minimal probability to avoid log(0); must be > 0.
     * @returns {number} The mean code length in nats.
     *
     * @example
     * const H = dist.entropy();          // Shannon entropy H(P)
     * const Hpq = dist.entropy(other);   // Cross-entropy H(P, Q)
     * const Dkl = Hpq - H;               // KL divergence D_KL(P || Q)
     */
    entropy(that = undefined, epsilon = 1e-12) {
        if (epsilon <= 0) throw new Error("epsilon must be positive");

        let sum = 0;
        for (const item of this.trueSet) {
            const p = this.p(item);
            if (p < epsilon) continue; // skip near-zero probabilities in P
            let q = that ? that.p(item) : p;
            q = Math.max(q, epsilon); // smooth Q to avoid log(0)
            sum -= p * Math.log(q);
        }
        return sum;
    }

    /**
     * Computes the Kullback-Leibler divergence D_KL(that || this).
     *
     * Measures how well `this` distribution (`P`) explains `that` distribution (`Q`):
     * ```
     * D_KL(Q || P) = H(Q, P) - H(Q)
     * ```
     *
     * Uses additive smoothing (`epsilon`) to avoid log(0) issues.
     *
     * @param {PDistribution} that - The target/observed distribution Q.
     * @param {number} [epsilon=1e-12] - Minimal probability to avoid log(0).
     * @returns {number} KL divergence in nats; 0 means identical distributions.
     *
     * @example
     * const kl = dist.klDivergence(otherDist);
     */
    klDivergence(that, epsilon = 1e-12) {
        return that.entropy(this, epsilon) - that.entropy(undefined, epsilon);
    }

    /**
     * Computes the posterior likelihood of this distribution given an observed distribution.
     *
     * Measures how well `this` distribution (`P`) explains the observed distribution (`Q`):
     * ```
     * L(P | Q) = exp(-D_KL(Q || P))
     * ```
     *
     * Because `entropy` uses smoothing, this method never returns 0 or Infinity,
     * even if `Q` has points not supported by `P`.
     *
     * @param {PDistribution} observed - The observed or empirical distribution (`Q`).
     * @param {number} [epsilon=1e-12] - Minimal probability for smoothing (passed to `entropy`).
     * @returns {number} Posterior likelihood in [0, 1]; higher values indicate better fit.
     *
     * @example
     * const L = model.postLikelihood(observedDist);
     */
    postLikelihood(observed, epsilon = 1e-12) {
        const kl = this.klDivergence(observed, epsilon);
        return Math.exp(-kl);
    }

    /**
     * Computes the Jensen-Shannon divergence between this distribution (`P`)
     * and another distribution (`Q`).
     *
     * Jensen-Shannon divergence is a symmetric, finite measure based on Kullback-Leibler divergence:
     * ```
     * D_JS(P || Q) = 0.5 * D_KL(P || M) + 0.5 * D_KL(Q || M)
     * M = 0.5 * (P + Q)
     * ```
     *
     * Values are in [0, ln(2)] nats for discrete distributions.
     * - 0 indicates identical distributions.
     * - ln(2) (≈0.693) is the maximal divergence for completely disjoint distributions.
     *
     * This implementation uses additive smoothing to avoid log(0):
     * probabilities smaller than `epsilon` are replaced with `epsilon`.
     *
     * @param {PDistribution} that - The other distribution (`Q`) to compare against.
     * @param {number} [epsilon=1e-12] - Minimal probability to avoid log(0).
     * @returns {number} Jensen-Shannon divergence in nats.
     *
     * @example
     * const jsDiv = this.jensenShannon(that);
     */
    jensenShannonDivergence(that, epsilon = 1e-12) {
        if (epsilon <= 0) throw new Error("epsilon must be positive");

        // Collect the union of all items
        const items = new Set([...this.trueSet, ...that.trueSet]);

        let sum = 0;
        for (const item of items) {
            const p = Math.max(this.p(item), epsilon);
            const q = Math.max(that.p(item), epsilon);
            const m = 0.5 * (p + q);

            sum += 0.5 * (p * Math.log(p / m) + q * Math.log(q / m));
        }

        return sum;
    }

    /**
     * Computes the Jensen-Shannon distance between this distribution and another.
     *
     * The distance is the square root of the Jensen-Shannon divergence, which is a true metric:
     * - symmetric: JS-distance(P, Q) = JS-distance(Q, P)
     * - non-negative: 0 ≤ JS-distance ≤ sqrt(ln 2)
     * - satisfies the triangle inequality
     *
     * @param {PDistribution} that - The other distribution to compare.
     * @param {number} [epsilon=1e-12] - Minimal probability for smoothing.
     * @returns {number} Jensen-Shannon distance.
     *
     * @example
     * const dist = distA.jensenShannonDistance(distB);
     */
    jensenShannonDistance(that, epsilon = 1e-12) {
        return Math.sqrt(this.jensenShannonDivergence(that, epsilon));
    }

    /**
     * Computes a similarity score between this distribution and another,
     * based on the Jensen-Shannon distance.
     *
     * The score is in (0, 1], where 1 means identical distributions and
     * smaller values indicate increasing divergence.
     *
     * This is a monotone transformation of a true metric (JS distance):
     *   similarity(P, Q) = exp(-JS-distance(P, Q))
     *
     * @param {PDistribution} that - Another distribution to compare.
     * @param {number} [epsilon=1e-12] - Minimal probability for smoothing.
     * @returns {number} Symmetric similarity score in (0, 1].
     *
     * @example
     * const sim = distA.similarity(distB);
     */
    similarity(that, epsilon = 1e-12) {
        return Math.exp(-this.jensenShannonDistance(that, epsilon));
    }

}
