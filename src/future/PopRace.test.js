import { describe, it } from 'mocha';
import assert from 'assert';
import { Each, Path } from '@fizzwiz/fluent';
import { PopRace } from '../../main/run/PopRace.js';

describe('PopRace', () => {
    
    /** 
     * Reduces the Needleman-Wunsch algorithm to a PopRace.
     * 
     * Each item is represented as a `Path` of integers. The i-th item of the path represents 
     * the alignment between the i-th character of the sequence and `path[i]` in the genome.
     * 
     * - A loop (ansa) in the **sequence** is encoded by repeating the same index `path[i]` multiple times.
     * - A loop in the **genome** is encoded by skipping multiple indices:  
     *   `path[i + 1] = path[i] + k` where `k > 1`.
     * 
     * The value of a path is calculated as:
     * - `+1` for each correct match.
     * - `-1` for each mismatch or incorrect pairing.
     * 
     * The matching is purely **literal** (letters match if they are identical).
     */
    it('alignment', () => {
        const genome = 'ACTGGTAC', seq = 'AGT';

        const 
            pop = [new Path()],
            generator = (path, iStep) => {
                if (iStep >= seq.length) return [];
                const start = path.length === 0 ? 0 : path.last;
                return path.length == seq.length? [] 
                    : path.across(Each.NATURAL.when(genome.length, false).when(start, true));
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
        
            race = new PopRace(pop, 1, generator, partitioner, comparator);

        race.run();

        assert.equal(evaluator(race.ranking.peek()), evaluator(Path.of(3, 4, 5))); 
    });

});
