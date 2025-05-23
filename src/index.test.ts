import { EventEmitter } from './index';

describe('EventEmitter', () => {
  let emitter: EventEmitter

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('应该添加监听器并返回taskId', () => {
      const listener = jest.fn();
      const taskId = emitter.on('demo', listener);

      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^event_\d+_\d+$/);
    });

    it('空事件类型应该抛出错误', () => {
      const listener = jest.fn();
      expect(() => emitter.on('', listener)).toThrow('事件类型不能为空');
    });

    it('重复的监听器应该抛出错误', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      expect(() => emitter.on('test', listener)).toThrow('该事件类型已存在相同的监听器');
    });
  });

  describe('once', () => {
    it('监听器应该只触发一次', () => {
      const listener = jest.fn();
      emitter.once('test', listener);

      emitter.emit('test', 'data1');
      emitter.emit('test', 'data2');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('data1');
    });
  });

  describe('off', () => {
    it('应该移除指定的监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.off('test', listener1);

      emitter.emit('test', 'data');
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('应该清理空的事件类型', () => {
      const listener = jest.fn();
      emitter.on('test', listener);
      emitter.off('test', listener);

      expect(emitter.listenerCount('test')).toBe(0);
      expect(emitter.eventNames()).not.toContain('test');
    });
  });

  describe('offById', () => {
    it('应该通过taskId移除监听器', () => {
      const listener = jest.fn();
      const taskId = emitter.on('test', listener);

      emitter.offById('test', taskId);
      emitter.emit('test', 'data');

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('removeAllListeners', () => {
    it('应该移除指定类型的所有监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test1', listener1);
      emitter.on('test2', listener2);
      emitter.removeAllListeners('test1');

      emitter.emit('test1', 'data1');
      emitter.emit('test2', 'data2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('data2');
    });

    it('应该移除所有监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test1', listener1);
      emitter.on('test2', listener2);
      emitter.removeAllListeners();

      emitter.emit('test1', 'data1');
      emitter.emit('test2', 'data2');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('emit', () => {
    it('应该用正确的数据调用所有监听器', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.emit('test', 'data');

      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('应该处理监听器中的错误', () => {
      const error = new Error('测试错误');
      const listener = jest.fn().mockImplementation(() => { throw error; });

      // 在 Node.js 环境中测试
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const writeSpy = jest.spyOn(process.stderr, 'write').mockImplementation();
        emitter.on('test', listener);
        emitter.emit('test', 'data');
        expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('测试错误'));
        writeSpy.mockRestore();
      } else {
        // 在浏览器环境中测试
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        emitter.on('test', listener);
        emitter.emit('test', 'data');
        expect(consoleSpy).toHaveBeenCalledWith('事件监听器执行出错，事件类型："test"', error);
        consoleSpy.mockRestore();
      }
    });
  });

  describe('emitAsync', () => {
    it('应该处理异步监听器', async () => {
      const listener = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      emitter.on('test', listener);
      await emitter.emitAsync('test', 'data');

      expect(listener).toHaveBeenCalledWith('data');
    });

    it('应该处理异步监听器中的错误', async () => {
      const error = new Error('异步测试错误');
      const listener = jest.fn().mockRejectedValue(error);

      // 在 Node.js 环境中测试
      if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        const writeSpy = jest.spyOn(process.stderr, 'write').mockImplementation();
        emitter.on('test', listener);
        await emitter.emitAsync('test', 'data');
        expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('异步测试错误'));
        writeSpy.mockRestore();
      } else {
        // 在浏览器环境中测试
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        emitter.on('test', listener);
        await emitter.emitAsync('test', 'data');
        expect(consoleSpy).toHaveBeenCalledWith('异步事件监听器执行出错，事件类型："test"', error);
        consoleSpy.mockRestore();
      }
    });
  });

  describe('priority', () => {
    it('应该按优先级顺序调用监听器', () => {
      const calls: number[] = [];

      emitter.on('test', () => calls.push(1), false, 1);
      emitter.on('test', () => calls.push(2), false, 2);
      emitter.on('test', () => calls.push(0), false, 0);
      emitter.on('test', () => calls.push(3), false, 3);

      emitter.emit('test', 'data');

      expect(calls).toEqual([3, 2, 1, 0]);
    });
  });

  describe('getListeners', () => {
    it('应该返回带优先级的监听器列表', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      emitter.on('test', listener1, false, 1);
      emitter.on('test', listener2, false, 2);

      const listeners = emitter.getListeners('test');

      expect(listeners).toHaveLength(2);
      expect(listeners[0].priority).toBe(2);
      expect(listeners[1].priority).toBe(1);
    });

    it('对于不存在的事件类型应该返回空数组', () => {
      expect(emitter.getListeners('test')).toEqual([]);
    });
  });

  describe('listenerCount', () => {
    it('应该返回正确的监听器数量', () => {
      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(1);

      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(2);
    });
  });

  describe('eventNames', () => {
    it('应该返回所有事件名称', () => {
      emitter.on('test1', jest.fn());
      emitter.on('test2', jest.fn());

      const names = emitter.eventNames();
      expect(names).toContain('test1');
      expect(names).toContain('test2');
    });
  });
});
