package io.github.alalapi.pixelworld;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.Input;
import com.badlogic.gdx.ScreenAdapter;
import com.badlogic.gdx.graphics.Color;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.ScreenUtils;
import io.github.alalapi.pixelworld.hud.HudOverlay;
import io.github.alalapi.pixelworld.simulation.WorldClock;
import io.github.alalapi.pixelworld.simulation.WeatherSystem;

/**
 * Main in-game screen that advances the simulation and renders a debug HUD.
 */
public class WorldScreen extends ScreenAdapter {

    private static final Color BACKGROUND = new Color();

    private final SpriteBatch batch;
    private final WorldClock worldClock;
    private final WeatherSystem weatherSystem;
    private final HudOverlay hudOverlay;

    private boolean hudVisible = true;

    public WorldScreen() {
        this.batch = new SpriteBatch();
        this.worldClock = new WorldClock();
        this.weatherSystem = new WeatherSystem();
        this.hudOverlay = new HudOverlay();
    }

    @Override
    public void render(float delta) {
        handleInput();

        worldClock.update(delta);
        weatherSystem.update(worldClock, delta);
        updateBackgroundColor(weatherSystem.getCurrentWeatherId());

        ScreenUtils.clear(BACKGROUND, true);

        batch.begin();
        if (hudVisible) {
            hudOverlay.render(batch, worldClock, weatherSystem);
        }
        batch.end();
    }

    private void handleInput() {
        if (Gdx.input.isKeyJustPressed(Input.Keys.F1)) {
            hudVisible = !hudVisible;
        }
        if (Gdx.input.isKeyJustPressed(Input.Keys.F5)) {
            worldClock.toggleFastForward();
        }
        if (Gdx.input.isKeyJustPressed(Input.Keys.F6)) {
            weatherSystem.cycleMode();
        }
    }

    private void updateBackgroundColor(String weatherId) {
        if ("rain".equals(weatherId)) {
            BACKGROUND.set(0.15f, 0.2f, 0.3f, 1f);
        } else if ("snow".equals(weatherId)) {
            BACKGROUND.set(0.8f, 0.85f, 0.9f, 1f);
        } else {
            BACKGROUND.set(0.4f, 0.65f, 0.9f, 1f);
        }
    }

    @Override
    public void resize(int width, int height) {
        // No-op for now; keeping the interface ready for future cameras or viewports.
    }

    @Override
    public void dispose() {
        batch.dispose();
        hudOverlay.dispose();
    }
}
