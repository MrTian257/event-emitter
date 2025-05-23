/** 事件监听器的回调函数类型定义 */
type ListenerCallback<T> = (res: T) => void;

/** 环境检测 */
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

/** 日志函数，根据环境使用不同的实现 */
const logError = (message: string, error: Error): void => {
  if (isNode) {
    process.stderr.write(`${message}：${error.message}\n`);
  } else {
    console.error(message, error);
  }
};

/** 事件监听器类 */
class EventListener {
  /** 用于生成唯一ID的计数器 */
  private static idCounter = 0;

  constructor(
    /** 监听器回调函数 */
    public listener: ListenerCallback<any>,
    /** 是否只触发一次 */
    public once: boolean = false,
    /** 监听器的唯一标识 */
    public readonly taskId = `event_${++EventListener.idCounter}_${Date.now()}`,
    /** 触发次数计数 */
    public count: number = 0,
    /** 优先级，数字越大优先级越高 */
    public priority: number = 0
  ) {
  }
}

/** 事件发射器类 */
export class EventEmitter<E extends Record<string, any[]>> {
  /** 存储所有事件监听器的Map */
  private listeners = new Map<keyof E, Map<ListenerCallback<any>, EventListener>>();
  /** 临时存储需要移除的监听器 */
  private toRemove: ListenerCallback<any>[] = [];

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param listener 监听器回调函数
   * @param once 是否只触发一次
   * @param priority 优先级，数字越大优先级越高
   * @returns 监听器的唯一标识
   */
  on<T>(type: keyof E, listener: ListenerCallback<T>, once = false, priority = 0): string {
    if (!type) {
      throw new Error('事件类型不能为空');
    }

    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Map());
    }

    const listeners = this.listeners.get(type)!;
    if (listeners.has(listener)) {
      throw new Error('该事件类型已存在相同的监听器');
    }

    const task = new EventListener(listener, once, undefined, 0, priority);
    listeners.set(listener, task);
    return task.taskId;
  }

  /**
   * 添加一次性事件监听器
   * @param type 事件类型
   * @param listener 监听器回调函数
   * @param priority 优先级
   * @returns 监听器的唯一标识
   */
  once<T>(type: keyof E, listener: ListenerCallback<T>, priority = 0): string {
    return this.on<T>(type, listener, true, priority);
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener 要移除的监听器
   */
  off(type: (keyof E), listener: ListenerCallback<any>): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    listeners.delete(listener);
    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * 通过ID移除事件监听器
   * @param type 事件类型
   * @param taskId 监听器ID
   */
  offById(type: string, taskId: string): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    for (const [listener, eventListener] of listeners.entries()) {
      if (eventListener.taskId === taskId) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(type);
        }
        break;
      }
    }
  }

  /**
   * 移除所有监听器
   * @param type 可选的事件类型，如果不指定则移除所有事件的监听器
   */
  removeAllListeners(type?: string): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 触发事件
   * @param type 事件类型
   * @param data 事件数据
   */
  emit<T>(type: (keyof E), data: T): void {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    // 清空待移除数组
    this.toRemove.length = 0;

    // 按优先级排序监听器
    const sortedListeners = Array.from(listeners.entries())
      .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [listener, eventListener] of sortedListeners) {
      try {
        (listener as ListenerCallback<T>)(data);
        eventListener.count++;
        if (eventListener.once) {
          this.toRemove.push(listener);
        }
      } catch (error) {
        logError(`事件监听器执行出错，事件类型："${type as string}"`, error as Error);
      }
    }

    // 移除一次性监听器
    this.toRemove.forEach(listener => {
      listeners.delete(listener);
    });

    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * 异步触发事件
   * @param type 事件类型
   * @param data 事件数据
   */
  async emitAsync<T>(type: (keyof E), data: T): Promise<void> {
    const listeners = this.listeners.get(type);
    if (!listeners) return;

    // 清空待移除数组
    this.toRemove.length = 0;

    // 按优先级排序监听器
    const sortedListeners = Array.from(listeners.entries())
      .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [listener, eventListener] of sortedListeners) {
      try {
        await (listener as ListenerCallback<T>)(data);
        eventListener.count++;
        if (eventListener.once) {
          this.toRemove.push(listener);
        }
      } catch (error) {
        logError(`异步事件监听器执行出错，事件类型："${type as string}"`, error as Error);
      }
    }

    // 移除一次性监听器
    this.toRemove.forEach(listener => {
      listeners.delete(listener);
    });

    if (listeners.size === 0) {
      this.listeners.delete(type);
    }
  }

  /**
   * 获取指定事件类型的监听器数量
   * @param type 事件类型
   * @returns 监听器数量
   */
  listenerCount(type: (keyof E)): number {
    return this.listeners.get(type)?.size || 0;
  }

  /**
   * 获取所有已注册的事件类型
   * @returns 事件类型数组
   */
  eventNames(): string[] {
    return Array.from(this.listeners.keys()) as string[];
  }

  /**
   * 获取指定事件类型的所有监听器
   * @param type 事件类型
   * @returns 监听器数组，按优先级排序
   */
  getListeners(type: keyof E): { listener: ListenerCallback<any>, priority: number }[] {
    const listeners = this.listeners.get(type);
    if (!listeners) return [];

    return Array.from(listeners.entries())
      .map(([listener, eventListener]) => ({
        listener,
        priority: eventListener.priority
      }))
      .sort((a, b) => b.priority - a.priority);
  }
}
