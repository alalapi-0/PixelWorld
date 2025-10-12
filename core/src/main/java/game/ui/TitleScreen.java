package game.ui; // 定义标题画面所在包

import com.badlogic.gdx.Gdx; // 引入 Gdx 用于输入
import com.badlogic.gdx.ScreenAdapter; // 引入屏幕适配器
import com.badlogic.gdx.scenes.scene2d.utils.ChangeListener; // 引入改变监听
import game.io.AssetIndex; // 引入资源索引
import game.save.SaveManager; // 引入存档管理器
import io.github.alalapi.pixelworld.GameMain; // 引入游戏主体

public class TitleScreen extends ScreenAdapter { // 定义标题画面类

    private final GameMain game; // 游戏主体引用
    private final AssetIndex assetIndex; // 资源索引
    private MainMenuUI ui; // 主菜单 UI
    private SaveManager.SaveGame cachedSave; // 缓存的最近存档

    public TitleScreen(GameMain game, AssetIndex assetIndex) { // 构造函数
        this.game = game; // 记录游戏引用
        this.assetIndex = assetIndex; // 记录资源索引
    } // 构造结束

    @Override
    public void show() { // 显示时回调
        if (ui == null) { // 若尚未创建 UI
            ui = new MainMenuUI(); // 创建 UI
            bindActions(); // 绑定按钮事件
        } // 条件结束
        refreshContinueState(); // 刷新继续按钮状态
        Gdx.input.setInputProcessor(ui.getStage()); // 将输入交给舞台
    } // show 方法结束

    private void bindActions() { // 绑定按钮事件的方法
        ui.addContinueListener(new ChangeListener() { // 为继续按钮添加监听
            @Override
            public void changed(ChangeEvent event, com.badlogic.gdx.scenes.scene2d.Actor actor) { // 处理点击
                if (cachedSave != null) { // 若存在存档
                    PlayerProfile profile = PlayerProfile.fromSave(cachedSave); // 从存档解析档案
                    game.startNewGame(profile); // 启动游戏
                } // 条件结束
            } // 方法结束
        }); // 监听结束
        ui.addCreateListener(new ChangeListener() { // 为创建按钮添加监听
            @Override
            public void changed(ChangeEvent event, com.badlogic.gdx.scenes.scene2d.Actor actor) { // 处理点击
                game.openCharacterCreator(); // 打开创角界面
            } // 方法结束
        }); // 监听结束
    } // 方法结束

    private void refreshContinueState() { // 刷新继续按钮状态
        cachedSave = SaveManager.tryLoadMostRecent().orElse(null); // 尝试读取存档
        boolean hasSave = cachedSave != null; // 判断是否存在
        ui.getContinueButton().setDisabled(!hasSave); // 根据存档启用或禁用
        if (hasSave) { // 如果有存档
            ui.getStatusLabel().setText("检测到存档：" + cachedSave.slotName); // 显示存档信息
        } else { // 否则
            ui.getStatusLabel().setText("未发现可继续的存档"); // 显示提示
        } // 条件结束
    } // 方法结束

    @Override
    public void render(float delta) { // 渲染方法
        if (ui != null) { // 若 UI 存在
            ui.getStage().act(delta); // 推进舞台逻辑
            ui.getStage().draw(); // 绘制舞台
        } // 条件结束
    } // render 方法结束

    @Override
    public void resize(int width, int height) { // 窗口尺寸变化
        if (ui != null) { // 若 UI 存在
            ui.getStage().getViewport().update(width, height, true); // 更新视口
        } // 条件结束
    } // resize 方法结束

    @Override
    public void hide() { // 隐藏时回调
        if (ui != null) { // 若 UI 存在
            ui.getStage().unfocusAll(); // 清除焦点
            if (Gdx.input.getInputProcessor() == ui.getStage()) { // 如果当前输入处理为该舞台
                Gdx.input.setInputProcessor(null); // 清空输入处理器
            } // 条件结束
        } // 条件结束
    } // hide 方法结束

    @Override
    public void dispose() { // 释放资源
        if (ui != null) { // 若 UI 存在
            ui.dispose(); // 释放 UI
        } // 条件结束
    } // dispose 方法结束
}
