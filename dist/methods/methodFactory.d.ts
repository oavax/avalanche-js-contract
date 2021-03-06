/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiCoderClass } from '../abi/api';
import { AbiModel } from '../models/types';
import { Contract } from '../contract';
export declare class MethodFactory {
    contract: Contract;
    abiModel: any | AbiModel;
    abiCoder: AbiCoderClass;
    private methodKeys;
    constructor(contract: Contract);
    addMethodsToContract(): Contract;
    /**
     * @function mapMethodKeys
     * @return {string[]} {description}
     */
    private mapMethodKeys;
}
