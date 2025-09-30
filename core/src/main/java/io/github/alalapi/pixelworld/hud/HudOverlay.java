package io.github.alalapi.pixelworld.hud;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.graphics.g2d.BitmapFont;
import com.badlogic.gdx.graphics.g2d.SpriteBatch;
import com.badlogic.gdx.utils.Disposable;
import io.github.alalapi.pixelworld.simulation.WorldClock;
import io.github.alalapi.pixelworld.simulation.WeatherSystem;

/**
 * Simple debug HUD that renders the current simulation state.
 */
public class HudOverlay implements Disposable {

    private final BitmapFont font;
    private final float lineHeight;

    public HudOverlay() {
        this.font = new BitmapFont();
        this.lineHeight = font.getLineHeight();
    }

    public void render(SpriteBatch batch, WorldClock worldClock, WeatherSystem weatherSystem) {
        float x = 10f;
        float y = Gdx.graphics.getHeight() - 10f;

        font.draw(batch, "FPS: " + Gdx.graphics.getFramesPerSecond(), x, y);
        y -= lineHeight;

        font.draw(batch, "Day " + worldClock.getDay() + " (" + worldClock.getSeasonDisplayName() + ")", x, y);
        y -= lineHeight;

        String timeLabel = "Time: " + worldClock.getFormattedTime();
        if (worldClock.isFastForward()) {
            timeLabel += " (fast)";
        }
        font.draw(batch, timeLabel, x, y);
        y -= lineHeight;

        font.draw(batch, "Weather: " + weatherSystem.getCurrentWeatherName() + " [" + weatherSystem.getModeLabel() + "]", x, y);
    }

    @Override
    public void dispose() {
        font.dispose();
    }
}
