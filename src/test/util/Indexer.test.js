import assert from 'assert';
import { Indexer } from '../../main/util/Indexer.js'; 

describe('Indexer', function() {
    let multiFactorIndexer;
    let singleFactorIndexer;

    beforeEach(function() {
        // Multi-factor Indexer for general tests
        multiFactorIndexer = new Indexer(
            ['red', 'green', 'blue'],          // factor 0
            ['circle', 'square', 'triangle']   // factor 1
        );

        // Single-factor Indexer for index()/item() convenience tests
        singleFactorIndexer = new Indexer(['red', 'green', 'blue']);
    });

    describe('indices()', function() {
        it('should map items to correct indices', function() {
            const result = multiFactorIndexer.indices('green', 'triangle');
            assert.deepStrictEqual(result, [1, 2]);
        });

        it('should throw error for unknown item', function() {
            assert.throws(() => {
                multiFactorIndexer.indices('yellow', 'circle');
            }, /Item not found/);
        });

        it('should throw error for wrong number of items', function() {
            assert.throws(() => {
                multiFactorIndexer.indices('red');
            }, /Incorrect number of items/);
        });
    });

    describe('items()', function() {
        it('should map indices to correct items', function() {
            const result = multiFactorIndexer.items(2, 0);
            assert.deepStrictEqual(result, ['blue', 'circle']);
        });

        it('should throw error for out-of-range index', function() {
            assert.throws(() => {
                multiFactorIndexer.items(0, 5);
            }, /Index out of range/);
        });

        it('should throw error for wrong number of indices', function() {
            assert.throws(() => {
                multiFactorIndexer.items(1);
            }, /Incorrect number of indices/);
        });
    });

    describe('index() and item() - single-factor', function() {
        it('should return single index for single item', function() {
            assert.strictEqual(singleFactorIndexer.index('red'), 0);
            assert.strictEqual(singleFactorIndexer.index('blue'), 2);
        });

        it('should return single item for single index', function() {
            assert.strictEqual(singleFactorIndexer.item(1), 'green');
            assert.strictEqual(singleFactorIndexer.item(2), 'blue');
        });
    });

    describe('immutability', function() {
        it('should not be affected by external array mutation', function() {
            const external = ['x', 'y', 'z'];
            const idx = new Indexer(external);
            external.push('w'); // mutate after construction
            assert.deepStrictEqual(idx.indices('x'), [0]);
        });
    });
});
