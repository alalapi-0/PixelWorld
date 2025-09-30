package io.github.alalapi.pixelworld.lwjgl3;

import com.badlogic.gdx.backends.lwjgl3.Lwjgl3Application;
import com.badlogic.gdx.backends.lwjgl3.Lwjgl3ApplicationConfiguration;
import io.github.alalapi.pixelworld.GameMain;

/** Desktop launcher for the LWJGL3 backend. */
public class Lwjgl3Launcher {

    private Lwjgl3Launcher() {
    }

    public static void main(String[] args) {
        createApplication();
    }

    private static void createApplication() {
        Lwjgl3ApplicationConfiguration configuration = new Lwjgl3ApplicationConfiguration();
        configuration.setTitle("PixelWorld");
        configuration.useVsync(true);
        configuration.setForegroundFPS(60);
        configuration.setWindowedMode(1280, 720);
        new Lwjgl3Application(new GameMain(), configuration);
    }
}
