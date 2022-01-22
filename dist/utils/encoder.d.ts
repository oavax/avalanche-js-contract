/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiItemModel } from '../models/types';
import { AbiCoderClass } from '../abi/api';
export declare const methodEncoder: (abiCoder: AbiCoderClass, abiItemModel: AbiItemModel, deployData: string) => any;
export declare const eventFilterEncoder: (abiCoder: AbiCoderClass, abiItemModel: AbiItemModel, filter: any) => any[];
