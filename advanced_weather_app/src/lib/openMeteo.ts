export const OPEN_METEO_GEOCODING_BASE_URL = "https://geocoding-api.open-meteo.com/v1/search";
export const OPEN_METEO_FORECAST_BASE_URL = "https://api.open-meteo.com/v1/forecast";

export type OpenMeteoGeocodingResult = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

type OpenMeteoGeocodingResponse = {
  results?: OpenMeteoGeocodingResult[];
};

export type OpenMeteoCurrentWeather = {
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
};

type OpenMeteoForecastResponse = {
  current?: OpenMeteoCurrentWeather;
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    wind_speed_10m: number[];
  };
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

export type OpenMeteoHourlyWeather = {
  time: string;
  temperature_2m: number;
  weather_code: number;
  wind_speed_10m: number;
};

export type OpenMeteoDailyWeather = {
  date: string;
  temperature_2m_max: number;
  temperature_2m_min: number;
  weather_code: number;
};

export async function fetchGeocodingSuggestions(
  query: string,
  count: number,
  signal: AbortSignal,
): Promise<OpenMeteoGeocodingResult[]> {
  const url = `${OPEN_METEO_GEOCODING_BASE_URL}?name=${encodeURIComponent(
    query,
  )}&count=${count}&format=json`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OpenMeteoGeocodingResponse;
  return data.results ?? [];
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<OpenMeteoCurrentWeather | null> {
  const url =
    `${OPEN_METEO_FORECAST_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,weather_code,wind_speed_10m";
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  return data.current ?? null;
}

export async function fetchTodayHourlyWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<OpenMeteoHourlyWeather[]> {
  const url =
    `${OPEN_METEO_FORECAST_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    "&hourly=temperature_2m,weather_code,wind_speed_10m&forecast_days=1&timezone=auto";
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  if (!data.hourly) {
    return [];
  }

  return data.hourly.time.map((time, index) => ({
    time,
    temperature_2m: data.hourly?.temperature_2m[index] ?? 0,
    weather_code: data.hourly?.weather_code[index] ?? 0,
    wind_speed_10m: data.hourly?.wind_speed_10m[index] ?? 0,
  }));
}

export async function fetchWeeklyDailyWeather(
  latitude: number,
  longitude: number,
  signal: AbortSignal,
): Promise<OpenMeteoDailyWeather[]> {
  const url =
    `${OPEN_METEO_FORECAST_BASE_URL}?latitude=${latitude}&longitude=${longitude}` +
    "&daily=temperature_2m_max,temperature_2m_min,weather_code&forecast_days=7&timezone=auto";
  const response = await fetch(url, { signal });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as OpenMeteoForecastResponse;
  if (!data.daily) {
    return [];
  }

  return data.daily.time.map((date, index) => ({
    date,
    temperature_2m_max: data.daily?.temperature_2m_max[index] ?? 0,
    temperature_2m_min: data.daily?.temperature_2m_min[index] ?? 0,
    weather_code: data.daily?.weather_code[index] ?? 0,
  }));
}
