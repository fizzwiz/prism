import { Classifier, ORDER, SORTER, TrueSet } from "@fizzwiz/sorted";
import { Generator } from "../rationale/Generator.js";
import { MixtureEMTrainer } from "../trainer/MixtureEMTrainer.js";
import { Path } from "@fizzwiz/fluent";

/**
 * SplashSplitProjector
 * --------------------
 *
 * Projects *qualitative hierarchical data* (paths of qualities) into a
 * **target hyperspace**, represented as a sequence of probability distributions
 * (“target factors”).
 *
 * The target space may be numeric, symbolic, or any domain for which a
 * modeller exists.
 *
 *
 * Source Representation
 * ---------------------
 * Source points must be convertible into *paths of primitive qualities*.
 * If the input points are not already arrays of primitives, a custom `srcRepr`
 * must be provided to turn each point into an iterable of:
 *
 *     string | number | boolean | symbol | ...
 *
 * Even if the primitives are numeric, they are treated as *qualities*.
 * **No metric structure is preserved** from the source numerics.
 *
 *
 * Hierarchy (Quality Tree)
 * ------------------------
 *
 * Source paths are inserted into a `TrueSet`, which automatically organizes
 * them into a *prefix tree*:
 *
 *   • Points sharing the first *i* qualities occupy the same node at depth *i*  
 *   • Thus the source’s intrinsic *qualitative hierarchy* is made explicit
 *
 *
 * Target Semantics
 * ----------------
 *
 * Each qualitative path is projected into a corresponding path in the
 * target hyperspace:
 *
 *     p₀ → p₁ → p₂ → …
 *
 * This projection:
 *
 *   ✘ does **not** preserve metric or geometric structure  
 *   ✔ **does** preserve hierarchical structure
 *
 * Specifically:
 *
 *   If two source paths share a prefix of length *i*,  
 *   their projected paths will also share a prefix of length *i*.
 *
 * Only the *qualitative branching structure* is preserved.
 *
 *
 * Factor Progression
 * ------------------
 * The target hyperspace is defined by an ordered sequence of probability
 * distributions (`targetFactors`).
 *
 * Each level may specify:
 *
 *   • **a new factor** → the projector performs a *splash*  
 *   • **undefined**    → the projector repeats the previous factor, performing a *split*
 *
 * Factor repetition enables:
 *
 *   • Mapping multiple source depths into the same target dimension  
 *   • Extending a quality branch within the same factor  
 *   • Handling deeper source trees than the number of target factors  
 *
 *
 * Projection Structure
 * --------------------
 * A projection consists of an array of paths of **matches**:
 *
 *     { node, model }
 *
 * where:
 *
 *   • `node`   — a node in the quality tree  
 *   • `model`  — a trained model whose center is the projected point  
 *
 * Each model is annotated with:
 *
 *     model.conditionedObservation
 *
 * the probability distribution obtained by multiplying the current factor
 * with the model’s likelihood.
 *
 * This *conditioned factor* becomes:
 *
 *   • the target factor for the model’s children  
 *   • the repeated factor when the next targetFactor entry is `undefined`  
 *
 *
 * Splash vs Split
 * ----------------
 * For two consecutive matches:
 *
 *     { nodeA, modelA } → { nodeB, modelB }
 *
 * the transition is:
 *
 *   • **Splash**  (factor changes)
 *       A new factor is introduced.  
 *       A set of random models jointly partitions it.  
 *       All paths “splash” outward into the new factor.
 *
 *   • **Split**   (factor repeats)
 *       The conditioned factor of `modelA` is subdivided.  
 *       `modelB` occupies a sub-region strictly contained in `modelA`.  
 *       The hierarchical nesting is preserved exactly.
 *
 *
 * Resolution (Converting Paths → Target Points)
 * --------------------------------------------
 * Once the entire quality tree has been projected, each path of matches is
 * resolved into a *target point* (a vector in the Cartesian space defined by
 * `targetFactors`):
 *
 *   • A **splash** corresponds to `push()` — the point grows in dimension  
 *   • A **split**  corresponds to `splice()` — the last coordinates are
 *     *refined*, not extended
 *
 * Thus:
 *
 *   • Splash increases dimensionality  
 *   • Split increases precision within a dimension  
 *
 *
 * Probabilistic Interpretation
 * ----------------------------
 * Both splash and split derive from partitioning a probability distribution
 * across a set of concurrent models.
 *
 *   • In **splash**, models are initialized by sampling a *new* factor  
 *   • In **split**, models are initialized by sampling the *conditioned factor*
 *     of the parent
 *
 * For any model, the conditional factor is:
 *
 *     conditional(x) ∝ factor(x) * model.likelihood(x)
 *
 * After normalization, this becomes the model’s
 *
 *     model.conditionedObservation
 *
 * The EM mixture trainer adjusts all concurrent models so that they jointly
 * partition the factor according to their responsibilities.
 *
 *
 * Output
 * ------
 * The `SplashSplitProjector` generates the complete family of next-level
 * projections that:
 *
 *   • respect the qualitative hierarchy of the source  
 *   • maintain prefix-alignment between source and target paths  
 *   • construct a coherent probabilistic embedding in the target hyperspace  
 *
 */
