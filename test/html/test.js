window.addEventListener("load", function () {
	const str = JSONBigInt.stringify({
		small: 4587345.2,
		big: 3242376423784623874n
	});

	const obj = JSONBigInt.parse(str);

	const elem = document.getElementById("output");
	elem.innerText = JSONBigInt.stringify(obj, null, 2);
});
