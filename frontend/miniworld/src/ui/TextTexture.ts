import Phaser from 'phaser'; // 引入Phaser框架
// 分隔注释 // 保持行有注释
export interface SimpleTextStyle { fontSize?: number; color?: string; padding?: number; maxWidth?: number; align?: 'left' | 'center' | 'right'; } // 定义简单样式接口
// 分隔注释 // 保持行有注释
function createMeasurer(scene: Phaser.Scene, fontSize: number, color: string, align: 'left' | 'center' | 'right'): Phaser.GameObjects.Text { // 创建测量文本对象
  const text = scene.add.text(0, 0, '', { fontFamily: 'sans-serif', fontSize: `${fontSize}px`, color, align }); // 生成文本对象
  text.setVisible(false); // 隐藏测量对象
  text.setDepth(2000); // 提升深度避免干扰
  return text; // 返回文本对象
} // 函数结束
// 分隔注释 // 保持行有注释
function buildLines(measurer: Phaser.GameObjects.Text, content: string, maxWidth: number | undefined): string[] { // 构建自动换行数组
  const lines: string[] = []; // 初始化结果数组
  const limit = maxWidth ?? Number.MAX_SAFE_INTEGER; // 计算宽度上限
  const paragraphs = content.split('\n'); // 按换行符拆分段落
  paragraphs.forEach((paragraph) => { // 遍历段落
    if (paragraph.length === 0) { // 如果段落为空
      lines.push(''); // 直接加入空行
      return; // 跳过后续处理
    } // 条件结束
    let current = ''; // 当前行内容
    Array.from(paragraph).forEach((char) => { // 遍历字符
      const candidate = current + char; // 组合新的候选
      measurer.setText(candidate); // 设置测量文本
      const width = measurer.width; // 读取宽度
      if (width > limit && current !== '') { // 如果超出限制且已有内容
        lines.push(current); // 推入当前行
        current = char; // 以当前字符开启新行
      } else { // 否则
        current = candidate; // 保持扩展
      } // 条件结束
    }); // 字符遍历结束
    lines.push(current); // 推入最后一行
  }); // 段落遍历结束
  return lines; // 返回结果
} // 函数结束
// 分隔注释 // 保持行有注释
export function renderTextToTexture(scene: Phaser.Scene, text: string, style: SimpleTextStyle = {}, keyHint?: string): string { // 将文本渲染到纹理
  const fontSize = style.fontSize ?? 16; // 解析字号
  const color = style.color ?? '#ffffff'; // 解析颜色
  const padding = style.padding ?? 4; // 解析内边距
  const align = style.align ?? 'left'; // 解析对齐
  const measurer = createMeasurer(scene, fontSize, color, align); // 创建测量文本
  const lines = buildLines(measurer, text, style.maxWidth); // 生成换行数组
  measurer.setText(lines.join('\n') || ' '); // 设置测量对象文本
  const measuredWidth = Math.max(1, Math.ceil(measurer.width)); // 计算宽度
  const measuredHeight = Math.max(1, Math.ceil(measurer.height)); // 计算高度
  const textureWidth = measuredWidth + padding * 2; // 计算纹理宽度
  const textureHeight = measuredHeight + padding * 2; // 计算纹理高度
  const baseKey = keyHint ?? 'texttex'; // 计算键名前缀
  let textureKey = `${baseKey}_${Phaser.Utils.String.UUID()}`; // 生成初始键名
  while (scene.textures.exists(textureKey)) { // 如果键名冲突
    textureKey = `${baseKey}_${Phaser.Utils.String.UUID()}`; // 重新生成
  } // 循环结束
  const renderTexture = scene.make.renderTexture({ width: textureWidth, height: textureHeight, add: false }); // 创建渲染纹理
  const textObject = scene.add.text(0, 0, lines.join('\n'), { fontFamily: 'sans-serif', fontSize: `${fontSize}px`, color, align, wordWrap: { width: style.maxWidth ?? undefined, useAdvancedWrap: false } }); // 创建真实文本对象
  if (align === 'center') { // 如果居中
    textObject.setOrigin(0.5, 0); // 设置锚点
    textObject.setPosition(textureWidth / 2, padding); // 放置位置
  } else if (align === 'right') { // 如果右对齐
    textObject.setOrigin(1, 0); // 设置锚点
    textObject.setPosition(textureWidth - padding, padding); // 放置位置
  } else { // 否则左对齐
    textObject.setOrigin(0, 0); // 设置锚点
    textObject.setPosition(padding, padding); // 放置位置
  } // 条件结束
  renderTexture.draw(textObject); // 将文本绘制到纹理
  renderTexture.saveTexture(textureKey); // 保存纹理到管理器
  textObject.destroy(); // 销毁文本对象
  renderTexture.destroy(); // 销毁渲染纹理
  measurer.destroy(); // 销毁测量对象
  return textureKey; // 返回纹理键名
} // 函数结束
