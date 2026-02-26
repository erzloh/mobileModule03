export const WEATHER_DESCRIPTION_BY_CODE: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

export function weatherCodeToDescription(code: number) {
  return WEATHER_DESCRIPTION_BY_CODE[code] ?? "Unknown";
}

export function weatherCodeToIconName(code: number | null) {
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
