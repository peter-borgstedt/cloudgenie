import { getEnvironments, getStage } from './lib/env-loader';

import { CheckerPlugin } from 'awesome-typescript-loader';
import CopyPlugin from 'copy-webpack-plugin';
import JsonReformatPlugin from './lib/json-reformat/plugin';
import NodeExternals from 'webpack-node-externals';
import TsConfigPathsPlugin from 'tsconfig-paths-webpack-plugin'; // Handle TypeScript path aliases
import chalk from 'chalk';
import path from 'path';
import webpack from 'webpack';

const stage = getStage();
console.log(`Build stage: ${chalk.red(stage)}`);

const reformatOptions = {
  stage,
  allowed: [
    'name', 'version', 'description', 'author', 'license', 'homepage',
    'repository', 'keywords', 'main', 'bin', 'dependencies'
  ],
  append: {
    local: {
      name: 'cloudgen-local',
      bin: { cloudgen: './bundle.js' },
    },
    test: {
      name: 'cloudgen-test',
      bin: { cloudgen: './bundle.js' },
    },
    preprod: {
      name: 'cloudgen-preprod',
      bin: { cloudgen: './bundle.js' },
    },
    prod: {
      name: 'cloudgen',
      bin: { cloudgen: './bundle.js' }
    }
  },
}

const config: webpack.Configuration = {
  target: 'node',
  mode: 'production',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\^package.json$/,
        loader: path.resolve('lib/json-reformat/loader.js'),
        options: reformatOptions
      },
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      }
    ],
  },
  externals: [NodeExternals()],
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
    plugins: [ new TsConfigPathsPlugin() ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.EnvironmentPlugin(getEnvironments(stage)),
    new webpack.BannerPlugin({ banner: '#!/usr/bin/env node', raw: true }),
    new CheckerPlugin(),
    new CopyPlugin([
      {
        from: 'src/assets/**/*',
        to: 'assets',
        transformPath: (targetPath): string => targetPath.replace('assets/src/', ''),
        flatten: false
      },
      {
        from: 'readme.md'
      }
    ]),
    new JsonReformatPlugin(Object.assign({ src: 'package.json' }, reformatOptions))
  ],
  node: {
    __dirname: false
  },
};

export default config;
