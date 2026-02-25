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
import { fetchCurrentWeather } from "@/lib/openMeteo";

export default function CurrentlyScreen() {
  const { selectedLocation, locationMessage } = useSearchContext();
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [weatherDescription, setWeatherDescription] = useState("");
  const [windSpeedKmh, setWindSpeedKmh] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!selectedLocation) {
      setTemperatureC(null);
      setWeatherDescription("");
      setWindSpeedKmh(null);
      setErrorMessage(locationMessage ?? "Select a location to see the current weather.");
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setErrorMessage("");

    const loadCurrentWeather = async () => {
      try {
        const current = await fetchCurrentWeather(
          selectedLocation.latitude,
          selectedLocation.longitude,
          controller.signal,
        );

        if (!current) {
          setErrorMessage("No current weather available.");
          return;
        }

        setTemperatureC(current.temperature_2m);
        setWeatherDescription(weatherCodeToDescription(current.weather_code));
        setWindSpeedKmh(current.wind_speed_10m);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setErrorMessage("Failed to fetch weather.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadCurrentWeather();

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
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            <Text style={styles.locationText}>
              {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
            </Text>

            {isLoading ? <ActivityIndicator style={styles.loading} color="#334155" /> : null}
            {!isLoading && errorMessage ? (
              <Text style={styles.message}>{errorMessage}</Text>
            ) : null}

            {!isLoading && !errorMessage ? (
              <>
                <Text style={styles.valueText}>Temperature: {temperatureC ?? "--"} °C</Text>
                <Text style={styles.valueText}>Weather: {weatherDescription || "--"}</Text>
                <Text style={styles.valueText}>Wind: {windSpeedKmh ?? "--"} km/h</Text>
              </>
            ) : null}
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
  valueText: {
    fontSize: 16,
    color: "#1e293b",
    marginTop: 8,
  },
  loading: {
    marginTop: 12,
  },
  message: {
    color: "#475569",
    fontSize: 15,
    marginTop: 12,
  },
});
