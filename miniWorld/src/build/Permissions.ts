export type Role = 'Admin' | 'Manager' | 'Worker' | 'Visitor'; // 定义角色类型
export interface PermissionsSave { role: Role }; // 定义序列化结构
// 分隔注释 // 保持行有注释
export class Permissions { // 定义权限系统类
  private role: Role = 'Visitor'; // 默认角色为访客
  public constructor() {} // 空构造函数
  // 分隔注释 // 保持行有注释
  public getRole(): Role { // 获取当前角色
    return this.role; // 返回角色
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public setRole(role: Role): void { // 设置当前角色
    this.role = role; // 更新内部状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public canBuild(): boolean { // 判断是否可建造
    return this.role === 'Admin' || this.role === 'Manager' || this.role === 'Worker'; // 管理员经理工人可建造
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public canApprove(): boolean { // 判断是否可审批
    return this.role === 'Admin' || this.role === 'Manager'; // 管理员经理可审批
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public toJSON(): PermissionsSave { // 序列化权限
    return { role: this.role }; // 返回包含角色的对象
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public static fromJSON(json: PermissionsSave | undefined | null): Permissions { // 反序列化权限
    const instance = new Permissions(); // 创建新实例
    if (json?.role) { // 如果保存了角色
      instance.setRole(json.role); // 恢复角色
    } // 条件结束
    return instance; // 返回实例
  } // 方法结束
} // 类结束
