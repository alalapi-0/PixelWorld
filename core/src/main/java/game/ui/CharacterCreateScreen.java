package game.ui; // 定义创角界面所在包

import com.badlogic.gdx.Gdx; // 引入 Gdx 用于输入
import com.badlogic.gdx.ScreenAdapter; // 引入屏幕基类
import com.badlogic.gdx.graphics.Color; // 引入颜色
import com.badlogic.gdx.graphics.Pixmap; // 引入像素图
import com.badlogic.gdx.graphics.Texture; // 引入纹理
import com.badlogic.gdx.scenes.scene2d.Stage; // 引入舞台
import com.badlogic.gdx.scenes.scene2d.ui.ButtonGroup; // 引入按钮组
import com.badlogic.gdx.scenes.scene2d.ui.Label; // 引入标签
import com.badlogic.gdx.scenes.scene2d.ui.List; // 引入列表
import com.badlogic.gdx.scenes.scene2d.ui.ScrollPane; // 引入滚动面板
import com.badlogic.gdx.scenes.scene2d.ui.Skin; // 引入皮肤
import com.badlogic.gdx.scenes.scene2d.ui.Table; // 引入表格
import com.badlogic.gdx.scenes.scene2d.ui.TextButton; // 引入按钮
import com.badlogic.gdx.scenes.scene2d.ui.TextField; // 引入文本框
import com.badlogic.gdx.scenes.scene2d.utils.ChangeListener; // 引入改变监听
import com.badlogic.gdx.scenes.scene2d.utils.TextureRegionDrawable; // 引入绘制器
import com.badlogic.gdx.utils.Array; // 引入数组
import com.badlogic.gdx.utils.viewport.ScreenViewport; // 引入视口
import game.io.AssetIndex; // 引入资源索引
import io.github.alalapi.pixelworld.GameMain; // 引入游戏主体
import java.nio.file.Path; // 引入路径
import java.util.LinkedHashMap; // 引入有序映射
import java.util.Locale; // 引入地区工具
import java.util.Map; // 引入映射

public final class CharacterCreateScreen extends ScreenAdapter { // 定义创角界面类

    private final GameMain game; // 游戏主体引用
    private final AssetIndex assetIndex; // 资源索引
    private Stage stage; // 舞台
    private Skin skin; // 皮肤
    private Texture buttonTexture; // 按钮纹理
    private Texture buttonDownTexture; // 按钮按下纹理
    private Texture listSelectionTexture; // 列表选中纹理
    private Texture textFieldTexture; // 文本框背景纹理
    private Array<Texture> generatedTextures; // 生成的纹理集合
    private TextField nicknameField; // 昵称输入框
    private ButtonGroup<TextButton> genderGroup; // 性别按钮组
    private List<String> avatarList; // 头像列表
    private List<String> walkList; // 行走像列表
    private Array<Path> avatarPaths; // 头像路径数组
    private Array<Path> walkPaths; // 行走像路径数组
    private TextButton startButton; // 开始按钮

    public CharacterCreateScreen(GameMain game, AssetIndex assetIndex) { // 构造函数
        this.game = game; // 记录游戏引用
        this.assetIndex = assetIndex; // 记录资源索引
    } // 构造结束

    @Override
    public void show() { // 显示时回调
        if (stage == null) { // 若尚未初始化
            initializeUi(); // 创建界面
        } // 条件结束
        Gdx.input.setInputProcessor(stage); // 将输入交给舞台
    } // show 方法结束

