import { SortedArray } from "@fizzwiz/sorted";
import { Run } from "../main/core/Run.js";
import { Each, What, Path } from "@fizzwiz/fluent";

/**
 * A Generalized Selection Framework Inspired by the Needleman-Wunsch Algorithm
 *
 * This class abstracts the core concept of the Needleman-Wunsch algorithm to provide a 
 * generalized approach for transforming exponential computational problems into linear ones.
 *
 * ## Concept Overview:
 * The Needleman-Wunsch algorithm can be interpreted as a **selection process** involving multiple 
 * **populations**, each corresponding to a cell in the matrix.
 * The algorithm progresses column by column, with each column producing the next through the following steps:
 *
 * 1. Extracting items from each population.
 * 2. Expanding each item into multiple new candidates.
 * 3. Distributing these new candidates among the populations in the next column.
 *
 * Each population (a matrix cell) receives items from the previous column, evaluates them, 
 * and retains only the **top n candidates** for further processing. This selection mechanism 
 * enables the reduction of **r^c** potential candidates to just **r * c**, where:
 * - **r** is the number of rows (populations).
 * - **c** is the number of columns (iterations/set).
 *
 * While the original Needleman-Wunsch algorithm retains only one candidate per population,  
 * this framework allows each population to retain multiple candidates without increasing  
 * the overall complexity of the algorithm.
 *
 * ## Key Components:
 * To implement this **race of populations**, the following elements are required:
 *
 * - **Initial Population:** The starting set of candidates.
 * - **Generation Function:** Expands each candidate into multiple new ones.
 * - **Partition Function:** Distributes the newly generated candidates among the next populations.
 * - **Comparation Function:** Compares candidates within each population to select the best ones.
 *
 * By leveraging this structured selection process, complex combinatorial problems can be 
 * efficiently approximated or optimized while avoiding exponential growth.
 */
export class PopRace extends Run {
    /**
     * Constructs a PopRace instance with the given parameters.
     *
     * @param {Iterable} pop - The initial population of items.
     * @param {Number} popSize - Maximal number of items each generated population con hold.
     * @param {Function} generator - Function that generates new items from a given item.
     * @param {Function} partitioner - Function that assigns each item to a specific partition.
     * @param {Function} comparator - Function that compares items in descending order.
      */
    constructor(pop, popSize, generator, partitioner, comparator) {
        super();

        this._pop = pop;
        this._generator = generator;
        this._partitioner = partitioner;
        this._comparator = comparator;
        this._popSize = popSize;

        this._map = new Map();
        this._map.set(undefined, pop);

        /** all the selected item, during the race, sorted by value */
        this._ranking = new SortedArray(comparator);
    }

    /**
     * The initial population, represented as an iterable collection of items. Any number of items
     * is allowed, even beyond the `popSize` property.
     */
    get pop() {
        return this._pop;
    }

    /**
     * For each generated population, only the first `popSize` items are further propagated.
     */
    get popSize() {
        return this._popSize;
    }

    /**
     * Function f(item, iStep) that generates new items from a given item at the given step of this race.
     */
    get generator() {
        return this._generator;
    }

    /**
     * Function f(item, iStep) -> key that assigns each item to a specific partition.
     * Items within the same partition compete for selection.
     */
    get partitioner() {
        return this._partitioner;
    }

    /**
     * Function that compares two items to determine their ranking.
     * Used for selecting the best candidates within each partition.
     */
    get comparator() {
        return this._comparator;
    }

    /**
     * A mapping of partitions (as returned by the partitioner) to their respective populations.
     * Each partition maintains a sorted collection of items.
     */
    get map() {
        return this._map;
    }

    /**
     * Retrieves the final ranking of selected items from each step of the race.
     * 
     * - The items are sorted according to `this._comparator`.
     * - Only the first `this._popSize` are maintained.
     * 
     * @returns {Array} A sorted array of all selected items.
     */
    get ranking() {
        return this._ranking;
    }

    /** 
     * Executes this Race.
     * At the end of execution, `this._map` will contain the final winning populations.
     */
    run() {
        this._ranking.clear();
        let iStep = 0;
        
        while (this._map.size > 0) {
            const next = new Map();

            for (let [, pop] of this._map.entries()) {
                pop = pop.sort(this.comparator).slice(0, this.popSize);

                for (const item of Each.as(pop)) {
                    
                    this._ranking.add(item);
                    
                    for (const child of Each.as(What.as(this._generator).what(item, iStep))) {
                        const key = What.as(this._partitioner).what(child, iStep);
                        let queue = next.get(key);

                        if (!queue) {
                            queue = new Array();
                            next.set(key, queue);
                        }
                        queue.push(child);
                    }
                }
            }

            this._ranking.select(this.popSize);

            this._map.clear();
            this._map = next;
            iStep++; 
        }

        return this;
    }

    /**
     * PopRace for exploring and ranking sequences of choices from a set of options.
     * 
     * This method builds paths by selecting options and evaluates them using the provided `value` function.
     * The `filter` controls which paths are valid (e.g., to avoid repeats).
     * Add your own filters to restrict to sorted paths (combinations) or specific rule sets.
     * It can be useful to use indices pointing to options rather than source options themselves.
     * 
     * @param {Iterable<boolean | number | string>} options - The available choices to construct paths from.
     * @param {Function} filter - A predicate (path) => boolean, used to prune paths.
     * @param {Function} value - A scoring function (path) => number, evaluating path quality.
     * @param {number} [popSize=16] - Number of top paths to retain at each step.
     * @returns {PopRace} A configured PopRace instance for path exploration.
     */
    static ofChoices(options, filter, value, popSize = 16) {
        options = [...options, null]; // null acts as a terminator

        const generator = path => path.across(options).which(filter);

        const partitioner = path => path.last;

        const comparator = (a, b) => -(value(a) - value(b));

        return new PopRace([new Path()], popSize, generator, partitioner, comparator);
    }

    /**
     * PopRace for exploring and ranking sequences of matches [r, c] 
     * @param {*} nrows 
     * @param {*} ncols 
     * @param {*} value 
     * @param {*} popSize 
     */
    static ofMatches(nrows, ncols, value, popSize = 16) {
        throw new Error("not implemented yet");
    }

}
