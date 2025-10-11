import { describe, it, expect } from 'vitest'; // 引入测试工具
import { Permissions } from '../src/build/Permissions'; // 引入权限系统

describe('Permissions', () => { // 权限测试套件
  it('evaluates roles and serialization', () => { // 测试角色与序列化
    const permissions = new Permissions(); // 创建权限实例
    expect(permissions.getRole()).toBe('worker'); // 默认角色应为工人
    expect(permissions.canBuild()).toBe(false); // 工人不可建造
    expect(permissions.canApprove()).toBe(false); // 工人不可审批
    permissions.setRole('emperor'); // 切换为皇帝
    expect(permissions.canBuild()).toBe(true); // 皇帝可建造
    expect(permissions.canApprove()).toBe(true); // 皇帝可审批
    const saved = permissions.toJSON(); // 序列化
    const restored = Permissions.fromJSON(saved); // 反序列化
    expect(restored.getRole()).toBe('emperor'); // 恢复角色
    expect(restored.canApprove()).toBe(true); // 权限保持
  }); // 用例结束
}); // 套件结束
