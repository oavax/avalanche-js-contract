/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiCoderClass } from '../abi/api';
import { AbiModel } from '../models/types';
import { Contract } from '../contract';
export declare class EventFactory {
    contract: Contract;
    abiModel: any | AbiModel;
    abiCoder: AbiCoderClass;
    private eventKeys;
    constructor(contract: Contract);
    addEventsToContract(): Contract;
    /**
     * @function mapMethodKeys
     * @return {string[]} {description}
     */
    private mapEventKeys;
    private map;
}
