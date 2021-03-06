/**
 * @packageDocumentation
 * @module avalanche-contract
 */
import { Wallet } from 'avalanche-js-account';
import { Transaction } from 'avalanche-js-transaction';
import { Emitter } from 'avalanche-js-network';
import { AbiItemModel } from '../models/types';
import { Contract } from '../contract';
export declare class ContractMethod {
    contract: Contract;
    params: any;
    methodKey: string;
    wallet: Wallet | any;
    abiItem: AbiItemModel;
    callResponse?: any;
    callPayload?: any;
    protected transaction: Transaction;
    constructor(methodKey: string, params: any, abiItem: AbiItemModel, contract: Contract);
    send(params: any): Emitter;
    call(options: any, blockNumber?: any): Promise<any>;
    estimateGas(options: any): Promise<any>;
    encodeABI(): any;
    debug(): {
        callResponse: any;
        callPayload: any;
    };
    protected signTransaction(updateNonce: boolean): Promise<any>;
    protected sendTransaction(signed: Transaction): Promise<[Transaction, string]>;
    protected confirm(id: string): Promise<void>;
    protected createTransaction(): Transaction;
    protected afterCall(response: any): any;
}
