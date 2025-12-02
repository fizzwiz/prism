import { PDistribution } from "../model/PDistribution.js";

/**
 * Abstract base class representing a **Modeller**.
 * 
 * A Modeller is responsible for generating the best model(s) fitting a given observation.
 * Subclasses must implement the `model` method.
 */
export class Modeller {

    /**
     * Returns the best model corresponding to the provided observation.
     * This method is abstract and must be implemented by subclasses.
     *
     * @param {PDistribution} observation - The observation.
     * @param {any} [point=undefined] - Optional condition as center for the returned model.
     * @returns {*} A model object that fits the observation. The type depends on the concrete implementation.
     *
     * @throws {Error} If called on the base class without implementation.
     */
    model(observation, point = undefined) {
        throw new Error('Abstract method "model(observation)" must be implemented by subclasses');
    }
}
