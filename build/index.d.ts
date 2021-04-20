export declare type ReviverFn = (this: any, key: string, value: any) => any;
export declare type ReplacerFn = (key: string, value: any) => any;
export declare type BigNumberParse = (value: string) => any;
export declare type BigNumberStringify = (value: any) => string | null | undefined;
export interface ParseOptions {
	bnParse?: BigNumberParse;
}
export interface StringifyOptions {
	bnStringify?: BigNumberStringify;
}
export default class JSONBigInt {
	static parse(text: string, reviver?: ReviverFn | null, options?: ParseOptions): any;
	static stringify(value: any, replacer?: ReplacerFn | null, space?: string | number | null, options?: StringifyOptions): string;
	private static generateTag;
	private static convertTaggedBigNumbers;
	private static shallowCopyAndTagBigNumbers;
}

export as namespace JSONBigInt;

export {};
