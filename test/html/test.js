window.addEventListener("load", function () {
	var str, obj, elem;

	str = JSONBigInt.stringify({
		small: 4587345.2,
		big: 3242376423784623874n
	});

	obj = JSONBigInt.parse(str);
	elem = document.getElementById("bigint_test");
	elem.innerText = JSONBigInt.stringify(obj, null, 2);


	str = JSONBigInt.stringify({
		small: 4587345.2,
		big: new BigNumber("3242376423784623874.85674785645")
	}, {
		bnStringify: bigNumberStringify
	});

	obj = JSONBigInt.parse(str, {
		bnParse: bigNumberParse
	});
	elem = document.getElementById("bignumber_test");
	elem.innerText = JSONBigInt.stringify(obj, null, 2, {
		bnStringify: bigNumberStringify
	});
});

function bigNumberParse(value) {
	return new BigNumber(value);
}

function bigNumberStringify(value) {
	if (!BigNumber.isBigNumber(value))
		return undefined;
	return value.toFixed();
}
