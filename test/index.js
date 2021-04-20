/* eslint-disable new-cap */
const JSON = require("../build");
const BigNumber = require("bignumber.js");
const test = require("ava");

// -----------------------------------------------------------------------------

test('JSON native BigInt stringify', (t) => {
	const obj = {
		big: 5674356348348534756n,
		small: 342342,
	};

	const str = JSON.stringify(obj, null, 2);

	t.is(str, '{\n' +
		'  "big": 5674356348348534756,\n' +
		'  "small": 342342\n' +
		'}');

	t.pass();
});

test('JSON native BigInt parse', (t) => {
	const str = '{ "small": 4587345.2, "big": 3242376423784623874 }';

	const obj = JSON.parse(str);

	t.deepEqual(obj, {
		small: 4587345.2,
		big: 3242376423784623874n
	});

	t.pass();
});

test('JSON BigNumber stringify', (t) => {
	const obj = {
		big: BigNumber("5674356348348534756.456785638475"),
		small: 342342,
	};

	const str = JSON.stringify(obj, null, 2, {
		bnStringify: bigNumberStringify
	});

	t.is(str, '{\n' +
		'  "big": 5674356348348534756.456785638475,\n' +
		'  "small": 342342\n' +
		'}');

	t.pass();
});

test('JSON BigNumber parse', (t) => {
	const str = '{ "small": 4587345.2, "big": 3242376423784623874.43534536 }';

	const obj = JSON.parse(str, {
		bnParse: bigNumberParse
	});

	t.deepEqual(obj, {
		small: 4587345.2,
		big: new BigNumber("3242376423784623874.43534536")
	});

	t.pass();
});

// -----------------------------------------------------------------------------

function bigNumberParse(value) {
	return new BigNumber(value);
}

function bigNumberStringify(value) {
	if (!BigNumber.isBigNumber(value))
		return undefined;
	return value.toFixed();
}
