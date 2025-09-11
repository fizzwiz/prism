import assert from "assert";
import { Path } from '@ut8pia/fluent/util/Path.js';
import { PopRace } from './src/main/race/PopRace.js';
import { Each } from '@ut8pia/fluent/core/Each.js';

const genome = 'ACTGGTAC', seq = 'AGT';

const 
    pop = [new Path()],
    generator = path => {
        const 
            start = path.length === 0? 0: path.last,
            range = Each.NATURAL.when(genome.length, false).when(start, true);

        return path.across(range);
    },    

    partitioner = path => path.last,

    evaluator = path => 
        path.toArray().reduce((sum, j, index, array) => {
            let score = sum;

            if (index > 0) {
                // Loop (ansa) in the sequence
                if (array[index] === array[index - 1]) {
                    score--;
                    return score;
                }
                // Loop (ansa) in the genome
                if (array[index] > array[index - 1] + 1) score -= (array[index] - array[index - 1] - 1);
            }

            score += genome[array[index]] === seq[index] ? +1 : -1;
            return score; 
        }, 0),

    comparator = (a, b) => evaluator(b) - evaluator(a), // Sort in descending order

    selector = (item, i) => i === 0, // Select only the best item from each population

    terminator = (_, iStep) => iStep >= seq.length,

    race = new PopRace(pop, generator, partitioner, comparator, selector, terminator);
    console.log(generator(new Path()).toArray().map(path => path.toArray()));

    race.run();
    const result = race.meld();
    assert(evaluator(result[0]) == evaluator(Path.of(3, 4, 5)));

