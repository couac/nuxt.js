'use strict'

const _ = require('lodash')
const webpack = require('webpack')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const base = require('./base.config.js')
const { resolve } = require('path')

/*
|--------------------------------------------------------------------------
| Webpack Client Config
|
| Generate public/dist/client-vendor-bundle.js
| Generate public/dist/client-bundle.js
|
| In production, will generate public/dist/style.css
|--------------------------------------------------------------------------
*/
module.exports = function () {
  let config = base.call(this, { isClient: true })

  // Entry
  config.entry.app = resolve(this.dir, '.nuxt', 'client.js')

  // Add vendors
  if (this.options.store) {
    config.entry.vendor.push('vuex')
  }
  config.entry.vendor = config.entry.vendor.concat(this.options.build.vendor)

  // Output
  config.output.path = resolve(this.dir, '.nuxt', 'dist')
  config.output.filename = this.options.build.filenames.app

  // env object defined in nuxt.config.js
  let env = {}
  _.each(this.options.env, (value, key) => {
    env['process.env.' + key] = (typeof value === 'string' ? JSON.stringify(value) : value)
  })
  // Webpack plugins
  config.plugins = (config.plugins || []).concat([
    // strip comments in Vue code
    new webpack.DefinePlugin(Object.assign(env, {
      'process.env.NODE_ENV': JSON.stringify(this.dev ? 'development' : 'production'),
      'process.BROWSER_BUILD': true,
      'process.SERVER_BUILD': false
    })),
    // Extract vendor chunks for better caching
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: this.options.build.filenames.vendor
    })
  ])

  // Production client build
  if (!this.dev) {
    config.plugins.push(
      // Use ExtractTextPlugin to extract CSS into a single file
      new ExtractTextPlugin({
        filename: this.options.build.filenames.css,
        allChunks: true
      }),
      // This is needed in webpack 2 for minifying CSS
      new webpack.LoaderOptionsPlugin({
        minimize: true
      }),
      // Minify JS
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false
        }
      })
    )
  }
  // Extend config
  if (typeof this.options.build.extend === 'function') {
    this.options.build.extend(config, {
      dev: this.dev,
      isClient: true
    })
  }
  return config
}
