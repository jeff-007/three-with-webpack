// CommonJs规范
module.exports = {
    // 标记当前代码最终的运行环境，eslint根据运行环境信息判断js的某个全局api（浏览器环境下的window,document）在当前环境是否可以使用
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "plugin:vue/essential",
        "standard"
    ],
    "parserOptions": {
        "ecmaVersion": 12
    },
    "plugins": [
        "vue"
    ],
    "rules": {
    }
};