    private void initializeUi() { // 初始化界面
        stage = new Stage(new ScreenViewport()); // 创建舞台
        skin = new Skin(); // 创建皮肤
        generatedTextures = new Array<>(); // 初始化纹理集合
        buttonTexture = buildTexture(new Color(0.2f, 0.25f, 0.35f, 1f)); // 按钮常态纹理
        buttonDownTexture = buildTexture(new Color(0.15f, 0.2f, 0.3f, 1f)); // 按钮按下纹理
        listSelectionTexture = buildTexture(new Color(0.4f, 0.5f, 0.65f, 1f)); // 列表选中纹理
        textFieldTexture = buildTexture(new Color(0.1f, 0.1f, 0.1f, 0.6f)); // 文本框背景
        com.badlogic.gdx.graphics.g2d.BitmapFont font = new com.badlogic.gdx.graphics.g2d.BitmapFont(); // 创建字体
        skin.add("default-font", font); // 注册字体
        TextButton.TextButtonStyle buttonStyle = new TextButton.TextButtonStyle(); // 创建按钮样式
        buttonStyle.font = font; // 设置字体
        buttonStyle.up = new TextureRegionDrawable(buttonTexture); // 常态纹理
        buttonStyle.down = new TextureRegionDrawable(buttonDownTexture); // 按下纹理
        buttonStyle.checked = new TextureRegionDrawable(buttonDownTexture); // 选中纹理
        buttonStyle.disabled = new TextureRegionDrawable(buttonTexture); // 禁用纹理
        skin.add("default", buttonStyle); // 注册按钮样式
        Label.LabelStyle labelStyle = new Label.LabelStyle(font, Color.WHITE); // 标签样式
        skin.add("default", labelStyle, Label.LabelStyle.class); // 注册标签样式
        TextField.TextFieldStyle textFieldStyle = new TextField.TextFieldStyle(); // 文本框样式
        textFieldStyle.font = font; // 设置字体
        textFieldStyle.fontColor = Color.WHITE; // 字体颜色
        textFieldStyle.background = new TextureRegionDrawable(textFieldTexture); // 背景
        textFieldStyle.cursor = new TextureRegionDrawable(buildTexture(new Color(0.9f, 0.9f, 0.9f, 1f))); // 光标纹理
        textFieldStyle.selection = new TextureRegionDrawable(buildTexture(new Color(0.3f, 0.4f, 0.6f, 0.8f))); // 选择区域
        skin.add("default", textFieldStyle, TextField.TextFieldStyle.class); // 注册文本框样式
        List.ListStyle listStyle = new List.ListStyle(); // 列表样式
        listStyle.font = font; // 设置字体
        listStyle.fontColorSelected = Color.WHITE; // 选中文本颜色
        listStyle.fontColorUnselected = new Color(0.8f, 0.8f, 0.8f, 1f); // 未选中文本颜色
        listStyle.selection = new TextureRegionDrawable(listSelectionTexture); // 选中背景
        listStyle.background = new TextureRegionDrawable(buildTexture(new Color(0.05f, 0.05f, 0.05f, 0.6f))); // 背景纹理
        skin.add("default", listStyle, List.ListStyle.class); // 注册列表样式
        ScrollPane.ScrollPaneStyle scrollStyle = new ScrollPane.ScrollPaneStyle(); // 滚动面板样式
        scrollStyle.background = new TextureRegionDrawable(buildTexture(new Color(0.02f, 0.02f, 0.02f, 0.6f))); // 背景
        skin.add("default", scrollStyle, ScrollPane.ScrollPaneStyle.class); // 注册滚动样式
        Table root = new Table(); // 创建根布局
        root.setFillParent(true); // 填满父容器
        root.pad(24f); // 设置边距
        root.defaults().pad(8f); // 设置默认间距
        Label title = new Label("创建角色", skin); // 标题文本
        root.add(title).colspan(2); // 添加标题并跨列
        root.row(); // 换行
        Label genderLabel = new Label("性别", skin); // 性别标签
        root.add(genderLabel); // 添加标签
        Table genderTable = new Table(); // 性别选择表格
        TextButton male = new TextButton("男", skin, "default"); // 男性按钮
        TextButton female = new TextButton("女", skin, "default"); // 女性按钮
        TextButton other = new TextButton("其他", skin, "default"); // 其他按钮
        genderGroup = new ButtonGroup<>(male, female, other); // 创建按钮组
        genderGroup.setMaxCheckCount(1); // 最多一个选中
        genderGroup.setMinCheckCount(1); // 至少一个选中
        male.setChecked(true); // 默认选择男性
        genderTable.add(male).padRight(6f); // 添加男性按钮
        genderTable.add(female).padRight(6f); // 添加女性按钮
        genderTable.add(other); // 添加其他按钮
        root.add(genderTable); // 将性别表格加入布局
        root.row(); // 换行
        Label nicknameLabel = new Label("昵称", skin); // 昵称标签
        root.add(nicknameLabel); // 添加标签
        nicknameField = new TextField("", skin); // 创建文本输入
        nicknameField.setMessageText("请输入昵称"); // 设置提示
        root.add(nicknameField).width(260f); // 添加输入框
        root.row(); // 换行
        Label avatarLabel = new Label("头像候选", skin); // 头像标签
        root.add(avatarLabel); // 添加标签
        avatarList = new List<>(skin); // 创建头像列表
        ScrollPane avatarScroll = new ScrollPane(avatarList, skin); // 包裹滚动面板
        avatarScroll.setFadeScrollBars(false); // 关闭渐隐滚动条
        root.add(avatarScroll).width(300f).height(160f); // 添加到布局
        root.row(); // 换行
        Label walkLabel = new Label("行走像候选", skin); // 行走像标签
        root.add(walkLabel); // 添加标签
        walkList = new List<>(skin); // 创建行走像列表
        ScrollPane walkScroll = new ScrollPane(walkList, skin); // 创建滚动面板
        walkScroll.setFadeScrollBars(false); // 关闭渐隐滚动条
        root.add(walkScroll).width(300f).height(160f); // 添加到布局
        root.row(); // 换行
        startButton = new TextButton("开始游戏", skin); // 创建开始按钮
        startButton.setDisabled(true); // 默认禁用
        root.add(startButton).colspan(2).padTop(12f); // 添加按钮
        stage.addActor(root); // 将布局加入舞台
        populateLists(); // 填充列表
        bindEvents(); // 绑定事件
    } // 方法结束

