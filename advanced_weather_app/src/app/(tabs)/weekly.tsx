import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { weatherCodeToIconName } from "@/constants/weather";
import { useTabSwipeLock } from "@/hooks/useTabSwipeLock";
import { useSearchContext } from "@/context/SearchContext";
import { fetchWeeklyDailyWeather, type OpenMeteoDailyWeather } from "@/lib/openMeteo";

const CHART_HEIGHT = 220;
const CHART_MIN_WIDTH = 280;
const SCREEN_HORIZONTAL_PADDING = 16;
const MIN_Y_TICK_COUNT = 2;
const MAX_Y_TICK_COUNT = 6;
const MIN_TEMP_RGB = [37, 99, 235] as const;
const MAX_TEMP_RGB = [234, 88, 12] as const;

type WeeklyChartData = {
  labels: string[];
  minTemps: number[];
  maxTemps: number[];
  segments: number;
};

function formatDayLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { weekday: "short" });
}

function formatShortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return date;
  }
  return parsed.toLocaleDateString(undefined, { month: "2-digit", day: "2-digit" });
}

function rgb([r, g, b]: readonly number[]) {
  return `rgb(${r}, ${g}, ${b})`;
}

function rgba([r, g, b]: readonly number[], opacity = 1) {
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export default function WeeklyScreen() {
  const { disableTabSwipe, enableTabSwipe } = useTabSwipeLock();
  const { selectedLocation, locationMessage } = useSearchContext();
  const { width: windowWidth } = useWindowDimensions();
  const [dailyWeather, setDailyWeather] = useState<OpenMeteoDailyWeather[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!selectedLocation) {
      setDailyWeather([]);
      setErrorMessage(locationMessage ?? "Select a location to see the weekly weather.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");

    const loadWeeklyWeather = async () => {
      try {
        const data = await fetchWeeklyDailyWeather(
          selectedLocation.latitude,
          selectedLocation.longitude,
          controller.signal,
        );
        if (data.length === 0) {
          setErrorMessage("No daily weather available.");
          setDailyWeather([]);
          return;
        }
        setDailyWeather(data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setErrorMessage("Failed to fetch weekly weather.");
        setDailyWeather([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadWeeklyWeather();

    return () => {
      controller.abort();
    };
  }, [selectedLocation, locationMessage]);

  const chartWidth = Math.max(CHART_MIN_WIDTH, windowWidth - SCREEN_HORIZONTAL_PADDING * 2);

  const chartData = useMemo<WeeklyChartData | null>(() => {
    if (dailyWeather.length < 2) {
      return null;
    }

    const minTemps = dailyWeather.map((day) => day.temperature_2m_min);
    const maxTemps = dailyWeather.map((day) => day.temperature_2m_max);
    const labels = dailyWeather.map((day) => formatDayLabel(day.date));

    const highest = Math.max(...maxTemps);
    const lowest = Math.min(...minTemps);
    const roundedRangeSteps = Math.round(highest) - Math.round(lowest);
    const segments = Math.min(
      MAX_Y_TICK_COUNT,
      Math.max(MIN_Y_TICK_COUNT, roundedRangeSteps + 1),
    );

    return {
      labels,
      minTemps,
      maxTemps,
      segments,
    };
  }, [dailyWeather]);

  return (
    <View style={styles.container}>
      {!selectedLocation ? (
        <View style={styles.emptyState}>
          <Text style={styles.message}>{errorMessage}</Text>
        </View>
      ) : null}

      {selectedLocation ? (
        <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
          <Text style={styles.locationText}>
            {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
          </Text>

          {isLoading ? <ActivityIndicator style={styles.loading} /> : null}
          {!isLoading && errorMessage ? <Text style={styles.message}>{errorMessage}</Text> : null}

          {!isLoading && !errorMessage && chartData ? (
            <View style={[styles.chartCard, { width: chartWidth }]}>
              <Text style={styles.chartTitle}>Weekly temperature</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotMin]} />
                  <Text style={styles.legendText}>Min</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.legendDotMax]} />
                  <Text style={styles.legendText}>Max</Text>
                </View>
              </View>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.minTemps,
                      color: (opacity = 1) => rgba(MIN_TEMP_RGB, opacity),
                      strokeWidth: 2,
                    },
                    {
                      data: chartData.maxTemps,
                      color: (opacity = 1) => rgba(MAX_TEMP_RGB, opacity),
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={chartWidth}
                height={CHART_HEIGHT}
                yAxisSuffix="°"
                yAxisInterval={1}
                segments={chartData.segments}
                fromZero={false}
                withShadow={false}
                chartConfig={{
                  backgroundGradientFrom: "rgba(255, 255, 255, 0.45)",
                  backgroundGradientTo: "rgba(255, 255, 255, 0.45)",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(15, 23, 42, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(51, 65, 85, ${opacity})`,
                  propsForBackgroundLines: {
                    stroke: "rgba(71, 85, 105, 0.18)",
                    strokeWidth: 1,
                  },
                  propsForDots: {
                    r: "3",
                    strokeWidth: "1",
                    stroke: "#0f172a",
                  },
                }}
                formatYLabel={(value) => `${Math.round(Number(value))}`}
                style={styles.chart}
              />
            </View>
          ) : null}

          {!isLoading && !errorMessage ? (
            <View style={styles.dailySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dailyRow}
                onTouchStart={disableTabSwipe}
                onTouchEnd={enableTabSwipe}
                onTouchCancel={enableTabSwipe}
                onScrollEndDrag={enableTabSwipe}
                onMomentumScrollEnd={enableTabSwipe}
              >
                {dailyWeather.map((day) => {
                  const iconName = weatherCodeToIconName(day.weather_code);
                  return (
                    <View key={day.date} style={styles.dayCard}>
                      <Text style={styles.dayName}>{formatDayLabel(day.date)}</Text>
                      <Text style={styles.dayDate}>{formatShortDate(day.date)}</Text>
                      <MaterialCommunityIcons name={iconName} size={28} color="#0f172a" />
                      <Text style={styles.minTemp}>Min {Math.round(day.temperature_2m_min)}°</Text>
                      <Text style={styles.maxTemp}>Max {Math.round(day.temperature_2m_max)}°</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SCREEN_HORIZONTAL_PADDING,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#0f172a",
    textAlign: "center",
  },
  loading: {
    marginTop: 12,
  },
  message: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
  },
  chartCard: {
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.22)",
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: "rgb(255, 255, 255)",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingBottom: 8,
    backgroundColor: "rgb(255, 255, 255)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotMin: {
    backgroundColor: rgb(MIN_TEMP_RGB),
  },
  legendDotMax: {
    backgroundColor: rgb(MAX_TEMP_RGB),
  },
  legendText: {
    color: "#1e293b",
    fontSize: 13,
  },
  chart: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  dailySection: {
    marginTop: 8,
    marginBottom: 8,
  },
  dailyRow: {
    gap: 10,
  },
  dayCard: {
    width: 125,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.2)",
    backgroundColor: "rgba(255, 255, 255)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  dayName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
  },
  dayDate: {
    fontSize: 12,
    color: "#475569",
    marginBottom: 8,
  },
  minTemp: {
    marginTop: 8,
    fontSize: 14,
    color: rgb(MIN_TEMP_RGB),
    fontWeight: "600",
  },
  maxTemp: {
    marginTop: 4,
    fontSize: 14,
    color: rgb(MAX_TEMP_RGB),
    fontWeight: "600",
  },
});
