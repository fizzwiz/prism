import { Model } from "../rationale/Model.js";

/**
 * A **PointModel** is a Model centered around a specific center.
 *
 * It extends Model by providing the `.center` property, which represents
 * the central or representative location of the model.
 *
 * Subclasses may override `likelihood` and `sample` to define the actual
 * distributional behavior around this center.
 */
export class CenteredModel extends Model {

    /**
     * @param {*} center  
     *     The point representing the center of the model.
     */
    constructor(center) {
        super();
        this._center = center;
    }

    get center() {
        return this._center;
    }

}

