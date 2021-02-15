'use strict'

const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin') // 这个插件将css提取成一个独立的文件，没办法和styleloader一起使用
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin') // 生成dist前自动清理目录
const glob = require('glob') // 多页面动态引入入口插件
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin') // 将基础库(vue等)使用cdn引入

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
        chunks: ['vendors', pageName],
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
  entry: entry,
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name]_[chunkhash].js', // 多入口使用[name]占位符区分 js打包使用chunkhash
  },
  mode: 'none', // 指定环境是production，development还是none，默认是production
  module: {
    rules: [
      {
        test: /.js$/,
        use: 'babel-loader', // 对js文件使用babel解析
      },
      {
        test: /.(woff|woff2|eot|tff)$/,
        use: [
          {
            loader: 'file-loader', // 对js文件使用babel解析
            options: {
              // limit: 10240, //url-loader使用
              name: 'img/[name]_[hash:8].[ext]', // [hash]占位符
            },
          },
        ],
      },
      {
        test: /.(png|jpg|gif|jpeg)$/,
        use: [
          {
            // loader: 'url-loader',
            loader: 'file-loader', // 对js文件使用babel解析
            options: {
              // limit: 10240, //url-loader使用
              name: 'img/[name]_[hash:8].[ext]', // [hash]占位符
            },
          },
        ],
      },
      {
        test: /.css$/,
        use: [
          // 'style-loader', // 链式调用，先调用style-loader，将样式插入到head中
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader', // 自动补全css3前缀
            options: {
              plugins: () => [
                require('autoprefixer')({
                  browsers: ['last 2 version', '>1%', 'ios 7'],
                }),
              ],
            },
          },
          {
            loader: 'px2rem-loader',
            options: {
              remUnit: 75, // 1rem === 75px
              remPrecesion: 8, // 小数点后面的位数
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: `[name]_[contenthash:8].css`,
    }),
    new OptimizeCSSAssetsPlugin({
      assetNameRegExp: /\.css$/g,
      cssProcessor: require('cssnano'),
    }),
    new CleanWebpackPlugin(),
    // new HtmlWebpackExternalsPlugin({
    //   externals: [
    //     {
    //       module: 'vue',
    //       entry: 'https://cdn.jsdelivr.net/npm/vue/dist/vue.js',
    //       global: 'Vue',
    //     },
    //   ],
    // }),
  ].concat(HtmlWebpackPlugins),
  optimization: {
    // 将vue等基础库提取成venders文件
    splitChunks: {
      // minSize: 0,
      cacheGroups: {
        commons: {
          test: /(vue)/,
          name: 'vendors',
          // name: 'commons',
          chunks: 'all',
          // minChunks: 3
        },
      },
    },
  },
  // sourcemap类型
  // devtool: 'eval', // 不生成单独的sourcemap文件，使用eval块包裹代码，最后sourceURL指向源文件
  // devtool: 'source-map' // 生成.map文件,源文件最后一行说明生成了什么map文件
  devtool: 'inline-source-map', // js源文件跟sourcemap信息混合在一起,生成的js文件会变大
}
