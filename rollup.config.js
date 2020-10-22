/* eslint-disable global-require */
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import ts from "@wessberg/rollup-plugin-ts";
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

export default [
	{
		input: './src/index.ts',
		output: {
			file: pkg.main,
			format: 'cjs',
			sourcemap: true,
			exports: "auto"
		},
		plugins: [
			ts({
				tsconfig: "./tsconfig.json"
			}),
			commonjs(),
			resolve(),
			terser({
				ecma: 2020
			})
		]
	},
	{
		input: './src/index.ts',
		output: [
			{
				name: "JSONBigInt",
				file: pkg.browser,
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
				browser: true,
				preferBuiltins: false
			}),
			terser({
				ecma: 2020
			})
		]
	}
];
