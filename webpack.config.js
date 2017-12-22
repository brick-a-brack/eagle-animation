var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path')

module.exports = {
  entry: {
  app: ['webpack/hot/dev-server', './app/main.js'],
},
output: {
  path: path.join(__dirname, '/build/'),
  filename: 'bundle.js',
  publicPath: 'http://localhost:8080/build/'
},
devServer: {
  contentBase: './assets',
  publicPath: 'http://localhost:8080/'
},
module: {
 loaders: [
   { test: /\.js$/, loader: 'babel-loader', query: {
          presets: ['es2015', 'react']
        }, exclude: /node_modules/ },
   { test: /\.css$/, loader: 'style-loader?sourceMap!css-loader?sourceMap' },
   { test: /\.less$/, loader: 'style-loader!css-loader!less-loader'}
 ]
},
 plugins: [
  new CopyWebpackPlugin([
    { from: 'assets', to: '' }
  ]),
   new webpack.HotModuleReplacementPlugin()
 ],
 target: "electron",
 devtool: 'source-map'
}