var webpack = require('webpack');
const path = require('path')

module.exports = {
  entry: {
  app: ['webpack/hot/dev-server', './app/main.js'],
},
output: {
  path: path.join(__dirname, '/public/build/'),
  filename: 'bundle.js',
  publicPath: 'http://localhost:8080/build/'
},
devServer: {
  contentBase: './public',
  publicPath: 'http://localhost:8080/build/'
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
   new webpack.HotModuleReplacementPlugin()
 ],
 target: "electron",
 devtool: 'source-map'
}