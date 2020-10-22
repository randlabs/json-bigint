const JSON = require("../dist");
const test = require("ava");

// -----------------------------------------------------------------------------

test('JSON stringify', (t) => {
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

test('JSON parse', (t) => {
	const str = '{ "small": 4587345.2, "big": 3242376423784623874 }';

	const obj = JSON.parse(str);

	t.deepEqual(obj, {
		small: 4587345.2,
		big: 3242376423784623874n
	});

	t.pass();
});
