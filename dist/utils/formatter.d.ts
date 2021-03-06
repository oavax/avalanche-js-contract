/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
export declare const inputLogFormatter: (options: any) => any;
/**
 * Formats the output of a log
 *
 * @method outputLogFormatter
 *
 * @param {Object} log object
 *
 * @returns {Object} log
 */
export declare const outputLogFormatter: (log: any) => any;
export declare const inputBlockNumberFormatter: (blockNumber: any) => any;
export declare const isPredefinedBlockNumber: (blockNumber: string) => boolean;
export declare const inputAddressFormatter: (address: string) => string;
export declare const toTopic: (value: any) => any;