export class SplashSplitProjector extends Generator {
    
    static Match = class {

        /**
         * The source node in the qualitative tree.
         * This node represents a qualitative state in the hierarchical source space.
         */
        node;
    
        /**
         * The trained target-space model associated with this match.
         * Its center (.center) is the projected target point.
         * Its `.conditionedObservation` is the probability distribution conditioned by the model. It will be used for
         * projecting the node’s children.
         */
        trainedModel;
    
        /**
         * Create a Match connecting a source-tree node to a trained target-space model.
         *
         * @param {TrueSet.Node} node
         *        The corresponding node in the qualitative source tree.
         *
         * @param {Object} trainedModel
         *        A trained model whose `point` is the projected target coordinate,
         *        and whose `conditionedObservation` defines the destination space
         *        for projecting the node’s children.
         */
        constructor(node, trainedModel) {
            this.node = node;
            this.trainedModel = trainedModel;
        }
    
        /**
         * The target-space point representing this match.
         * Delegated to the center of the trained model.
         *
         * @return {*} The model's center point in the target space.
         */
        get targetPoint() {
            return this.trainedModel.center;
        }
    
        /**
         * The probability distribution used as the target factor for projecting
         * this node’s children.
         *
         * This is the *conditioned* version of the factor, i.e.:
         *
         *    factor(x) * likelihood(x)   normalized
         *
         * It serves as the target space for child models during a split operation.
         *
         * @return {*} The conditioned probability distribution.
         */
        get destinationSpace() {
            return this.trainedModel.conditionedObservation;
        }
    
        /**
         * Split Operation
         * ----------------
         * Produces one Match for each child of the source node,
         * using the conditioned destination space to train each child model.
         *
         * If the node has no children, splitting yields the Match itself.
         *
         * The modeller is asked to create as many random models as there are children,
         * each one initialized in the conditioned target space. These are then
         * mapped to the children in sorted-key order.
         *
         * @param {Modeller} modeller
         *        Object with `.rnd(k, convergenceThreshold, maxSteps)` producing
         *        `k` trained models inside the destination space.
         *
         * @param {number} convergenceThreshold
         * @param {number} maxSteps
         *
         * @return {Match[]}
         *         One Match per child node, or `[this]` if the node is a leaf.
         */
        split(modeller, convergenceThreshold, maxSteps) {

            // Number of children of this qualitative node
            const k = this.node.keyToChild.size;
        
            // Leaf → no split, return this match unchanged
            if (k === 0) return [this];
        
            // Produce exactly k trained child models in the destination space
            const childModels = new MixtureEMTrainer(this.destinationSpace, modeller).rnd(k, convergenceThreshold, maxSteps);
        
            // Map each model to each child node (iteration order: insertion order of keyToChild)
            return [...this.node.keyToChild.values()]
                .map((childNode, i) =>
                    new SplashSplitProjector.Match(childNode, childModels[i])
                );
        }
        
    }    

