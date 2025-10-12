import { Stats } from '../actors/Stats'; // 引入属性系统
import { XPSystem } from '../actors/XPSystem'; // 引入经验系统
// 分隔注释 // 保持行有注释
export class HUDStats { // 定义HUD统计组件
  private stats: Stats; // 属性引用
  private xp: XPSystem; // 经验系统引用
  private text = ''; // 缓存的显示文本
  public constructor(stats: Stats, xp: XPSystem) { // 构造函数
    this.stats = stats; // 保存属性引用
    this.xp = xp; // 保存经验引用
    this.recompute(); // 初始化文本
    this.stats.onChange(() => this.recompute()); // 注册属性变化监听
    this.xp.onLevelUp(() => this.recompute()); // 注册升级监听
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private recompute(): void { // 重新计算显示文本
    const level = this.stats.getLevel(); // 获取等级
    const xpCurrent = this.stats.getXP(); // 获取经验
    const nextLevel = Math.min(level + 1, this.xp.getMaxLevel()); // 计算下一等级
    const nextRequirement = this.xp.getXpForLevel(nextLevel); // 获取所需经验
    const baseRequirement = this.xp.getXpForLevel(level); // 当前等级基线
    const delta = nextRequirement - baseRequirement || 1; // 计算升级所需增量
    const progress = Math.max(0, xpCurrent - baseRequirement); // 计算当前进度
    const stamina = this.stats.getStamina(); // 当前体力
    const staminaMax = this.stats.getEffectiveStaminaMax(); // 体力上限
    const xpLabel = level >= this.xp.getMaxLevel() ? 'MAX' : `${progress}/${delta}`; // 生成经验文本
    this.text = `[LV${level}] XP: ${xpLabel} | STA: ${stamina}/${staminaMax}`; // 组装HUD文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public getDisplay(): string { // 获取当前HUD文本
    return this.text; // 返回缓存文本
  } // 方法结束
} // 类结束
