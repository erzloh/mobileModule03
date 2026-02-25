import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { weatherCodeToDescription } from "@/constants/weather";
import { useSearchContext } from "@/context/SearchContext";
import { fetchTodayHourlyWeather, type OpenMeteoHourlyWeather } from "@/lib/openMeteo";

export default function TodayScreen() {
  const { selectedLocation, locationMessage } = useSearchContext();
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

  return (
    <View style={styles.container}>
      {!selectedLocation ? (
        <View style={styles.emptyState}>
          <Text style={styles.message}>{errorMessage}</Text>
        </View>
      ) : null}

      {selectedLocation ? (
        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.locationText}>
            {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
          </Text>

          {isLoading ? <ActivityIndicator style={styles.loading} /> : null}
          {!isLoading && errorMessage ? (
            <Text style={styles.message}>{errorMessage}</Text>
          ) : null}

          {!isLoading && !errorMessage
            ? hourlyWeather.map((hour) => {
                const timeOfDay = hour.time.split("T")[1]?.slice(0, 5) ?? hour.time;
                const description = weatherCodeToDescription(hour.weather_code);
                return (
                  <Text key={hour.time} style={styles.hourRow}>
                    {timeOfDay} - {hour.temperature_2m}°C - {description} - {hour.wind_speed_10m} km/h
                  </Text>
                );
              })
            : null}
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  },
  loading: {
    marginTop: 12,
  },
  message: {
    marginTop: 12,
    color: "#475569",
    fontSize: 15,
  },
  hourRow: {
    marginTop: 8,
    color: "#1e293b",
  },
});
