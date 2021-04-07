//License: Apache 2.0. See LICENSE.md

// -----------------------------------------------------------------------------

const reFindBigNumbers = /(^|[[:,]\s*)(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/ugm;

// -----------------------------------------------------------------------------

export default class JSONBigInt {
	public static parse(text: string, reviver?: (this: any, key: string, value: any) => any): any {
		const tag = JSONBigInt.generateTag();

		if (typeof text === 'string') {
			const matches = [];
			let match;
			const nonQuotedFragments = [];
			let nonQuotedStartIdx = 0;

			for (let startIdx = 0; ;) {
				//find starting quotes
				let quoteIdx = text.indexOf('"', startIdx);
				if (quoteIdx < 0) {
					//add final block
					nonQuotedFragments.push({
						start: nonQuotedStartIdx,
						end: text.length
					});
					break;
				}

				//ignore escaped quotes
				if (quoteIdx > 0 && text.charAt(quoteIdx - 1) == '\\') {
					startIdx = quoteIdx + 1;
					continue;
				}

				//add block
				nonQuotedFragments.push({
					start: nonQuotedStartIdx,
					end: quoteIdx
				});

				//now lookup for the closing quotes
				do {
					startIdx = quoteIdx + 1;
					quoteIdx = text.indexOf('"', startIdx);
				}
				while (quoteIdx > 0 && text.charAt(quoteIdx - 1) == '\\');

				if (quoteIdx < 0) {
					break;
				}

				//skip closing quote and start again
				startIdx = quoteIdx + 1;
				nonQuotedStartIdx = startIdx;
			}

			//now lookup for numbers inside each fragment
			for (const frag of nonQuotedFragments) {
				const str = text.substring(frag.start, frag.end);

				reFindBigNumbers.lastIndex = 0;
				while ((match = reFindBigNumbers.exec(str)) !== null) {
					const num = parseInt(match[2], 10);
					if (Number.isNaN(num) || (num >= Number.MIN_SAFE_INTEGER && num <= Number.MAX_SAFE_INTEGER)) {
						continue; //no need to convert invalid or safe integers
					}

					matches.push({
						ofs: frag.start + match.index + match[1].length,
						len: match[2].length,
						repl: match[2]
					});
				}
			}

			let idx = matches.length;
			while (idx > 0) {
				idx -= 1;

				const str = "{ \"" + tag + "\": \"" + matches[idx].repl + "\" }";

				text = text.substr(0, matches[idx].ofs) + str + text.substr(matches[idx].ofs + matches[idx].len);
			}
		}

		//do parsing
		let obj = JSON.parse(text, reviver);

		//now convert tagged objects to bigints
		const cv = JSONBigInt.convertToBigInt(obj, tag);
		if (cv) {
			obj = cv;
		}

		return obj;
	}

	public static stringify(value: any, replacer?: (key: string, value: any) => any, space?: string | number): string {
		const tag = JSONBigInt.generateTag();

		//first pass: convert bigints to strings surrounded by tag
		let str = JSON.stringify(value, (k: string, v: any) => {
			if (replacer) {
				v = replacer(k, v);
			}
			if (typeof v === "bigint") {
				v = tag + v.toString() + tag;
			}

			return v;
		}, space);

		//second pass: locate tagged objects and replace with the bigint number
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

			//got a tagged value, strip tags
			str = str.substr(0, idx) + str.substr(valueStartIdx, valueEndIdx - valueStartIdx) +
				str.substr(valueEndIdx + closingQuoteTag.length);

			//adjust starting index
			startIdx = idx + (valueEndIdx - valueStartIdx);
		}

		return str;
	}

	// --------------------------------
	// Private methods

	private static convertToBigInt(obj: any, tag: string): any {
		if (obj != null && typeof obj === 'object') {
			const keys = Object.keys(obj);

			if (keys.length == 1 && keys[0] == tag) {
				return BigInt(obj[tag]);
			}

			for (let idx = 0; idx < keys.length; idx++) {
				const cv = JSONBigInt.convertToBigInt(obj[keys[idx]], tag);
				if (cv != null) {
					obj[keys[idx]] = cv;
				}
			}
		}
		return null;
	}

	private static generateTag(): string {
		return "tag" + Date.now().toString() + Math.floor(Math.random() * 100000).toString();
	}
}
