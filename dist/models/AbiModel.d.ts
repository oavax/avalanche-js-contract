/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiItemModel } from './types';
export declare class AbiModel {
    abi: any;
    constructor(mappedAbi: any);
    getMethod(name: string): AbiItemModel | false;
    getMethods(): AbiItemModel[];
    getEvent(name: string): AbiItemModel | false;
    getFallback(): AbiItemModel | false;
    getReceive(): AbiItemModel | false;
    getEvents(): AbiItemModel[];
    getEventBySignature(signature: string): AbiItemModel | undefined;
    hasMethod(name: string): boolean;
    hasFallback(): boolean;
    hasReceive(): boolean;
    hasEvent(name: string): boolean;
}
