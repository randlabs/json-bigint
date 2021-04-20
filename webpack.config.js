/* eslint-disable no-empty-function */
const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const DtsBundler = require("dts-bundle-generator");

const targetIsNode = process.env.WEBPACK_TARGET === 'node';

// -----------------------------------------------------------------------------

module.exports = {
	mode: "production",
	target: targetIsNode ? "node" : "web",
	entry: "./src/index.ts",
	output: {
		filename: targetIsNode ? "index.js" : "json-bigint.min.js",
		path: path.resolve(__dirname, targetIsNode ? "build" : "dist"),
		library: (targetIsNode ? {
			type: "commonjs2",
			export: 'default'
		} : {
			name: "JSONBigInt",
			type: "umd",
			export: 'default'
		}),
		globalObject: "this"
	},
	module: {
		rules: [
			{
				test: /\.ts$/u,
				include: path.resolve(__dirname, "src"),
				use: [
					{
						loader: 'ts-loader'
					}
				]
			}
		]
	},
	resolve: {
		extensions: [ '.ts', '.js' ]
	},
	devtool: 'source-map',
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				extractComments: true,
				terserOptions: {
					ecma: 2020
				}
			})
		]
	},
	plugins: [
		new DtsBundlerPlugin()
	]
};

// -----------------------------------------------------------------------------

function DtsBundlerPlugin() {}

DtsBundlerPlugin.prototype.apply = function(compiler) {
	compiler.hooks.afterEmit.tap(
		"DtsBundlerPlugin",
		(compilation) => {
			if (compilation.options.entry.main.import.length > 0) {
				const output = DtsBundler.generateDtsBundle([
					{
						filePath: compilation.options.entry.main.import[0],
						output: {
							umdModuleName: "JSONBigInt",
							noBanner: true
						}
					}
				], {});

				const filename = "." + path.sep + (targetIsNode ? "index.d.ts" : "json-bigint.min.d.ts");
				fs.writeFileSync(path.resolve(compilation.options.output.path + path.sep, filename), output[0]);
			}
		}
	);
};
