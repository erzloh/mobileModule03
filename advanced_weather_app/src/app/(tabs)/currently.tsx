import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { weatherCodeToDescription } from "@/constants/weather";
import { useSearchContext } from "@/context/SearchContext";
import { fetchCurrentWeather } from "@/lib/openMeteo";

function weatherCodeToIconName(code: number | null) {
  if (code === null) {
    return "weather-cloudy";
  }
  if (code === 0) {
    return "weather-sunny";
  }
  if (code >= 1 && code <= 3) {
    return "weather-partly-cloudy";
  }
  if (code === 45 || code === 48) {
    return "weather-fog";
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "weather-rainy";
  }
  if (code >= 71 && code <= 77) {
    return "weather-snowy";
  }
  if (code === 85 || code === 86) {
    return "weather-snowy-rainy";
  }
  if (code >= 95) {
    return "weather-lightning-rainy";
  }
  return "weather-cloudy";
}

export default function CurrentlyScreen() {
  const { selectedLocation, locationMessage } = useSearchContext();
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperatureC, setTemperatureC] = useState<number | null>(null);
  const [weatherDescription, setWeatherDescription] = useState("");
  const [windSpeedKmh, setWindSpeedKmh] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!selectedLocation) {
      setWeatherCode(null);
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
          setWeatherCode(null);
          setErrorMessage("No current weather available.");
          return;
        }

        setWeatherCode(current.weather_code);
        setTemperatureC(current.temperature_2m);
        setWeatherDescription(weatherCodeToDescription(current.weather_code));
        setWindSpeedKmh(current.wind_speed_10m);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        setWeatherCode(null);
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

  const iconName = weatherCodeToIconName(weatherCode);

  return (
    <View style={styles.container}>
      {!selectedLocation ? (
        <View style={styles.emptyState}>
          <Text style={styles.message}>{errorMessage}</Text>
        </View>
      ) : null}

      {selectedLocation ? (
        <View style={styles.content}>
          <Text style={styles.locationText}>
            {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
          </Text>

          {isLoading ? <ActivityIndicator style={styles.loading} color="#334155" size="large" /> : null}
          {!isLoading && errorMessage ? <Text style={styles.message}>{errorMessage}</Text> : null}

          {!isLoading && !errorMessage ? (
            <View style={styles.weatherCard}>
              <Text style={styles.temperatureText}>{temperatureC ?? "--"}°C</Text>
              <MaterialCommunityIcons name={iconName} size={86} color="#0f172a" />
              <Text style={styles.weatherText}>{weatherDescription || "--"}</Text>
              <View style={styles.windRow}>
                <MaterialCommunityIcons name="weather-windy" size={18} color="#334155" />
                <Text style={styles.windText}>Wind {windSpeedKmh ?? "--"} km/h</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#0f172a",
  },
  weatherCard: {
    width: "100%",
    maxWidth: 320,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  loading: {
    marginTop: 12,
  },
  message: {
    color: "#475569",
    fontSize: 15,
    marginTop: 4,
    textAlign: "center",
  },
  temperatureText: {
    marginTop: 16,
    fontSize: 44,
    fontWeight: "700",
    color: "#0f172a",
  },
  weatherText: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  windRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  windText: {
    fontSize: 15,
    color: "#334155",
  },
});
