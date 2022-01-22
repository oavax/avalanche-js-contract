/**
 * @packageDocumentation
 * @module avalanche-contract
 */
import { Wallet } from 'avalanche-js-account';
import { Contract } from './contract';
import { ContractOptions } from './utils/options';
export declare class ContractFactory {
    wallet: Wallet | any;
    constructor(wallet: Wallet | any);
    createContract(abi: any[], address?: string, options?: ContractOptions): Contract;
}
