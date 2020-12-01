/* eslint-disable global-require */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from "@wessberg/rollup-plugin-ts";
import { terser } from 'rollup-plugin-terser';

// -----------------------------------------------------------------------------

export default [
	createConfig(false),
	createConfig(true)
];

// -----------------------------------------------------------------------------

function createConfig(minimify) {
	return {
		input: './src/index.ts',
		output: [
			{
				name: "JSONBigInt",
				file: "./dist/json-bigint" + (minimify ? ".min" : "") + ".js",
				format: 'umd',
				sourcemap: true,
				exports: "auto"
			}
		],
		plugins: [
			ts({
				tsconfig: "./tsconfig.json",
				browserslist: [ "last 1 version", "> 1%" ]
			}),
			commonjs({
				ignoreGlobal: true
			}),
			resolve({
				preferBuiltins: false
			}),
			terser({
				ecma: 2020,
				...((!minimify) && {
					compress: false,
					mangle: false,
					format: {
						beautify: true
					}
				})
			})
		]
	};
}
