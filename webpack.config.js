const path = require('path')
const webpack = require('webpack')

// 自动清除输出目录插件
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// 自动生成html插件
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
    mode: "none", // webpack工作模式
    entry: './src/main.js', // 打包入口文件
    output: {
        filename: "bundle.js",
        path: path.resolve('dist'), // 输出结果所在文件夹，必须是绝对路径
        // path: path.join(__dirname, "output"), // 输出结果所在文件夹，必须是绝对路径
    },
    devServer: {
        // 指定额外的静态资源路径，配置后可作为开发服务器的静态资源被直接访问
        // contentBase: '',
        // 代理配置
        // 示例代理请求github的api接口，http://localhost:8080/api/users 代理到=> https://api.github.com/api/users
        proxy: {
            '/api': {
                target: 'https://api.github.com',
                pathRewrite: {
                    '^/api': ''
                },
                changeOrigin: true
            }
        }
    },
    // devtool: 'source-map',
    // js之外的其他资源加载配置
    // 每个规则对象需设置两个对象，test：正则表达式，匹配打包过程中的文件，use：对应使用的loader
    module: {
        rules: [
            // 配置babel-loader，编译转换ES6新特性
            {
                test: /\.js$/,
                // 多个loader从后往前执行
                use: {
                    loader: 'babel-loader',
                    options: {
                        plugins: ["@babel/plugin-transform-runtime"]
                        // presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.css$/,
                // 多个loader从后往前执行
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|jpg|gif|jpeg|webp)$/,
                // 多个loader从后往前执行
                use: [
                    'file-loader',
                ]
            }
        ]
    },
    // 配置插件
    plugins: [
        new CleanWebpackPlugin(),
        // 通过配置参数对自动生成的html页面中的标题，元数据等进行修改
        new HtmlWebpackPlugin({
            title: 'Webpack Plugin Sample',
            meta: {
                viewport: 'width-device-width'
            },
            template: './src/index.html'
        }),
        // new webpack.HotModuleReplacementPlugin // 热更新HRM插件
    ],
    // webpack使用Tree-shaking插件检测并移除代码中未引用的代码，生产模式下会自动开启，其余模式可在配置文件中进行配置
    // optimization：集中优化webpack内部功能的一个配置项
    // usedExports 只导出外部使用的成员 minimize 压缩
    // concatenateModules 合并模块函数
    optimization: {
        usedExports: false,
        minimize: false,
        concatenateModules: true
    }
}
