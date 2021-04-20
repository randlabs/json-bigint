//License: Apache 2.0. See LICENSE.md

// -----------------------------------------------------------------------------

const reFindBigNumbers = /(^|[[:,]\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/ugm;

// -----------------------------------------------------------------------------

type ReviverFn = (this: any, key: string, value: any) => any;
type ReplacerFn = (key: string, value: any) => any;

type BigNumberParse = (value: string) => any;
type BigNumberStringify = (value: any) => string | null | undefined;

interface ParseOptions {
	bnParse?: BigNumberParse
}

interface StringifyOptions {
	bnStringify?: BigNumberStringify
}

// -----------------------------------------------------------------------------

export default class JSONBigInt {
	public static parse(text: string, reviver?: ReviverFn | null, options?: ParseOptions): any {
		if (reviver && typeof reviver === "object") {
			options = reviver! as ParseOptions;
			reviver = null;
		}

		// Set default big number parser if none is provided
		let bigNumberParse;
		if (options && options.bnParse) {
			bigNumberParse = options.bnParse;
		}
		else {
			bigNumberParse = function (value: string): any {
				return BigInt(value);
			};
		}

		// Generate our tag mark
		const tag = JSONBigInt.generateTag();

		// Preprocess text
		if (typeof text === 'string') {
			const matches = [];
			let match;
			const nonQuotedFragments = [];
			let nonQuotedStartIdx = 0;

			// Find blocks with numbers
			for (let startIdx = 0; ;) {
				// Find starting quotes
				let quoteIdx = text.indexOf('"', startIdx);
				if (quoteIdx < 0) {
					// Add final block
					nonQuotedFragments.push({
						start: nonQuotedStartIdx,
						end: text.length
					});
					break;
				}

				// Ignore escaped quotes
				if (quoteIdx > 0 && text.charAt(quoteIdx - 1) == '\\') {
					startIdx = quoteIdx + 1;
					continue;
				}

				// Add block
				nonQuotedFragments.push({
					start: nonQuotedStartIdx,
					end: quoteIdx
				});

				// Now lookup for the closing quotes
				do {
					startIdx = quoteIdx + 1;
					quoteIdx = text.indexOf('"', startIdx);
				}
				while (quoteIdx > 0 && text.charAt(quoteIdx - 1) == '\\');

				if (quoteIdx < 0) {
					break;
				}

				// Skip closing quote and start again
				startIdx = quoteIdx + 1;
				nonQuotedStartIdx = startIdx;
			}

			// Now lookup for numbers inside each fragment
			for (const frag of nonQuotedFragments) {
				const str = text.substring(frag.start, frag.end);

				reFindBigNumbers.lastIndex = 0;
				while ((match = reFindBigNumbers.exec(str)) !== null) {
					const num = parseInt(match[2], 10);
					if (Number.isNaN(num) || (num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER)) {
						// Skip this number because no need to convert invalid or safe integers
						continue;
					}

					// Add big number block to convert to the list
					matches.push({
						ofs: frag.start + match.index + match[1].length,
						len: match[2].length,
						repl: match[2]
					});
				}
			}

			// Tag blocks containing big numbers
			let idx = matches.length;
			while (idx > 0) {
				idx -= 1;

				const str = "{ \"" + tag + "\": \"" + matches[idx].repl + "\" }";

				text = text.substr(0, matches[idx].ofs) + str + text.substr(matches[idx].ofs + matches[idx].len);
			}
		}

		// Parse text
		let obj = JSON.parse(text, reviver ? reviver : undefined);

		// Convert tagged objects to big numbers
		const cv = JSONBigInt.convertTaggedBigNumbers(obj, tag, bigNumberParse);
		if (cv) {
			obj = cv;
		}

		// Done
		return obj;
	}

	public static stringify(value: any, replacer?: ReplacerFn | null, space?: string | number | null, options?: StringifyOptions): string {
		if (replacer && typeof replacer === "object") {
			options = replacer! as StringifyOptions;
			replacer = null;
			space = null;
		}
		else if (space && typeof space === "object") {
			options = space! as StringifyOptions;
			space = null;
		}

		// Generate our tag mark
		const tag = JSONBigInt.generateTag();

		// Convert big numbers to strings surrounded by tag
		value = JSONBigInt.shallowCopyAndTagBigNumbers(value, tag, options ? options.bnStringify : null);

		// Stringify new object
		let str = JSON.stringify(value, replacer ? replacer : undefined, space ? space : undefined);

		// Locate tagged objects and replace with the bigint number
		const openingQuoteTag = "\"" + tag;
		const closingQuoteTag = tag + "\"";
		let startIdx = 0;
		for (;;) {
			const idx = str.indexOf(openingQuoteTag, startIdx);
			if (idx < 0) {
				break;
			}
			const valueStartIdx = idx + openingQuoteTag.length;

			const valueEndIdx = str.indexOf(closingQuoteTag, valueStartIdx);
			if (valueEndIdx < 0) {
				break;
			}

			// Got a tagged value, strip tags
			str = str.substr(0, idx) + str.substr(valueStartIdx, valueEndIdx - valueStartIdx) +
				str.substr(valueEndIdx + closingQuoteTag.length);

			// Adjust starting index
			startIdx = idx + (valueEndIdx - valueStartIdx);
		}

		// Done
		return str;
	}

	// --------------------------------
	// Private methods

	private static generateTag(): string {
		return "tag" + Date.now().toString() + Math.floor(Math.random() * 100000).toString();
	}

	private static convertTaggedBigNumbers(obj: any, tag: string, bigNumberParse: BigNumberParse): any {
		if (obj != null && typeof obj === 'object') {
			const keys = Object.keys(obj);

			// If we are dealing with an object and the object has an unique key equal to the tag, then untag it and
			// convert to a big number.
			if (keys.length == 1 && keys[0] == tag) {
				return bigNumberParse(obj[tag]);
			}

			// Recurse nested objects
			for (let idx = 0; idx < keys.length; idx++) {
				const cv = JSONBigInt.convertTaggedBigNumbers(obj[keys[idx]], tag, bigNumberParse);
				if (cv != null) {
					obj[keys[idx]] = cv;
				}
			}
		}
		return null;
	}

	private static shallowCopyAndTagBigNumbers(obj: any, tag: string, bigNumberStringify?: BigNumberStringify | null): any {
		// Try to stringify big number if a callback is provided
		if (bigNumberStringify) {
			const s = bigNumberStringify(obj);
			if (typeof s === "string") {
				return tag + s + tag;
			}
		}

		// Stringify native bigints
		if (typeof obj === "bigint") {
			return tag + obj.toString() + tag;
		}

		// If an object, recurse shallow copy
		if (obj != null && typeof obj === 'object') {
			const keys = Object.keys(obj);
			const newObj: Record<any, any> = Array.isArray(obj) ? [] : {};

			for (let idx = 0; idx < keys.length; idx++) {
				newObj[keys[idx]] = JSONBigInt.shallowCopyAndTagBigNumbers(obj[keys[idx]], tag, bigNumberStringify);
			}
			return newObj;
		}

		// Done
		return obj;
	}
}
