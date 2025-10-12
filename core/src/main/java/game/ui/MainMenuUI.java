package game.ui; // 定义主菜单 UI 所在包

import com.badlogic.gdx.graphics.Color; // 引入颜色类
import com.badlogic.gdx.graphics.Pixmap; // 引入像素图
import com.badlogic.gdx.graphics.Texture; // 引入纹理
import com.badlogic.gdx.graphics.g2d.BitmapFont; // 引入字体
import com.badlogic.gdx.scenes.scene2d.Stage; // 引入舞台
import com.badlogic.gdx.scenes.scene2d.ui.Label; // 引入标签
import com.badlogic.gdx.scenes.scene2d.ui.Skin; // 引入皮肤
import com.badlogic.gdx.scenes.scene2d.ui.Table; // 引入布局
import com.badlogic.gdx.scenes.scene2d.ui.TextButton; // 引入按钮
import com.badlogic.gdx.scenes.scene2d.utils.ChangeListener; // 引入监听器基类
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable; // 引入绘制器
import com.badlogic.gdx.utils.Disposable; // 引入可释放接口
import com.badlogic.gdx.utils.viewport.ScreenViewport; // 引入屏幕视口

public final class MainMenuUI implements Disposable { // 定义主菜单 UI 封装类

    private final Stage stage; // 舞台实例
    private final Skin skin; // 皮肤实例
    private final BitmapFont font; // 字体实例
    private final Texture buttonTexture; // 按钮纹理
    private final Texture buttonDownTexture; // 按钮按下纹理
    private final TextButton continueButton; // 继续按钮
    private final TextButton createButton; // 创建按钮
    private final Label statusLabel; // 状态文本

    public MainMenuUI() { // 构造函数
        this.stage = new Stage(new ScreenViewport()); // 创建舞台
        this.font = new BitmapFont(); // 创建默认字体
        this.skin = new Skin(); // 创建皮肤
        this.buttonTexture = buildTexture(new Color(0.15f, 0.2f, 0.3f, 1f)); // 创建按钮底纹
        this.buttonDownTexture = buildTexture(new Color(0.1f, 0.15f, 0.25f, 1f)); // 创建按钮按下底纹
        skin.add("default-font", font); // 将字体加入皮肤
        TextButton.TextButtonStyle style = new TextButton.TextButtonStyle(); // 创建按钮样式
        style.font = font; // 设置字体
        style.up = new TextureRegionDrawable(buttonTexture); // 设置常态纹理
        style.down = new TextureRegionDrawable(buttonDownTexture); // 设置按下纹理
        style.disabled = new TextureRegionDrawable(buttonTexture); // 禁用态沿用
        skin.add("default", style); // 注册默认样式
        Label.LabelStyle labelStyle = new Label.LabelStyle(font, Color.WHITE); // 创建标签样式
        skin.add("default", labelStyle, Label.LabelStyle.class); // 注册标签样式
        Table root = new Table(); // 创建根表格
        root.setFillParent(true); // 填满父容器
        root.defaults().pad(12f).width(260f).height(48f); // 设置默认间距和尺寸
        Label title = new Label("PixelWorld", skin); // 创建标题文本
        root.add(title).padBottom(24f); // 添加标题
        root.row(); // 换行
        continueButton = new TextButton("继续游戏", skin); // 创建继续按钮
        root.add(continueButton); // 加入布局
        root.row(); // 换行
        createButton = new TextButton("创建角色", skin); // 创建创角按钮
        root.add(createButton); // 加入布局
        root.row(); // 换行
        statusLabel = new Label("", skin); // 创建状态文本
        root.add(statusLabel); // 添加状态文本
        stage.addActor(root); // 将布局加入舞台
    } // 构造结束

    private Texture buildTexture(Color color) { // 构建纯色纹理
        Pixmap pixmap = new Pixmap(1, 1, Pixmap.Format.RGBA8888); // 创建像素图
        pixmap.setColor(color); // 设置颜色
        pixmap.fill(); // 填充颜色
        Texture texture = new Texture(pixmap); // 生成纹理
        pixmap.dispose(); // 释放像素图
        return texture; // 返回纹理
    } // 方法结束

    public Stage getStage() { // 获取舞台
        return stage; // 返回舞台
    } // 方法结束

    public TextButton getContinueButton() { // 获取继续按钮
        return continueButton; // 返回按钮
    } // 方法结束

    public TextButton getCreateButton() { // 获取创建按钮
        return createButton; // 返回按钮
    } // 方法结束

    public Label getStatusLabel() { // 获取状态文本
        return statusLabel; // 返回标签
    } // 方法结束

    public void addContinueListener(ChangeListener listener) { // 注册继续按钮监听
        continueButton.addListener(listener); // 添加监听
    } // 方法结束

    public void addCreateListener(ChangeListener listener) { // 注册创角按钮监听
        createButton.addListener(listener); // 添加监听
    } // 方法结束

    @Override
    public void dispose() { // 释放资源
        stage.dispose(); // 释放舞台
        skin.dispose(); // 释放皮肤
        font.dispose(); // 释放字体
        buttonTexture.dispose(); // 释放纹理
        buttonDownTexture.dispose(); // 释放按下纹理
    } // 方法结束
}
