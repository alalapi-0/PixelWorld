package io.github.alalapi.pixelworld;

import com.badlogic.gdx.Game;
import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.GL20;

/**
 * Minimal {@link Game} bootstrap that wires the {@link WorldScreen}.
 */
public class GameMain extends Game {

    private WorldScreen worldScreen;

    @Override
    public void create() {
        worldScreen = new WorldScreen();
        setScreen(worldScreen);
    }

    @Override
    public void render() {
        // Clear in case the active screen does not.
        Gdx.gl.glClearColor(0f, 0f, 0f, 1f);
        Gdx.gl.glClear(GL20.GL_COLOR_BUFFER_BIT);
        super.render();
    }

    @Override
    public void dispose() {
        if (worldScreen != null) {
            worldScreen.dispose();
        }
    }
}