    private Texture buildTexture(Color color) { // 构造纯色纹理
        Pixmap pixmap = new Pixmap(1, 1, Pixmap.Format.RGBA8888); // 创建像素图
        pixmap.setColor(color); // 设置颜色
        pixmap.fill(); // 填充颜色
        Texture texture = new Texture(pixmap); // 创建纹理
        pixmap.dispose(); // 释放像素图
        if (generatedTextures != null) { // 如果纹理集合已初始化
            generatedTextures.add(texture); // 记录纹理以便释放
        } // 条件结束
        return texture; // 返回纹理
    } // 方法结束

    private void populateLists() { // 填充头像与行走像列表
        avatarPaths = new Array<>(); // 初始化头像路径数组
        walkPaths = new Array<>(); // 初始化行走像路径数组
        Array<String> display = new Array<>(); // 展示文本数组
        Map<Path, AssetIndex.ImageInfo> metadata = assetIndex.getMetadata(); // 获取元数据
        LinkedHashMap<String, Path> uniqueByName = new LinkedHashMap<>(); // 创建按名去重映射
        for (Path path : assetIndex.characters) { // 遍历角色资源
            String key = path.getFileName().toString().toLowerCase(Locale.ROOT); // 使用文件名去重
            uniqueByName.putIfAbsent(key, path); // 首次出现时记录
        } // 遍历结束
        for (Path path : uniqueByName.values()) { // 遍历去重结果
            AssetIndex.ImageInfo info = metadata.get(path); // 获取元数据
            String label = buildLabel(path, info); // 构建显示文本
            avatarPaths.add(path); // 加入头像路径
            walkPaths.add(path); // 加入行走像路径
            display.add(label); // 记录显示文本
        } // 遍历结束
        avatarList.setItems(display); // 设置头像列表条目
        walkList.setItems(display); // 设置行走像列表条目
        if (display.size > 0) { // 如果存在候选
            avatarList.setSelectedIndex(0); // 默认选中第一个头像
            walkList.setSelectedIndex(0); // 默认选中第一个行走像
        } // 条件结束
    } // 方法结束

    private String buildLabel(Path path, AssetIndex.ImageInfo info) { // 构建列表标签
        StringBuilder builder = new StringBuilder(); // 创建字符串构造器
        builder.append(path.getFileName().toString()); // 添加文件名
        if (info != null) { // 如果有元数据
            builder.append(" ("); // 添加括号
            builder.append(info.width).append("x").append(info.height); // 添加尺寸
            if (info.notes != null && !info.notes.isEmpty()) { // 如果有备注
                builder.append(", ").append(info.notes); // 添加备注
            } // 条件结束
            builder.append(")"); // 关闭括号
        } // 条件结束
        return builder.toString(); // 返回字符串
    } // 方法结束

