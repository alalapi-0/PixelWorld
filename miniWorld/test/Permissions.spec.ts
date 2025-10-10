import { describe, it, expect } from 'vitest'; // 引入测试工具
import { Permissions } from '../src/build/Permissions'; // 引入权限系统

describe('Permissions', () => { // 权限测试套件
  it('evaluates roles and serialization', () => { // 测试角色与序列化
    const permissions = new Permissions(); // 创建权限实例
    expect(permissions.getRole()).toBe('Visitor'); // 默认角色应为访客
    expect(permissions.canBuild()).toBe(false); // 访客不可建造
    expect(permissions.canApprove()).toBe(false); // 访客不可审批
    permissions.setRole('Manager'); // 切换为经理
    expect(permissions.canBuild()).toBe(true); // 经理可建造
    expect(permissions.canApprove()).toBe(true); // 经理可审批
    const saved = permissions.toJSON(); // 序列化
    const restored = Permissions.fromJSON(saved); // 反序列化
    expect(restored.getRole()).toBe('Manager'); // 恢复角色
    expect(restored.canApprove()).toBe(true); // 权限保持
  }); // 用例结束
}); // 套件结束
