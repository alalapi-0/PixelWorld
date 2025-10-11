// 模块：统一管理键盘输入状态与一次性回调
const keyState = new Map(); // 存储按键当前状态
const onceCallbacks = new Map(); // 存储一次性回调列表
let initialized = false; // 标记是否已初始化

export function initInput() { // 导出初始化函数
  if (initialized) { // 如果已经初始化
    return; // 直接返回
  } // 结束判断
  initialized = true; // 设置已初始化标记
  window.addEventListener("keydown", (event) => { // 监听按键按下事件
    keyState.set(event.code, true); // 记录按键已按下
    const callbacks = onceCallbacks.get(event.code); // 读取一次性回调列表
    if (callbacks && callbacks.length > 0) { // 如果存在待执行回调
      callbacks.forEach((fn) => fn()); // 执行所有回调函数
      onceCallbacks.set(event.code, []); // 清空回调列表
    } // 结束回调判断
  }); // 结束事件监听
  window.addEventListener("keyup", (event) => { // 监听按键抬起事件
    keyState.set(event.code, false); // 记录按键已抬起
  }); // 结束事件监听
  window.addEventListener("blur", () => { // 监听窗口失焦事件
    keyState.clear(); // 清空按键状态
  }); // 结束事件监听
} // 结束初始化函数

export function isDown(code) { // 导出查询按键是否按下的函数
  return keyState.get(code) === true; // 返回按键状态布尔值
} // 结束按键状态查询函数

export function onKeyOnce(code, callback) { // 导出一次性回调注册函数
  if (!onceCallbacks.has(code)) { // 如果回调列表不存在
    onceCallbacks.set(code, []); // 初始化为空数组
  } // 结束判断
  const list = onceCallbacks.get(code); // 获取回调列表引用
  list.push(callback); // 添加新的回调
} // 结束一次性回调函数