    /** A projection of a tree (trueSet) is an array of Path<Match>  */
    static Projection = class {

        /** Array<Path<Match>> */
        paths;

        constructor(trueSet, ...paths) {
            this.trueSet = trueSet;
            this.paths = paths;
        }

        static ofPoints(sourcePoints, srcRepr = point => point) {
            const trueSet = new TrueSet(
                srcRepr,
                new Classifier(SORTER.UNIFORM(ORDER.ASCENDING, ORDER.SINGULAR))
            ).addAll(sourcePoints);

            const paths = [... trueSet.classifier.keyToChild.values()].map(node => new Path());
            return new SplashSplitProjector.Projection(trueSet, ...paths);
        }

        /** All paths are guaranteed same length. */
        depth() {
            return this.paths[0].length;
        }

        isSplash() {
            return this.paths[0] && SplashSplitProjector.Projection.isSplash(this.paths[0]);
        }

        static isSplash(path) {
            return path.length < 2 || path.parent.last.node === path.last.node;
        }

        /**
         * Performs a SPLASH:
         * - A new target factor is used.
         * - A new random mixture is created and trained.
         * - Each path receives ONE child, taken from the trained mixture.
         */
        splash(factor, modeller, convergenceThreshold, trainSteps) {

            // Create & train a fresh mixture
            const models = new MixtureEMTrainer(
                factor,
                modeller
            ).rnd(
                this.paths.length,
                convergenceThreshold,
                trainSteps
            );

            // Extend each path by adding a Match with SAME node (same quality node)
            const newPaths = this.paths.map((path, i) =>
                path.add(new SplashSplitProjector.Match(
                    path.last?.node || this.trueSet.classifier.getChild(this.trueSet.classifier.sortedKeys.items[i]), 
                    models[i]))
            );

            return new SplashSplitProjector.Projection(this.trueSet, ...newPaths);
        }

        /**
         * Performs a SPLIT:
         * - Same target factor is reused.
         * - Each path expands into as many children paths as the node has sub-nodes.
         */
        split(modeller, convergenceThreshold, trainSteps) {

            const newPaths = this.paths.map(path =>
                path.across(
                    path.last.split(
                        modeller,
                        convergenceThreshold,
                        trainSteps
                    )
                ).toArray()
            );

            // Flatten the array of arrays of paths
            return new SplashSplitProjector.Projection(
                this.projector,
                ...newPaths.flat()
            );
        }

        /**
         * Convert each projected path into a final target point.
         * Returns Map<srcPoint, trgPoint[]>
         */
        resolve() {
            const memo = new Map();
            return new Map(this.paths.map(path => this.resolvePath(path, memo)));
        }

        /**
         * Resolves a single path into a crisp target point.
         * Uses memoization because parent paths are reused across many children.
         * 
         * The target point is an array of length this.projecto.uniqueFactors.length
         * Each component of this array has same dimension of the corresponding unique factor.
         *
         * SPLASH → append (push)  
         * SPLIT  → refine (splice)
         */
        resolvePath(path, memo) {

            if (memo.has(path)) return memo.get(path);

            const srcPoint = path.last.node.class.peek();

            // Recursive resolution of the parent path
            const parentResolved =
                path.parent ? this.resolvePath(path.parent, memo)[1] : [];

            // clone, because arrays are reused across memo entries
            const trgPoint = parentResolved.slice();

            const point = path.last.trainedModel.center;

            if (SplashSplitProjector.Projection.isSplash(path)) {

                // Splash → increase dimension
                trgPoint.push(point);

            } else {

                // Split → same factor → overwrite last crisp coordinate
                trgPoint[trgPoint.length - 1] = point;
            }

            const result = [srcPoint, trgPoint];
            memo.set(path, result);
            return result;
        }
    };

