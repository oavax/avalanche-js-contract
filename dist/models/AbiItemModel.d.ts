/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiItemModel, AbiOutput, AbiInput } from './types';
export declare class AbiItem {
    abiItem: AbiItemModel;
    signature: string;
    name: string;
    payable: boolean;
    anonymous: boolean;
    type?: string;
    inputs?: AbiInput[];
    outputs?: AbiOutput[];
    contractMethodParameters: any[];
    constructor(abiItem: AbiItemModel | any);
    getInputLength(): number;
    getInputs(): AbiInput[];
    getOutputs(): AbiOutput[];
    getIndexedInputs(): AbiInput[];
    isOfType(type: string): boolean;
}
