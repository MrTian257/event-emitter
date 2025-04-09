# Event Emitter

一个功能强大的 TypeScript 事件发射器实现，支持同步和异步事件处理，优先级机制，以及完整的事件管理功能。

## 特性

- 🚀 支持同步和异步事件处理
- ⚡ 类型安全（TypeScript）
- 🎯 事件监听器优先级机制
- 🔄 一次性事件监听器支持
- 🛡️ 自动错误处理
- 🌐 支持 Node.js 和浏览器环境
- 📦 轻量级，无外部依赖

## 安装

```bash
npm install event-emitter
# 或
yarn add event-emitter
```

## 快速开始

```typescript
import { EventEmitter } from 'event-emitter';

// 创建事件发射器实例
const emitter = new EventEmitter();

// 添加事件监听器
emitter.on('message', (data) => {
  console.log('收到消息：', data);
});

// 触发事件
emitter.emit('message', { text: 'Hello World' });
```

## API 文档

### 添加事件监听器

```typescript
// 添加普通事件监听器
const taskId = emitter.on('eventName', (data) => {
  console.log(data);
});

// 添加一次性事件监听器
const taskId = emitter.once('eventName', (data) => {
  console.log(data);
});

// 添加带优先级的事件监听器
const taskId = emitter.on('eventName', (data) => {
  console.log(data);
}, false, 10); // 优先级为10
```

### 移除事件监听器

```typescript
// 通过监听器函数移除
const listener = (data) => console.log(data);
emitter.on('eventName', listener);
emitter.off('eventName', listener);

// 通过任务ID移除
const taskId = emitter.on('eventName', (data) => console.log(data));
emitter.offById('eventName', taskId);

// 移除所有监听器
emitter.removeAllListeners(); // 移除所有事件的所有监听器
emitter.removeAllListeners('eventName'); // 移除特定事件的所有监听器
```

### 触发事件

```typescript
// 同步触发事件
emitter.emit('eventName', { message: 'Hello' });

// 异步触发事件
await emitter.emitAsync('eventName', { message: 'Hello' });
```

### 查询事件信息

```typescript
// 获取事件监听器数量
const count = emitter.listenerCount('eventName');

// 获取所有已注册的事件类型
const events = emitter.eventNames();

// 获取特定事件的所有监听器
const listeners = emitter.getListeners('eventName');
```

## 使用示例

### 基本事件处理

```typescript
const emitter = new EventEmitter();

// 添加事件监听器
emitter.on('userLogin', (user) => {
  console.log(`用户 ${user.name} 已登录`);
});

// 触发事件
emitter.emit('userLogin', { name: '张三', id: 123 });
```

### 优先级事件处理

```typescript
const emitter = new EventEmitter();

// 添加不同优先级的事件监听器
emitter.on('data', (data) => {
  console.log('低优先级处理：', data);
}, false, 1);

emitter.on('data', (data) => {
  console.log('高优先级处理：', data);
}, false, 10);

// 触发事件
emitter.emit('data', { value: 42 });
```

### 异步事件处理

```typescript
const emitter = new EventEmitter();

// 添加异步事件监听器
emitter.on('fetchData', async (url) => {
  const response = await fetch(url);
  const data = await response.json();
  console.log('获取到的数据：', data);
});

// 异步触发事件
await emitter.emitAsync('fetchData', 'https://api.example.com/data');
```

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 运行测试
npm test

# 运行测试（监视模式）
npm run test:watch
```

## 注意事项

1. 事件类型（type）不能为空字符串
2. 不能为同一事件类型添加相同的监听器函数
3. 异步事件触发时，监听器会按顺序执行
4. 监听器的优先级数字越大，执行顺序越靠前
5. 一次性监听器（once）在触发后会自动移除

## 许可证

MIT 