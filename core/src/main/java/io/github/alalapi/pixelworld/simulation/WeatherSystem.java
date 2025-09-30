package io.github.alalapi.pixelworld.simulation;

import com.badlogic.gdx.Gdx;
import com.badlogic.gdx.files.FileHandle;
import com.badlogic.gdx.math.MathUtils;
import com.badlogic.gdx.utils.Array;
import com.badlogic.gdx.utils.ObjectMap;
import com.badlogic.gdx.utils.JsonReader;
import com.badlogic.gdx.utils.JsonValue;

/**
 * Weather selection that supports automatic and manual override modes.
 */
public class WeatherSystem {

    private static final String CONFIG_PATH = "data/weather.json";

    private final Array<WeatherDefinition> definitions = new Array<>();
    private final ObjectMap<WorldClock.Season, ObjectMap<String, Float>> seasonalWeights = new ObjectMap<>();

    private WeatherDefinition currentDefinition;
    private float secondsSinceChange = 0f;
    private float secondsBetweenChanges = 45f;
    private int modeIndex = 0; // 0 = auto, >0 = forced definition index + 1

    public WeatherSystem() {
        loadConfiguration();
        if (definitions.isEmpty()) {
            applyDefaults();
        }
        if (currentDefinition == null && definitions.size > 0) {
            currentDefinition = definitions.first();
        }
    }

    public void update(WorldClock clock, float deltaSeconds) {
        if (definitions.isEmpty()) {
            return;
        }
        if (modeIndex > 0) {
            // Forced mode - keep selected definition.
            return;
        }

        float scaled = deltaSeconds * clock.getSpeedMultiplier();
        secondsSinceChange += scaled;
        if (secondsSinceChange >= secondsBetweenChanges) {
            secondsSinceChange = 0f;
            currentDefinition = chooseNext(clock.getSeason());
        }
    }

    public void cycleMode() {
        if (definitions.isEmpty()) {
            return;
        }
        modeIndex = (modeIndex + 1) % (definitions.size + 1);
        if (modeIndex == 0) {
            secondsSinceChange = secondsBetweenChanges; // force refresh soon.
        } else {
            currentDefinition = definitions.get(modeIndex - 1);
        }
    }

    public String getCurrentWeatherId() {
        return currentDefinition != null ? currentDefinition.id : "unknown";
    }

    public String getCurrentWeatherName() {
        return currentDefinition != null ? currentDefinition.displayName : "Unknown";
    }

    public String getModeLabel() {
        if (modeIndex == 0) {
            return "Auto";
        }
        WeatherDefinition forced = definitions.get(modeIndex - 1);
        return "Forced: " + forced.displayName;
    }

    private WeatherDefinition chooseNext(WorldClock.Season season) {
        ObjectMap<String, Float> weights = seasonalWeights.get(season);
        if (weights == null || weights.size == 0) {
            return definitions.first();
        }

        float totalWeight = 0f;
        for (WeatherDefinition definition : definitions) {
            totalWeight += weights.get(definition.id, 0f);
        }
        if (totalWeight <= 0f) {
            return definitions.first();
        }

        float target = MathUtils.random() * totalWeight;
        float cumulative = 0f;
        for (WeatherDefinition definition : definitions) {
            cumulative += weights.get(definition.id, 0f);
            if (target <= cumulative) {
                return definition;
            }
        }
        return definitions.peek();
    }

    private void loadConfiguration() {
        FileHandle handle = resolveConfigFile();
        if (handle == null || !handle.exists()) {
            applyDefaults();
            return;
        }
        try {
            JsonValue root = new JsonReader().parse(handle);
            parseDefinitions(root.get("weatherStates"));
            parseSeasonalWeights(root.get("seasonalWeights"));
            secondsBetweenChanges = root.getFloat("secondsBetweenChanges", secondsBetweenChanges);
        } catch (Exception exception) {
            applyDefaults();
        }
    }

    private void parseDefinitions(JsonValue value) {
        definitions.clear();
        if (value == null) {
            return;
        }
        for (JsonValue child = value.child; child != null; child = child.next) {
            String id = child.getString("id", null);
            if (id == null) {
                continue;
            }
            WeatherDefinition definition = new WeatherDefinition();
            definition.id = id;
            definition.displayName = child.getString("displayName", capitalize(id));
            definitions.add(definition);
        }
    }

