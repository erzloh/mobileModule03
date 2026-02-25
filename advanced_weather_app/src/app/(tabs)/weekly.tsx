import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { weatherCodeToDescription } from "@/constants/weather";
import { useSearchContext } from "@/context/SearchContext";
import { fetchWeeklyDailyWeather, type OpenMeteoDailyWeather } from "@/lib/openMeteo";

export default function WeeklyScreen() {
  const { selectedLocation, locationMessage } = useSearchContext();
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        {!selectedLocation ? (
          <View style={styles.emptyState}>
            <Text style={styles.message}>{errorMessage}</Text>
          </View>
        ) : null}

        {selectedLocation ? (
          <ScrollView style={styles.list}>
            <Text style={styles.locationText}>
              {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
            </Text>

            {isLoading ? <ActivityIndicator style={styles.loading} /> : null}
            {!isLoading && errorMessage ? (
              <Text style={styles.message}>{errorMessage}</Text>
            ) : null}

            {!isLoading && !errorMessage
              ? dailyWeather.map((day) => {
                  const description = weatherCodeToDescription(day.weather_code);
                  return (
                    <Text key={day.date} style={styles.dayRow}>
                      {day.date} - Min {day.temperature_2m_min}°C / Max {day.temperature_2m_max}°C -{" "}
                      {description}
                    </Text>
                  );
                })
              : null}
          </ScrollView>
        ) : null}
      </View>
    </TouchableWithoutFeedback>
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
  dayRow: {
    marginTop: 8,
    color: "#1e293b",
  },
});
