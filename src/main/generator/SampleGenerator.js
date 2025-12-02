/**
 * A generator of *subsets* (combinatorial samples) drawn from a base set.
 *
 * ## Concept
 * `SampleGenerator` explores subsets of a given set by growing **sorted paths**.
 *
 * Each subset is represented as a `Path` of:
 *    { option, index }
 *
 * The `index` enforces sorted expansion:
 *
 *    parent.last.index < child.last.index
 *
 * ensuring each combination is generated exactly once in the non-repeating case.
 *
 * ## Repetition
 * If `repeat = true`, options may be reused.
 * In this case, generation begins again at index `0` for every extension.
 *
 * If `repeat = false`, only elements after the last index can be chosen.
 */
export class SampleGenerator {

    /**
     * @param {Iterable<any>} opts
     *      The base set of options to sample from.
     *
     * @param {boolean} [repeat=false]
     *      Whether paths may reuse earlier options.
     */
    constructor(opts, repeat = false) {
        this.opts = [...opts].map((option, index) => ({ option, index }));
        this.repeat = repeat;
    }

    /**
     * Generates the children of a given path.
     *
     * @param {Path} path
     * @returns {Iterable<Path>}
     */
    generate(path) {

        // Determine where to start
        const startIndex =
            path.length === 0
                ? 0
                : path.last.index + (this.repeat ? 0 : 1);

        // Slice remaining options
        const available = this.opts.slice(startIndex);

        // Expand through Path.across()
        return path.across(available);
    }

    /**
     * Converts this generator into a function.
     */
    toFunc() {
        return path => this.generate(path);
    }
}
