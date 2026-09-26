import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { weatherCache } from "@/db/schema";

export const BACO = { lat: 13.3578, lng: 121.1002, label: "Baco, Oriental Mindoro" };

export type WeatherPayload = {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    windSpeed: number;
    code: number;
    time: string;
  };
  daily: {
    date: string;
    code: number;
    max: number;
    min: number;
    rain: number;
    rainChance: number;
  }[];
};

export type WeatherResult = {
  live: boolean;
  source: string;
  fetchedAt: string;
  data: WeatherPayload;
};

export const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mainly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Rime fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌧️" },
  61: { label: "Light rain", icon: "🌦️" },
  63: { label: "Moderate rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Heavy showers", icon: "🌧️" },
  82: { label: "Violent showers", icon: "⛈️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm w/ hail", icon: "⛈️" },
  99: { label: "Severe thunderstorm", icon: "🌩️" },
};

export function describe(code: number) {
  return WMO[code] ?? { label: "Unavailable", icon: "🌡️" };
}

const FALLBACK: WeatherPayload = {
  current: { temperature: 31.2, humidity: 78, precipitation: 0.4, windSpeed: 12.6, code: 2, time: new Date().toISOString() },
  daily: Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      code: [2, 3, 61, 80, 2, 1, 63][i],
      max: [32, 31, 30, 29, 31, 33, 30][i],
      min: [24, 24, 23, 23, 24, 25, 24][i],
      rain: [0.8, 2.4, 11.2, 18.6, 1.2, 0, 8.4][i],
      rainChance: [20, 40, 70, 85, 30, 10, 60][i],
    };
  }),
};

export async function getWeather(maxAgeMinutes = 30): Promise<WeatherResult> {
  const cached = await db
    .select()
    .from(weatherCache)
    .where(eq(weatherCache.location, BACO.label))
    .orderBy(desc(weatherCache.fetchedAt))
    .limit(1);

  const fresh = cached[0] && Date.now() - new Date(cached[0].fetchedAt).getTime() < maxAgeMinutes * 60000;
  if (fresh) {
    return {
      live: cached[0].source.startsWith("Open-Meteo"),
      source: cached[0].source,
      fetchedAt: new Date(cached[0].fetchedAt).toISOString(),
      data: cached[0].payload as WeatherPayload,
    };
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${BACO.lat}&longitude=${BACO.lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max` +
      `&timezone=Asia%2FManila&forecast_days=7`;
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = (await res.json()) as {
      current: Record<string, number | string>;
      daily: Record<string, (number | string)[]>;
    };
    const payload: WeatherPayload = {
      current: {
        temperature: Number(json.current.temperature_2m),
        humidity: Number(json.current.relative_humidity_2m),
        precipitation: Number(json.current.precipitation),
        windSpeed: Number(json.current.wind_speed_10m),
        code: Number(json.current.weather_code),
        time: String(json.current.time),
      },
      daily: (json.daily.time as string[]).map((t, i) => ({
        date: t,
        code: Number(json.daily.weather_code[i]),
        max: Number(json.daily.temperature_2m_max[i]),
        min: Number(json.daily.temperature_2m_min[i]),
        rain: Number(json.daily.precipitation_sum[i]),
        rainChance: Number(json.daily.precipitation_probability_max[i] ?? 0),
      })),
    };
    const source = "Open-Meteo Public API (api.open-meteo.com)";
    await db.insert(weatherCache).values({ location: BACO.label, payload, source });
    return { live: true, source, fetchedAt: new Date().toISOString(), data: payload };
  } catch {
    if (cached[0]) {
      return {
        live: false,
        source: `${cached[0].source} — cached copy (live refresh unavailable)`,
        fetchedAt: new Date(cached[0].fetchedAt).toISOString(),
        data: cached[0].payload as WeatherPayload,
      };
    }
    return {
      live: false,
      source: "AgriShare sample data (no internet connection to the weather API)",
      fetchedAt: new Date().toISOString(),
      data: FALLBACK,
    };
  }
}
