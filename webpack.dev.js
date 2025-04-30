const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    port: 9000,
    hot: true,
    historyApiFallback: true, // Penting untuk SPA routing
    open: true, // Buka browser otomatis
    compress: true,
    client: {
      overlay: {
        errors: true,
        warnings: false, // Kurangi gangguan dengan menonaktifkan overlay untuk peringatan
      },
      progress: true,
    },
    devMiddleware: {
      writeToDisk: false,
    },
  },
  optimization: {
    runtimeChunk: 'single',
  },
});