    /**
     * Target hyperspace represented as an array of PDistributions.
     * If a factor is undefined at index i, the previous factor is repeated.
     */
    targetFactors;

    /**
     * For each targetFactor: number of SPLASH samples.
     * A splash occurs when a new factor appears (factor changes).
     * @type {Array<number>}
     */
    _splashes;

    /**
     * For each targetFactor: number of SPLIT samples.
     * A split occurs when the same factor repeats.
     * @type {Array<number>}
     */
    _splits;

    /** Two models are considered equivalent if similarity >= threshold */
    convergenceThreshold;

    /**
     * Constructs a SplashSplitProjector.
     */
    constructor(
        targetFactors,
        modellers,
        trainSteps,
        nSplashes = [1],
        nSplits = [1],
        convergenceThreshold = 0.85
    ) {
        super();

        const L = targetFactors.length;

        this.targetFactors = SplashSplitProjector.norm(targetFactors, L);
        this.modellers     = SplashSplitProjector.norm(modellers,     L);
        this._splashes     = SplashSplitProjector.norm(nSplashes,     L);
        this._splits       = SplashSplitProjector.norm(nSplits,       L);
        this.trainStepsArr = SplashSplitProjector.norm(trainSteps,    L);

        this.convergenceThreshold = convergenceThreshold;
    }

    /** Accessors (with fallback to last entry) */
    targetFactor(i) { return this.get("targetFactors", i); }
    modeller(i)     { return this.get("modellers",     i); }
    nSplash(i)      { return this.get("_splashes",     i); }
    nSplit(i)       { return this.get("_splits",       i); }
    trainSteps(i)    { return this.get("trainStepsArr", i); }

    get(name, i) {
        return this[name].at(i) ?? this[name].at(-1);
    }

    /** Array of unique (non-repeated) factors. */
    uniqueFactors() {
        return [ ...new Set(this.targetFactors) ];
    }

    /** True if factor(depth) != factor(depth-1) */
    isSplash(i) {
        if (i <= 0) return true; // first level always splash
        return this.targetFactor(i) !== this.targetFactor(i - 1);
    }

    /**
     * Converts undefined entries to previous values and ensures full length.
     */
    static norm(params, length) {
        const out = new Array(length).fill(undefined);
        let last = undefined;
        for (let i = 0; i < length; i++) {
            out[i] = params[i] ?? last;
            last = out[i];
        }
        return out;
    }

    /**
     * Generates the next-level projections from the given projection.
     *
     * @param {Projection} projection - single Projection
     * @returns {Iterable<Projection>} a TrueSet of new projections
     */
    generate(projection) {

        const depth = projection.depth();

        // Terminal condition: no more factors and all nodes are leaves
        const lastFactorIndex = this.targetFactors.length - 1;
        if (depth > lastFactorIndex &&
            projection.paths.every(p => p.last.node.nout === 0)) {
            return [];
        }

        const splash = this.isSplash(depth);
        const repeats = splash ?
            this.nSplash(depth) :
            this.nSplit(depth);
        const factor = this.get('targetFactors', depth);
        const modeller = this.get('modellers', depth);
        const trainSteps = this.get('trainSteps', depth);

        // Representation for TrueSet: dedupe by the array of model centers
        const repr = proj =>
            proj.paths.map(path => path.last.trainedModel.center);

        const out = new TrueSet(
            repr,
            new Classifier(SORTER.UNIFORM(ORDER.ASCENDING, ORDER.SINGULAR))
        );

        // Generate multiple random expansions — splash or split
        for (let j = 0; j < repeats; j++) {
            const next = splash
                ? projection.splash(factor, modeller, this.convergenceThreshold, trainSteps)
                : projection.split(modeller, this.convergenceThreshold, trainSteps);
            out.add(next);
        }

        return out;
    }

}


