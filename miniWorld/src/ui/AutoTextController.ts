import Phaser from 'phaser'; // 引入Phaser框架
import uiMeta from '../../assets/placeholders/ui.meta.json'; // 引入UI占位元数据
// 分隔注释 // 保持行有注释
interface IconMeta { auto: string; skip: string; } // 定义图标文本结构
interface ColorMeta { background: string; auto: string; skip: string; } // 定义颜色结构
interface UIMeta { icons: IconMeta; colors: ColorMeta; } // 定义元数据结构
// 分隔注释 // 保持行有注释
function parseHexColor(hex: string): number { // 将十六进制颜色转换为数值
  return Phaser.Display.Color.HexStringToColor(hex).color; // 利用Phaser解析颜色
} // 函数结束
// 分隔注释 // 保持行有注释
export class AutoTextController { // 定义自动文本控制器
  private scene: Phaser.Scene; // 保存场景引用
  private ratePerChar = 70; // 每个字符的默认等待毫秒
  private auto = false; // 记录自动播放状态
  private skip = false; // 记录跳过状态
  private autoIcon?: Phaser.GameObjects.Text; // 自动图标文本引用
  private skipIcon?: Phaser.GameObjects.Text; // 跳过图标文本引用
  private background?: Phaser.GameObjects.Rectangle; // 背景矩形引用
  private meta: UIMeta = uiMeta as UIMeta; // 保存元数据
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene) { // 构造函数
    this.scene = scene; // 保存场景
  } // 构造结束
  // 分隔注释 // 保持行有注释
  public setRatePerChar(ms: number): void { // 设置每字符等待时长
    this.ratePerChar = Math.max(10, ms); // 防止过小值
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public enableAuto(): void { // 开启自动播放
    this.auto = true; // 标记状态
    if (this.skip) { // 如果同时跳过
      this.skip = false; // 关闭跳过模式
    } // 条件结束
    this.updateIconStates(); // 更新图标显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public disableAuto(): void { // 关闭自动播放
    this.auto = false; // 更新状态
    this.updateIconStates(); // 更新图标
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public enableSkip(): void { // 开启跳过模式
    this.skip = true; // 标记跳过
    this.auto = false; // 跳过时关闭自动
    this.updateIconStates(); // 更新图标
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public disableSkip(): void { // 关闭跳过模式
    this.skip = false; // 更新状态
    this.updateIconStates(); // 更新图标
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isAuto(): boolean { // 查询自动状态
    return this.auto; // 返回自动标记
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isSkip(): boolean { // 查询跳过状态
    return this.skip; // 返回跳过标记
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public shouldAdvance(elapsedMs: number, text: string): boolean { // 判断是否应进入下一段
    if (this.skip) { // 如果跳过模式
      return true; // 立即推进
    } // 条件结束
    if (!this.auto) { // 如果未开启自动
      return false; // 不推进
    } // 条件结束
    const characters = Math.max(1, text.length); // 计算字符数
    const waitTime = this.ratePerChar * characters; // 计算总等待时间
    return elapsedMs >= waitTime; // 判断是否超过等待
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public drawSmallIcons(container: Phaser.GameObjects.Container): void { // 在容器中绘制提示图标
    if (!this.background) { // 如果尚未创建背景
      const bgColor = parseHexColor(this.meta.colors.background); // 解析背景颜色
      this.background = this.scene.add.rectangle(0, 0, 96, 40, bgColor, 0.7); // 创建矩形背景
      this.background.setOrigin(1, 1); // 设置右下角对齐
      container.add(this.background); // 添加到容器
    } // 条件结束
    if (!this.autoIcon) { // 如果未创建自动图标
      this.autoIcon = this.scene.add.text(-12, -28, this.meta.icons.auto, { fontFamily: 'sans-serif', fontSize: '12px', color: this.meta.colors.auto }); // 创建自动文本
      this.autoIcon.setOrigin(1, 1); // 设置对齐
      container.add(this.autoIcon); // 添加到容器
    } // 条件结束
    if (!this.skipIcon) { // 如果未创建跳过图标
      this.skipIcon = this.scene.add.text(-12, -10, this.meta.icons.skip, { fontFamily: 'sans-serif', fontSize: '12px', color: this.meta.colors.skip }); // 创建跳过文本
      this.skipIcon.setOrigin(1, 1); // 设置对齐
      container.add(this.skipIcon); // 添加到容器
    } // 条件结束
    this.updateIconStates(); // 更新显示状态
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateIconStates(): void { // 内部方法用于更新图标样式
    if (this.autoIcon) { // 如果存在自动图标
      this.autoIcon.setAlpha(this.auto ? 1 : 0.35); // 根据状态调整透明度
    } // 条件结束
    if (this.skipIcon) { // 如果存在跳过图标
      this.skipIcon.setAlpha(this.skip ? 1 : 0.35); // 根据状态调整透明度
    } // 条件结束
    if (this.background) { // 如果存在背景
      const alpha = this.auto || this.skip ? 0.85 : 0.5; // 根据状态调整背景透明度
      this.background.setAlpha(alpha); // 应用透明度
    } // 条件结束
  } // 方法结束
} // 类结束
