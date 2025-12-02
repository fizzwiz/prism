/**
 * A bijection between discrete qualities and natural numbers.
 * Maps arrays of qualities to arrays of indices and vice versa.
 */
export class Indexer {
    /**
     * For each component i, maps a quality into an index.
     * Each map is a Map<Quality, number>.
     */
    itemToIndexMaps;

    /**
     * For each component i, stores the array of qualities.
     */
    factors;

    /**
     * @param {...Array} factors - Arrays of discrete qualities for each component.
     */
    constructor(...factors) {
        this.factors = factors.map(arr => [...arr]); // clone for safety
        this.itemToIndexMaps = this.factors.map(
            array => new Map(array.map((item, j) => [item, j]))
        );
    }

    /**
     * Converts an array of items to their indices.
     * @param  {...any} items
     * @returns {number[]} Array of indices
     */
    indices(...items) {
        if (items.length !== this.itemToIndexMaps.length) {
            throw new Error("Incorrect number of items provided.");
        }
        return items.map((item, i) => {
            const idx = this.itemToIndexMaps[i].get(item);
            if (idx === undefined) {
                throw new Error(`Item not found in factor ${i}: ${item}`);
            }
            return idx;
        });
    }

    /**
     * Converts an array of indices to their corresponding items.
     * @param  {...number} indices
     * @returns {Array} Array of items
     */
    items(...indices) {
        if (indices.length !== this.factors.length) {
            throw new Error("Incorrect number of indices provided.");
        }
        return indices.map((i, j) => {
            const arr = this.factors[j];
            if (i < 0 || i >= arr.length) {
                throw new Error(`Index out of range for factor ${j}: ${i}`);
            }
            return arr[i];
        });
    }

    /**
     * Convenience method for single-item factors
     */
    index(item) {
        return this.indices(item)[0];
    }

    /**
     * Convenience method for single-item factors
     */
    item(i) {
        return this.items(i)[0];
    }
}
