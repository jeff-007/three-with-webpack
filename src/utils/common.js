/**
 * 函数call方法模拟实现
 * call() 方法在使用一个指定的 this 值和若干个指定的参数值的前提下调用某个函数或方法。
 * 先在需要改变this指向的目标对象中，讲调用的函数设置为该目标对象的属性
 * 然后执行该函数
 * 最后删除该函数
 */

Function.prototype.call2 = function (text) {
  // 首先要获取调用call的函数，用this可以获取
  const context = text || window;
  context.fn = this;

  const args = [];
  for (let i = 1, len = arguments.length; i < len; i++) {
    args.push('arguments[' + i + ']');
  }

  const result = eval('context.fn(' + args + ')');

  delete context.fn
  return result;
}

/**
 * apply实现，与cal类似
 */

Function.prototype.apply = function (text, arr) {
  const context = Object(text) || window;
  context.fn = this;

  let result;
  if (!arr) {
    result = context.fn();
  } else {
    const args = [];
    for (let i = 0, len = arr.length; i < len; i++) {
      args.push('arr[' + i + ']');
    }
    result = eval('context.fn(' + args + ')')
  }

  delete context.fn
  return result;
}


/**
 * bind模拟实现
 * bind() 方法会创建一个新函数。当这个新函数被调用时，bind() 的第一个参数将作为它运行时的 this，之后的一序列参数将会在传递的实参前传入作为它的参数
 */

Function.prototype.bind2 = function (context) {
  if (typeof this !== 'function') {
    throw new Error('Function.prototype.bind - what is trying to be bound is not callable');
  }

  const self = this;
  const args = Array.prototype.slice.call(arguments, 1);

  const fNOP = function () {};

  const fBound = function () {
    const bindArgs = Array.prototype.slice.call(arguments);
    return self.apply(this instanceof fNOP ? this : context, args.concat(bindArgs));
  }

  fNOP.prototype = this.prototype;
  fBound.prototype = new fNOP();
  return fBound;
}


// 示例

// var foo = {
//   value: 1
// };
//
// function bar(name, age) {
//   console.log(this.value);
//   console.log(name);
//   console.log(age);
//
// }
//
// var bindFoo = bar.bind(foo, 'daisy');
// bindFoo('18');
// // 1
// // daisy
// // 18

/**
 * new的模拟实现
 * new 运算符创建一个用户定义的对象类型的实例或具有构造函数的内置对象类型之一
 * 通过new创建的实例可以访问到类构造函数里的属性，以及构造函数 prototype 中的属性
 */

function objectFactory() {

  var obj = new Object(),

    Constructor = [].shift.call(arguments);
  console.log('Constructor', Constructor)

  obj.__proto__ = Constructor.prototype;

  Constructor.apply(obj, arguments);

  return obj;

};

