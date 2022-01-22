/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiModel } from '../models/AbiModel';
import { AbiItemModel } from '../models/types';
import { AbiCoderClass } from '../abi/api';
export declare const abiMapper: (abi: any[], abiCoder: AbiCoderClass) => AbiModel;
export declare const isConstant: (abiItem: AbiItemModel) => boolean;
export declare const isPayable: (abiItem: AbiItemModel) => boolean;
