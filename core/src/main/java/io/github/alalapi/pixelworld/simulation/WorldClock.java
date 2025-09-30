package io.github.alalapi.pixelworld.simulation;

/**
 * Lightweight accumulator based clock that drives in-game time.
 */
public class WorldClock {

    private static final float DEFAULT_SECONDS_PER_DAY = 120f;
    private static final int DAYS_PER_SEASON = 20;

    public enum Season {
        SPRING("Spring"),
        SUMMER("Summer"),
        AUTUMN("Autumn"),
        WINTER("Winter");

        private final String displayName;

        Season(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    private final float secondsPerDay;

    private float secondsIntoDay = 0f;
    private int day = 1;
    private float speedMultiplier = 1f;

    public WorldClock() {
        this(DEFAULT_SECONDS_PER_DAY);
    }

    public WorldClock(float secondsPerDay) {
        this.secondsPerDay = secondsPerDay;
    }

    public void update(float deltaSeconds) {
        float scaled = deltaSeconds * speedMultiplier;
        secondsIntoDay += scaled;
        while (secondsIntoDay >= secondsPerDay) {
            secondsIntoDay -= secondsPerDay;
            day++;
        }
    }

    public boolean toggleFastForward() {
        speedMultiplier = speedMultiplier == 1f ? 10f : 1f;
        return speedMultiplier > 1f;
    }

    public boolean isFastForward() {
        return speedMultiplier > 1f;
    }

    public float getSpeedMultiplier() {
        return speedMultiplier;
    }

    public int getDay() {
        return day;
    }

    public Season getSeason() {
        int index = ((day - 1) / DAYS_PER_SEASON) % Season.values().length;
        return Season.values()[index];
    }

    public String getSeasonDisplayName() {
        return getSeason().getDisplayName();
    }

    public float getTimeOfDay() {
        return secondsIntoDay / secondsPerDay;
    }

    public float getSecondsIntoDay() {
        return secondsIntoDay;
    }

    public float getSecondsPerDay() {
        return secondsPerDay;
    }

    public String getFormattedTime() {
        float dayProgress = getTimeOfDay() * 24f;
        int hours = (int) dayProgress;
        int minutes = (int) ((dayProgress - hours) * 60f);
        return formatTwoDigits(hours) + ":" + formatTwoDigits(minutes);
    }

    private String formatTwoDigits(int value) {
        return value < 10 ? "0" + value : Integer.toString(value);
    }
}
