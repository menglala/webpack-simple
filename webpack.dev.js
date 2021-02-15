'use strict'

const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // 这个插件将css提取成一个独立的文件，没办法和styleloader一起使用
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const glob = require('glob') // 多页面动态引入入口插件

const setMPA = () => {
  // 动态引入多页面入口
  let entry = {}
  const HtmlWebpackPlugins = []

  const entryFiles = glob.sync(path.join(__dirname, './src/*/index.js'))

  Object.keys(entryFiles).map((index) => {
    const entryFile = entryFiles[index]
    const match = entryFile.match(/src\/(.*)\/index\.js/)
    const pageName = match && match[1]
    console.log(pageName, match)

    entry[pageName] = entryFile
    HtmlWebpackPlugins.push(
      new HtmlWebpackPlugin({
        template: path.join(__dirname, `src/${pageName}/index.html`),
        filename: `${pageName}.html`,
        chunks: [pageName],
        inject: true,
        minify: {
          html5: true,
          collapseWhitespace: true,
          preserveLineBreaks: false,
          minifyCSS: true,
          minifyJS: true,
          removeComments: false,
        },
      })
    )
  })

  return {
    entry,
    HtmlWebpackPlugins,
  }
}
const { entry, HtmlWebpackPlugins } = setMPA()
module.exports = {
  // entry: {
  //   index: './src/index.js',
  //   search: './src/search.js',
  // },
  entry,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]_[contenthash].js', // 多入口使用[name]占位符区分 js打包使用chunkhash
  },
  mode: 'development', // 指定环境是production，development还是none，默认是production
  devServer: {
    contentBase: './dist',
    hot: true,
  },
  module: {
    rules: [
      {
        test: /.js$/,
        use: 'babel-loader', // 对js文件使用babel解析
      },
      {
        test: /.(png|jpg|gif|jpeg)$/,
        use: 'file-loader', // 对js文件使用babel解析
      },
      {
        test: /.(woff|woff2|eot|tff)$/,
        use: 'file-loader', // 对js文件使用babel解析
      },
      {
        test: /.(png|jpg|gif|jpeg)$/,
        use: [
          {
            loader: 'url-loader', // 对js文件使用babel解析
            options: {
              limit: 10240,
              name: 'img/[name][hash:8].[ext]', // [hash]占位符
            },
          },
        ],
      },
      {
        test: /.css$/,
        use: [
          'style-loader', // 链式调用，先调用style-loader
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    // new webpack.HotModuleReplacementPlugin(),
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
    }),
    new MiniCssExtractPlugin({
      filename: `[name][contenthash:8].css`,
    }),
  ].concat(HtmlWebpackPlugins),
  devtool: 'cheap-source-map',
}