    private void parseSeasonalWeights(JsonValue value) {
        seasonalWeights.clear();
        if (value == null) {
            return;
        }
        for (JsonValue entry = value.child; entry != null; entry = entry.next) {
            WorldClock.Season season = parseSeason(entry.name);
            if (season == null) {
                continue;
            }
            ObjectMap<String, Float> weights = new ObjectMap<>();
            for (JsonValue weightNode = entry.child; weightNode != null; weightNode = weightNode.next) {
                weights.put(weightNode.name, weightNode.asFloat());
            }
            seasonalWeights.put(season, weights);
        }
    }

    private void applyDefaults() {
        definitions.clear();
        seasonalWeights.clear();

        definitions.add(createDefinition("sunny", "Sunny"));
        definitions.add(createDefinition("rain", "Rain"));
        definitions.add(createDefinition("snow", "Snow"));

        for (WorldClock.Season season : WorldClock.Season.values()) {
            ObjectMap<String, Float> weights = new ObjectMap<>();
            if (season == WorldClock.Season.WINTER) {
                weights.put("snow", 0.6f);
                weights.put("rain", 0.2f);
                weights.put("sunny", 0.2f);
            } else if (season == WorldClock.Season.SUMMER) {
                weights.put("sunny", 0.8f);
                weights.put("rain", 0.2f);
                weights.put("snow", 0f);
            } else {
                weights.put("sunny", 0.5f);
                weights.put("rain", 0.3f);
                weights.put("snow", 0.2f);
            }
            seasonalWeights.put(season, weights);
        }
        currentDefinition = definitions.first();
    }

    private FileHandle resolveConfigFile() {
        FileHandle internal = safeInternal(CONFIG_PATH);
        if (internal != null && internal.exists()) {
            return internal;
        }
        FileHandle local = Gdx.files.local(CONFIG_PATH);
        try {
            if (!local.exists()) {
                FileHandle parent = local.parent();
                if (parent != null) {
                    parent.mkdirs();
                }
                local.writeString(defaultJson(), false, "UTF-8");
            }
        } catch (Exception ignored) {
            // On platforms where writing isn't permitted we silently ignore and fall back to defaults.
        }
        return local.exists() ? local : internal;
    }

    private FileHandle safeInternal(String path) {
        try {
            return Gdx.files.internal(path);
        } catch (Exception exception) {
            return null;
        }
    }

    private WeatherDefinition createDefinition(String id, String name) {
        WeatherDefinition definition = new WeatherDefinition();
        definition.id = id;
        definition.displayName = name;
        return definition;
    }

    private WorldClock.Season parseSeason(String name) {
        if (name == null) {
            return null;
        }
        try {
            return WorldClock.Season.valueOf(name.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String capitalize(String text) {
        if (text == null || text.length() == 0) {
            return "";
        }
        char first = text.charAt(0);
        if (text.length() == 1) {
            return String.valueOf(Character.toUpperCase(first));
        }
        return Character.toUpperCase(first) + text.substring(1);
    }

    private String defaultJson() {
        return "{" +
            "\n  \"secondsBetweenChanges\": 45," +
            "\n  \"weatherStates\": [" +
            "\n    { \"id\": \"sunny\", \"displayName\": \"Sunny\" }," +
            "\n    { \"id\": \"rain\", \"displayName\": \"Rain\" }," +
            "\n    { \"id\": \"snow\", \"displayName\": \"Snow\" }" +
            "\n  ]," +
            "\n  \"seasonalWeights\": {" +
            "\n    \"SPRING\": { \"sunny\": 0.5, \"rain\": 0.3, \"snow\": 0.2 }," +
            "\n    \"SUMMER\": { \"sunny\": 0.8, \"rain\": 0.2, \"snow\": 0.0 }," +
            "\n    \"AUTUMN\": { \"sunny\": 0.5, \"rain\": 0.3, \"snow\": 0.2 }," +
            "\n    \"WINTER\": { \"sunny\": 0.2, \"rain\": 0.2, \"snow\": 0.6 }" +
            "\n  }" +
            "\n}";
    }

    private static class WeatherDefinition {
        String id;
        String displayName;
    }
}
