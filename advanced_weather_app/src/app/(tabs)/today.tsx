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
import { fetchTodayHourlyWeather, type OpenMeteoHourlyWeather } from "@/lib/openMeteo";

const CHART_HEIGHT = 220;
const CHART_MIN_WIDTH = 280;
const SCREEN_HORIZONTAL_PADDING = 16;
const MIN_Y_TICK_COUNT = 2;
const MAX_Y_TICK_COUNT = 5;

type ChartData = {
  labels: string[];
  temperatures: number[];
  segments: number;
};

export default function TodayScreen() {
  const { disableTabSwipe, enableTabSwipe } = useTabSwipeLock();
  const { selectedLocation, locationMessage } = useSearchContext();
  const { width: windowWidth } = useWindowDimensions();
  const [hourlyWeather, setHourlyWeather] = useState<OpenMeteoHourlyWeather[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!selectedLocation) {
      setHourlyWeather([]);
      setErrorMessage(locationMessage ?? "Select a location to see today's weather.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");

    const loadTodayWeather = async () => {
      try {
        const data = await fetchTodayHourlyWeather(
          selectedLocation.latitude,
          selectedLocation.longitude,
          controller.signal,
        );
        if (data.length === 0) {
          setErrorMessage("No hourly weather available.");
          setHourlyWeather([]);
          return;
        }
        setHourlyWeather(data);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setErrorMessage("Failed to fetch today's weather.");
        setHourlyWeather([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTodayWeather();

    return () => {
      controller.abort();
    };
  }, [selectedLocation, locationMessage]);

  const chartWidth = Math.max(CHART_MIN_WIDTH, windowWidth - SCREEN_HORIZONTAL_PADDING * 2);

  const chartData = useMemo<ChartData | null>(() => {
    if (hourlyWeather.length < 2) {
      return null;
    }

    const temperatures = hourlyWeather.map((hour) => hour.temperature_2m);
    const maxTemp = Math.max(...temperatures);
    const minTemp = Math.min(...temperatures);
    const roundedRangeSteps = Math.round(maxTemp) - Math.round(minTemp);
    const segments = Math.min(
      MAX_Y_TICK_COUNT,
      Math.max(MIN_Y_TICK_COUNT, roundedRangeSteps + 1),
    );

    const labels = hourlyWeather.map((hour, index) => {
      const hourLabel = hour.time.split("T")[1]?.slice(0, 2) ?? hour.time;
      return index % 3 === 0 ? hourLabel : "";
    });

    return {
      labels,
      temperatures,
      segments,
    };
  }, [hourlyWeather]);

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
              <Text style={styles.chartTitle}>Today temperature</Text>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.temperatures,
                      strokeWidth: 2,
                    },
                  ],
                }}
                width={chartWidth}
                height={CHART_HEIGHT}
                yAxisSuffix="°"
                yAxisInterval={3}
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
                style={styles.chart}
              />
            </View>
          ) : null}

          {!isLoading && !errorMessage ? (
            <View style={styles.hourlySection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlyRow}
                onTouchStart={disableTabSwipe}
                onTouchEnd={enableTabSwipe}
                onTouchCancel={enableTabSwipe}
                onScrollEndDrag={enableTabSwipe}
                onMomentumScrollEnd={enableTabSwipe}
              >
                {hourlyWeather.map((hour) => {
                  const timeOfDay = hour.time.split("T")[1]?.slice(0, 5) ?? hour.time;
                  const iconName = weatherCodeToIconName(hour.weather_code);

                  return (
                    <View key={hour.time} style={styles.hourCard}>
                      <Text style={styles.hourTime}>{timeOfDay}</Text>
                      <MaterialCommunityIcons name={iconName} size={28} color="#0f172a" />
                      <Text style={styles.hourTemp}>{Math.round(hour.temperature_2m)}°</Text>
                      <View style={styles.windRow}>
                        <MaterialCommunityIcons name="weather-windy" size={14} color="#334155" />
                        <Text style={styles.hourWind}>{Math.round(hour.wind_speed_10m)} km/h</Text>
                      </View>
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
    paddingBottom: 14,
    backgroundColor: "rgb(255, 255, 255)",
  },
  chart: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  hourlySection: {
    marginTop: 8,
    marginBottom: 8,
  },
  hourlyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 10,
  },
  hourlyRow: {
    paddingRight: 0,
    gap: 10,
  },
  hourCard: {
    width: 110,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.2)",
    backgroundColor: "rgba(255, 255, 255)",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  hourTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  hourTemp: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginTop: 6,
    marginBottom: 8,
  },
  windRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  hourWind: {
    fontSize: 12,
    color: "#334155",
  },
});
