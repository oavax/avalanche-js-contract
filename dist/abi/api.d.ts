/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
import { AbiCoder as ABICoder, ParamType } from './abiCoder';
import { Arrayish } from 'avalanche-js-crypto';
export declare class AbiCoderClass {
    coder: ABICoder;
    constructor(coder: ABICoder);
    encodeFunctionSignature(functionName: any): string;
    encodeEventSignature(functionName: any): string;
    encodeParameter(types: string | ParamType, param: any): string;
    encodeParameters(types: Array<string | ParamType>, params: any[]): string;
    encodeFunctionCall(jsonInterface: any, params: any[]): string;
    decodeParameter(type: ParamType, bytes: Arrayish): any;
    decodeParameters(outputs: ParamType[], bytes: Arrayish): any;
    decodeLog(inputs: any, data: string, topics: any): any;
    isStaticType(type: any): boolean;
}
