const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

/** @type {webpack.Configuration} */
module.exports = {
  mode: 'development',
  entry: {
    content: './src/content.ts',
    background: './src/background.ts',
    'chat-downloader': './src/chat-downloader.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        options: {
          loader: 'tsx',
          target: 'es2015'
        }
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: "public/manifest.json",
          to: "manifest.json",
        },
      ]
    }),
  ],
  devServer: {
    port: 3030,
    devMiddleware: {
      writeToDisk: true,
    },
  },
  devtool: 'cheap-module-source-map',
}