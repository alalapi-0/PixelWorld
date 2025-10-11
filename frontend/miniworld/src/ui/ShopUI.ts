import Phaser from 'phaser'; // 引入Phaser框架
import { ShopService } from '../economy/ShopService'; // 引入商店服务
import { Shop, Goods, GOLD_ITEM_ID } from '../economy/ShopTypes'; // 引入商店类型
// 分隔注释 // 保持行有注释
type ShopMode = 'buy' | 'sell'; // 定义商店界面模式类型
// 分隔注释 // 保持行有注释
interface ListedGoods { goods: Goods; count: number; price: number; } // 定义列表项结构
// 分隔注释 // 保持行有注释
export class ShopUI extends Phaser.GameObjects.Container { // 定义商店UI容器类
  private shopService: ShopService; // 保存商店服务引用
  private shop: Shop; // 保存商店数据
  private mode: ShopMode = 'buy'; // 当前模式
  private isVisible = false; // 是否开启标记
  private selectedIndex = 0; // 当前选择索引
  private quantity = 1; // 当前购买或出售数量
  private listTexts: Phaser.GameObjects.Text[] = []; // 列表文字对象集合
  private detailText!: Phaser.GameObjects.Text; // 详情文本引用
  private headerText!: Phaser.GameObjects.Text; // 标题文本引用
  private goldText!: Phaser.GameObjects.Text; // 金币显示文本
  private modeText!: Phaser.GameObjects.Text; // 模式显示文本
  private keys!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; enter: Phaser.Input.Keyboard.Key; esc: Phaser.Input.Keyboard.Key; tab: Phaser.Input.Keyboard.Key }; // 按键引用集合
  private handlers: Array<{ key: Phaser.Input.Keyboard.Key; handler: () => void }> = []; // 按键处理器集合
  private cachedList: ListedGoods[] = []; // 缓存的展示商品
  // 分隔注释 // 保持行有注释
  public constructor(scene: Phaser.Scene, shopService: ShopService, shop: Shop) { // 构造函数
    super(scene, scene.scale.width / 2, scene.scale.height / 2); // 调用父类并设置位置
    this.shopService = shopService; // 保存商店服务
    this.shop = shop; // 保存商店数据
    this.setDepth(1500); // 提升渲染深度
    this.setScrollFactor(0); // 固定在屏幕中心
    this.scene.add.existing(this); // 将容器加入场景
    this.buildLayout(); // 构建界面布局
    this.createKeys(); // 创建按键引用
    this.setVisible(false); // 初始隐藏
  } // 构造结束
  // 分隔注释 // 保持行有注释
  private buildLayout(): void { // 构建界面布局
    const bg = this.scene.add.rectangle(0, 0, 520, 320, 0x000000, 0.75); // 创建背景矩形
    bg.setOrigin(0.5, 0.5); // 设置锚点
    this.add(bg); // 添加到容器
    const frame = this.scene.add.rectangle(0, 0, 520, 320); // 创建边框矩形
    frame.setStrokeStyle(2, 0xffffff, 0.8); // 设置描边
    frame.setOrigin(0.5, 0.5); // 设置锚点
    this.add(frame); // 添加到容器
    this.headerText = this.scene.add.text(-240, -140, '', { fontFamily: 'sans-serif', fontSize: '18px', color: '#ffdd88' }); // 创建标题文本
    this.headerText.setOrigin(0, 0); // 设置锚点
    this.add(this.headerText); // 添加到容器
    this.goldText = this.scene.add.text(240, -140, '', { fontFamily: 'sans-serif', fontSize: '16px', color: '#ffffaa' }); // 创建金币文本
    this.goldText.setOrigin(1, 0); // 设置锚点
    this.add(this.goldText); // 添加到容器
    this.modeText = this.scene.add.text(-240, -110, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff' }); // 创建模式文本
    this.modeText.setOrigin(0, 0); // 设置锚点
    this.add(this.modeText); // 添加到容器
    for (let i = 0; i < 7; i += 1) { // 循环创建列表项
      const itemText = this.scene.add.text(-240, -80 + i * 32, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.1)', padding: { x: 6, y: 4 } }); // 创建列表文本
      itemText.setOrigin(0, 0); // 设置锚点
      this.add(itemText); // 添加到容器
      this.listTexts.push(itemText); // 保存引用
    } // 循环结束
    this.detailText = this.scene.add.text(40, -90, '', { fontFamily: 'sans-serif', fontSize: '14px', color: '#ffffff', wordWrap: { width: 200 }, lineSpacing: 4 }); // 创建详情文本
    this.detailText.setOrigin(0, 0); // 设置锚点
    this.add(this.detailText); // 添加到容器
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private createKeys(): void { // 创建按键引用
    const keyboard = this.scene.input.keyboard; // 读取键盘对象
    if (!keyboard) { // 如果键盘不可用
      return; // 直接返回
    } // 条件结束
    this.keys = keyboard.addKeys({ up: Phaser.Input.Keyboard.KeyCodes.UP, down: Phaser.Input.Keyboard.KeyCodes.DOWN, left: Phaser.Input.Keyboard.KeyCodes.LEFT, right: Phaser.Input.Keyboard.KeyCodes.RIGHT, enter: Phaser.Input.Keyboard.KeyCodes.ENTER, esc: Phaser.Input.Keyboard.KeyCodes.ESC, tab: Phaser.Input.Keyboard.KeyCodes.TAB }) as { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key; enter: Phaser.Input.Keyboard.Key; esc: Phaser.Input.Keyboard.Key; tab: Phaser.Input.Keyboard.Key }; // 创建按键集合
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public open(): void { // 打开UI
    if (this.isVisible) { // 如果已经打开
      return; // 不重复处理
    } // 条件结束
    this.isVisible = true; // 更新状态
    this.setVisible(true); // 显示容器
    this.mode = 'buy'; // 默认模式
    this.selectedIndex = 0; // 重置选中索引
    this.quantity = 1; // 重置数量
    this.refreshList(); // 刷新商品列表
    this.updateTexts(); // 更新界面文字
    this.registerHandlers(); // 注册输入处理
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public close(): void { // 关闭UI
    if (!this.isVisible) { // 如果已经关闭
      return; // 不处理
    } // 条件结束
    this.isVisible = false; // 更新状态
    this.setVisible(false); // 隐藏容器
    this.removeHandlers(); // 移除输入处理
  } // 方法结束
  // 分隔注释 // 保持行有注释
  public isOpen(): boolean { // 判断UI是否打开
    return this.isVisible; // 返回状态
  } // 方法结束
  public refreshData(): void { // 刷新界面数据
    this.refreshList(); // 更新列表
    this.updateTexts(); // 更新文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  // 分隔注释 // 保持行有注释
  private registerHandlers(): void { // 注册键盘事件
    if (!this.keys) { // 如果无键盘
      return; // 直接返回
    } // 条件结束
    const bind = (key: Phaser.Input.Keyboard.Key, handler: () => void): void => { // 定义绑定工具
      const wrapped = (): void => { // 包装函数
        handler(); // 执行处理器
      }; // 包装结束
      key.on('down', wrapped); // 绑定事件
      this.handlers.push({ key, handler: wrapped }); // 保存记录
    }; // 函数结束
    bind(this.keys.up, () => this.moveSelection(-1)); // 绑定上键
    bind(this.keys.down, () => this.moveSelection(1)); // 绑定下键
    bind(this.keys.left, () => this.changeQuantity(-1)); // 绑定左键
    bind(this.keys.right, () => this.changeQuantity(1)); // 绑定右键
    bind(this.keys.enter, () => this.confirmTransaction()); // 绑定确认键
    bind(this.keys.esc, () => this.close()); // 绑定关闭键
    if (this.shop.type === 'buySell') { // 如果支持买卖
      bind(this.keys.tab, () => this.toggleMode()); // 绑定Tab切换
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private removeHandlers(): void { // 移除键盘事件
    this.handlers.forEach(({ key, handler }) => { // 遍历处理器
      key.off('down', handler); // 移除监听
    }); // 遍历结束
    this.handlers = []; // 清空数组
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private refreshList(): void { // 刷新列表数据
    const inventory = this.shopService.getInventory(); // 获取背包
    const goldItem = inventory.getAll().find((item) => item.id === GOLD_ITEM_ID); // 查找金币
    const goldCount = goldItem?.count ?? 0; // 读取金币数量
    if (this.mode === 'buy') { // 如果是购买模式
      this.cachedList = this.shop.goods.map((goods) => { // 映射商品
        const unitPrice = this.shopService.getPrice(goods, this.shop.priceMultiplier); // 计算单价
        const stock = goods.stock ?? Number.POSITIVE_INFINITY; // 读取库存
        const maxAffordableRaw = unitPrice > 0 ? Math.floor(goldCount / unitPrice) : stock; // 计算可负担数量
        const limit = goods.stock !== undefined ? goods.stock : maxAffordableRaw; // 计算基础限制
        const finiteLimit = Number.isFinite(limit) ? limit : 99; // 确保限制为有限值
        const finiteAffordable = Number.isFinite(maxAffordableRaw) ? maxAffordableRaw : finiteLimit; // 确保负担数量有限
        const count = Math.max(0, Math.min(finiteLimit, finiteAffordable)); // 计算可购买数量
        return { goods, count, price: unitPrice }; // 返回结构
      }); // 映射结束
    } else { // 出售模式
      const bagItems = inventory.getAll(); // 获取背包物品
      this.cachedList = this.shop.goods.filter((goods) => goods.sellable !== false).map((goods) => { // 过滤可出售商品
        const item = bagItems.find((entry) => entry.id === goods.id); // 查找背包数量
        const owned = item?.count ?? 0; // 读取数量
        const unitPrice = Math.max(1, Math.floor(this.shopService.getPrice(goods, this.shop.priceMultiplier) * 0.5)); // 计算出售价
        return { goods, count: owned, price: unitPrice }; // 返回结构
      }).filter((entry) => entry.count > 0); // 过滤拥有数量
    } // 条件结束
    if (this.cachedList.length === 0) { // 如果没有商品
      this.selectedIndex = 0; // 重置索引
    } else { // 有商品时
      this.selectedIndex = Phaser.Math.Clamp(this.selectedIndex, 0, this.cachedList.length - 1); // 限制索引范围
    } // 条件结束
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private updateTexts(): void { // 更新界面文本
    this.headerText.setText(`${this.shop.name}`); // 更新标题
    const gold = this.shopService.getInventory().getAll().find((item) => item.id === GOLD_ITEM_ID)?.count ?? 0; // 获取金币数量
    this.goldText.setText(`金币：${gold}`); // 更新金币显示
    this.modeText.setText(`模式：${this.mode === 'buy' ? '购买' : '出售'}${this.shop.type === 'buySell' ? '（Tab切换）' : ''}`); // 更新模式提示
    for (let i = 0; i < this.listTexts.length; i += 1) { // 遍历文本列表
      const text = this.listTexts[i]; // 获取文本
      const entry = this.cachedList[i]; // 获取数据
      if (!entry) { // 如果没有数据
        text.setText(''); // 清空文本
        text.setStyle({ backgroundColor: 'rgba(255,255,255,0.05)' }); // 恢复背景
        continue; // 跳过
      } // 条件结束
      const selected = i === this.selectedIndex; // 判断是否选中
      const stockInfo = this.mode === 'buy' ? (entry.goods.stock !== undefined ? `库存:${entry.goods.stock}` : '库存:∞') : `持有:${entry.count}`; // 计算库存文字
      text.setText(`${selected ? '➤ ' : '  '}${entry.goods.name} ${stockInfo} 单价:${entry.price}`); // 设置文本
      text.setStyle({ backgroundColor: selected ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)' }); // 设置背景
    } // 循环结束
    const current = this.cachedList[this.selectedIndex]; // 获取当前选中项
    if (!current) { // 如果没有选项
      this.detailText.setText('暂无可交易商品'); // 显示提示
      return; // 结束
    } // 条件结束
    const maxCount = this.mode === 'buy' ? current.count : current.count; // 计算可操作数量
    this.quantity = Phaser.Math.Clamp(this.quantity, 1, Math.max(1, maxCount)); // 限制数量
    const totalPrice = current.price * this.quantity; // 计算总价
    const modeLabel = this.mode === 'buy' ? '购买' : '出售'; // 模式标签
    const detailLines = [ // 构建详情文本数组
      `名称：${current.goods.name}`, // 显示名称
      `类别：${current.goods.kind}`, // 显示类别
      `单价：${current.price}`, // 显示单价
      `数量：${this.quantity}（←→调整）`, // 显示数量
      `总价：${totalPrice}`, // 显示总价
      `操作：按Enter确认${modeLabel}，Esc返回`, // 显示操作提示
    ]; // 数组结束
    this.detailText.setText(detailLines.join('\n')); // 更新详情文本
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private moveSelection(delta: number): void { // 移动选中项
    if (this.cachedList.length === 0) { // 如果没有数据
      return; // 不处理
    } // 条件结束
    this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + delta, 0, this.cachedList.length); // 计算新索引
    this.quantity = 1; // 重置数量
    this.updateTexts(); // 更新显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private changeQuantity(delta: number): void { // 调整数量
    const current = this.cachedList[this.selectedIndex]; // 获取当前项
    if (!current) { // 如果没有项
      return; // 不处理
    } // 条件结束
    const maxCount = Math.max(1, current.count); // 计算最大数量
    this.quantity = Phaser.Math.Clamp(this.quantity + delta, 1, maxCount); // 调整数量
    this.updateTexts(); // 更新显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private confirmTransaction(): void { // 确认交易
    const current = this.cachedList[this.selectedIndex]; // 获取当前项
    if (!current || this.quantity <= 0) { // 如果无效
      return; // 不处理
    } // 条件结束
    if (this.mode === 'buy') { // 如果是购买
      const success = this.shopService.buy(this.shop.id, current.goods.id, this.quantity); // 调用购买
      if (!success) { // 如果失败
        this.scene.sound?.play('ui_denied'); // 播放失败音效占位
      } // 条件结束
    } else { // 出售模式
      const success = this.shopService.sell(this.shop.id, current.goods.id, this.quantity); // 调用出售
      if (!success) { // 如果失败
        this.scene.sound?.play('ui_denied'); // 播放失败音效
      } // 条件结束
    } // 条件结束
    this.refreshList(); // 交易完成后刷新列表
    this.updateTexts(); // 更新显示
  } // 方法结束
  // 分隔注释 // 保持行有注释
  private toggleMode(): void { // 切换买卖模式
    this.mode = this.mode === 'buy' ? 'sell' : 'buy'; // 切换模式
    this.selectedIndex = 0; // 重置索引
    this.quantity = 1; // 重置数量
    this.refreshList(); // 刷新列表
    this.updateTexts(); // 更新文本
  } // 方法结束
} // 类结束
