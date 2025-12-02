import { Classifier, ORDER, SORTER } from "@fizzwiz/sorted";
import { Run } from "../core/Run.js";
import { Each } from "@fizzwiz/fluent";

/**
 * A Generalized Selection Framework Inspired by the Needleman-Wunsch Algorithm.
 *
 * PopRace implements a **selection process** over populations (partitions), iteratively
 * expanding candidates, distributing them to partitions, and selecting the best ones.
 *
 * It reduces the potential combinatorial explosion by retaining only the top N items
 * per partition at each step and optionally keeping a limited chronology of previous steps.
 *
 * The `generator` and `partitioner` functions can be swapped dynamically, e.g., via event listeners,
 * allowing the race to adapt as it progresses.
 *
 * @example
 * const race = new PopRace(
 *   initialPopulation,
 *   16,
 *   item => generateCandidates(item),
 *   item => partitionKey(item),
 *   (a, b) => b.score - a.score
 * );
 *
 * race.on('start', (phase, race, ...args) => { ... });
 * race.on('end', (phase, race, ...args) => { ... });
 * race.run();
 */
export class PopRace extends Run {

    /**
     * Tracks the best populations over time.
     * Map: stepIndex → Classifier containing top items at that step.
     * @type {Classifier}
     */
    chronology;

    /**
     * Indicates whether the race execution is stopped.
     * Can be set externally or via event listeners to interrupt the run.
     * @type {boolean}
     */
    stopped = true;

    /**
     * Currently processed node
     */
    currentPartition;

    /**
     * Constructs a PopRace instance.
     *
     * @param {Iterable} pop0 - Initial population of items.
     * @param {number} popSize - Maximum items per partition.
     * @param {function(item): Iterable<*>} generator - Generates new candidates from an item.
     * @param {function(item): any} partitioner - Maps an item to a partition key.
     * @param {function(a,b):number} itemComparator - Sort function for items (descending order recommended).
     * @param {number} [maxSteps=Infinity] - Maximum number of evolutionary steps.
     * @param {number} [maxChronology=1] - Maximum number of past populations to keep in chronology.
     */
    constructor(pop0, popSize, generator, partitioner, itemComparator, maxSteps = Infinity, maxChronology = 1) {
        super();

        this.pop0 = pop0;
        this.popSize = popSize;
        this.generator = generator;
        this.partitioner = partitioner;
        this.itemComparator = itemComparator;
        this.maxSteps = maxSteps;
        this.maxChronology = maxChronology;

        // classifier tracks top items per partition at the current step
        this.classifier = new Classifier(SORTER.UNIFORM(ORDER.ASCENDING, itemComparator));
        Each.as(pop0).sthen(item => this.classifier.add('pop0', item)).each();

        // chronology tracks top items across steps
        this.chronology = new Classifier(SORTER.UNIFORM(ORDER.ASCENDING, itemComparator));
        Each.as(pop0).sthen(item => this.chronology.add(0, item)).each();

        this.currentPartition = undefined;
    }

    /**
     * Executes the race.
     * At the end, `this.chronology` contains the latest `maxChronology` steps.
     *
     * **Stop control:** Set `race.stopped = true` externally or inside an event listener to halt execution.
     *
     * @fires PopRace#start Emitted at the start of each PHASE (RACE | STEP | POP).
     *   - Arguments: (phase, race, ...phaseArgs)
     * @fires PopRace#end   Emitted at the end of each PHASE (RACE | STEP | POP).
     *   - Arguments: (phase, race, ...phaseArgs)
     *
     * @returns {PopRace} Returns itself for chaining.
     */
    run() {
        this.stopped = false;

        this.emit('start', PopRace.PHASE.RACE, this);

        for (let iStep = 0; iStep < this.maxSteps; iStep++) {
            const pop = this.chronology.get(iStep).class;
            if (this.stopped || pop.n() === 0) break;

            this.emit('start', PopRace.PHASE.STEP, this, iStep);

            this.chronology.remove(iStep - this.maxChronology);

            const nextClassifier = new Classifier(SORTER.UNIFORM(ORDER.ASCENDING, this.itemComparator));

            for (const node of this.classifier.descendants()) {
                this.currentPartition = node;
                this.emit('start', PopRace.PHASE.POP, this, node, nextClassifier);

                for (const item of node.class) {
                    const generation = this.generator(item);
                    for (const next of generation) {
                        const part = this.partitioner(next);
                        nextClassifier.add(part, next);
                    }
                }

                this.emit('end', PopRace.PHASE.POP, this, node, nextClassifier);
                this.currentPartition = undefined;
                if (this.stopped) break;
            }

            // Select top items per partition and fill chronology
            for (const node of nextClassifier.descendants()) {
                node.class.select(this.popSize);
                for (const item of node.class) this.chronology.add(iStep + 1, item);
            }

            this.chronology.get(iStep + 1).class.select(this.popSize);
            this.classifier = nextClassifier;

            this.emit('end', PopRace.PHASE.STEP, this, iStep);
            if (this.stopped) break;
        }

        this.emit('end', PopRace.PHASE.RACE, this);
        return this;
    }

    /**
     * Enum representing the phases of the race.
     * @readonly
     */
    static PHASE = {
        RACE: 'race',
        STEP: 'step',
        POP: 'pop'
    }
}