    private void bindEvents() { // 绑定交互事件
        nicknameField.addListener(new ChangeListener() { // 为昵称框添加监听
            @Override
            public void changed(ChangeEvent event, com.badlogic.gdx.scenes.scene2d.Actor actor) { // 文本变化回调
                evaluateStartState(); // 重新评估按钮状态
            } // 方法结束
        }); // 监听结束
        walkList.addListener(new ChangeListener() { // 为行走像列表添加监听
            @Override
            public void changed(ChangeEvent event, com.badlogic.gdx.scenes.scene2d.Actor actor) { // 选择变化
                evaluateStartState(); // 更新按钮状态
            } // 方法结束
        }); // 监听结束
        startButton.addListener(new ChangeListener() { // 为开始按钮添加监听
            @Override
            public void changed(ChangeEvent event, com.badlogic.gdx.scenes.scene2d.Actor actor) { // 点击事件
                if (!startButton.isDisabled()) { // 确认可用
                    Path avatar = getSelectedPath(avatarList, avatarPaths); // 读取头像路径
                    Path walk = getSelectedPath(walkList, walkPaths); // 读取行走像路径
                    if (walk == null) { // 如果没有行走像
                        return; // 直接返回
                    } // 条件结束
                    if (avatar == null) { // 如未选头像
                        avatar = walk; // 默认使用行走像
                    } // 条件结束
                    String gender = genderGroup.getChecked().getText().toString(); // 获取性别文本
                    String nickname = nicknameField.getText(); // 获取昵称
                    PlayerProfile profile = new PlayerProfile(gender, nickname, avatar, walk); // 创建档案
                    game.startNewGame(profile); // 进入游戏
                } // 条件结束
            } // 方法结束
        }); // 监听结束
    } // 方法结束

    private void evaluateStartState() { // 评估开始按钮状态
        String nickname = nicknameField.getText(); // 获取昵称
        boolean hasNickname = nickname != null && !nickname.trim().isEmpty(); // 判断是否有效
        boolean hasWalk = walkList.getSelectedIndex() >= 0; // 判断是否选择行走像
        startButton.setDisabled(!(hasNickname && hasWalk)); // 根据条件启用
    } // 方法结束

    private Path getSelectedPath(List<String> listWidget, Array<Path> pathArray) { // 根据列表读取路径
        int index = listWidget.getSelectedIndex(); // 获取选中索引
        if (index < 0 || index >= pathArray.size) { // 检查有效性
            return null; // 返回空
        } // 条件结束
        return pathArray.get(index); // 返回路径
    } // 方法结束

    @Override
    public void render(float delta) { // 渲染方法
        if (stage != null) { // 若舞台存在
            stage.act(delta); // 更新
            stage.draw(); // 绘制
        } // 条件结束
    } // render 方法结束

    @Override
    public void resize(int width, int height) { // 窗口大小变化
        if (stage != null) { // 若舞台存在
            stage.getViewport().update(width, height, true); // 更新视口
        } // 条件结束
    } // resize 方法结束

    @Override
    public void hide() { // 隐藏时回调
        if (stage != null) { // 若舞台存在
            stage.unfocusAll(); // 清除焦点
            if (Gdx.input.getInputProcessor() == stage) { // 如果当前输入处理器为该舞台
                Gdx.input.setInputProcessor(null); // 清空输入处理器
            } // 条件结束
        } // 条件结束
    } // hide 方法结束

    @Override
    public void dispose() { // 释放资源
        if (stage != null) { // 若舞台存在
            stage.dispose(); // 释放舞台
        } // 条件结束
        if (skin != null) { // 若皮肤存在
            skin.dispose(); // 释放皮肤
        } // 条件结束
        if (generatedTextures != null) { // 若存在纹理集合
            for (Texture texture : generatedTextures) { // 遍历纹理
                texture.dispose(); // 逐个释放
            } // 遍历结束
            generatedTextures.clear(); // 清空集合
        } // 条件结束
    } // dispose 方法结束
}
