import rolesConfig from '../../assets/agents/roles.json'; // 引入角色配置JSON
import { RolePermissionMap } from '../agents/CommandTypes'; // 引入权限映射类型
// 空行用于分隔
export type RoleId = keyof typeof rolesConfig | string; // 定义角色标识类型
// 空行用于分隔
export interface PermissionsSave { role: RoleId }; // 定义序列化结构
// 空行用于分隔
export class Permissions { // 定义权限系统类
  private role: RoleId = 'worker'; // 默认角色为工人
  private roleMap: RolePermissionMap = rolesConfig as RolePermissionMap; // 缓存角色权限映射
  public constructor(customMap?: RolePermissionMap) { // 构造函数允许注入映射
    if (customMap) { // 如果传入自定义映射
      this.roleMap = customMap; // 覆盖默认映射
    } // 条件结束
  } // 构造结束
  public getRole(): RoleId { // 获取当前角色
    return this.role; // 返回角色标识
  } // 方法结束
  public setRole(role: RoleId): void { // 设置当前角色
    this.role = role; // 更新内部角色
  } // 方法结束
  private getPermission(role: RoleId): { canCommand: boolean; canApprove: boolean } { // 读取权限辅助函数
    const perm = this.roleMap[role]; // 查找权限
    if (perm) { // 如果存在
      return perm; // 返回配置
    } // 条件结束
    return { canCommand: false, canApprove: false }; // 默认返回无权限
  } // 方法结束
  public canCommand(): boolean { // 判断是否可发出命令
    return this.getPermission(this.role).canCommand; // 返回配置的命令权限
  } // 方法结束
  public canApprove(): boolean { // 判断是否可审批
    return this.getPermission(this.role).canApprove; // 返回配置的审批权限
  } // 方法结束
  public canBuild(): boolean { // 兼容旧接口判断建造权限
    return this.canCommand(); // 将建造视为命令权限
  } // 方法结束
  public toJSON(): PermissionsSave { // 序列化权限
    return { role: this.role }; // 返回保存数据
  } // 方法结束
  public static fromJSON(json: PermissionsSave | undefined | null): Permissions { // 反序列化权限
    const instance = new Permissions(); // 创建新实例
    if (json?.role) { // 如果存在角色
      instance.setRole(json.role); // 恢复角色
    } // 条件结束
    return instance; // 返回实例
  } // 方法结束
} // 类结束
