'use client';

import { Cloud, Sun, CloudRain, Snowflake, CloudLightning, Wind } from 'lucide-react';

interface WeatherCardProps {
  temperature: number;
  description: string;
  location?: string;
  /** Backend-provided weather icon code (e.g. "01d", "02n"). Takes precedence over description-based inference. */
  iconCode?: string;
}

function WeatherIcon({ description, iconCode }: { description: string; iconCode?: string }) {
  // Use backend-provided icon code if available (REQ-W7)
  if (iconCode) {
    return <WeatherIconByCode code={iconCode} />;
  }

  const d = (description || '').toLowerCase();
  if (d.includes('rain') || d.includes('lluvia'))
    return <CloudRain className="w-5 h-5 text-[#0A0A0A]" />;
  if (d.includes('snow') || d.includes('nieve'))
    return <Snowflake className="w-5 h-5 text-[#0A0A0A]" />;
  if (d.includes('storm') || d.includes('tormenta'))
    return <CloudLightning className="w-5 h-5 text-[#0A0A0A]" />;
  if (d.includes('wind') || d.includes('viento'))
    return <Wind className="w-5 h-5 text-[#0A0A0A]" />;
  if (d.includes('cloud') || d.includes('nube'))
    return <Cloud className="w-5 h-5 text-[#0A0A0A]" />;
  return <Sun className="w-5 h-5 text-[#0A0A0A]" />;
}

/** Map OpenWeatherMap-style icon codes to Lucide icons. */
function WeatherIconByCode({ code }: { code: string }) {
  // OWM codes: 01=clear, 02=few clouds, 03=scattered, 04=broken/overcast,
  // 09=shower rain, 10=rain, 11=thunderstorm, 13=snow, 50=mist
  const prefix = code.slice(0, 2);
  if (prefix === '01') return <Sun className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '02') return <Cloud className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '03' || prefix === '04') return <Cloud className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '09' || prefix === '10') return <CloudRain className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '11') return <CloudLightning className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '13') return <Snowflake className="w-5 h-5 text-[#0A0A0A]" />;
  if (prefix === '50') return <Wind className="w-5 h-5 text-[#0A0A0A]" />;
  return <Sun className="w-5 h-5 text-[#0A0A0A]" />;
}

export default function WeatherCard({
  temperature,
  description,
  location,
  iconCode,
}: WeatherCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#F5F5F5] border border-[#e8e8e8]">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
        <WeatherIcon description={description} iconCode={iconCode} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-[family-name:var(--font-syne)] font-bold text-[#0A0A0A]">
            {Math.round(temperature)}&deg;C
          </span>
          <span className="text-sm text-[#6A7282] truncate">{description}</span>
        </div>
        {location && (
          <p className="text-[10px] text-[#767676] mt-0.5">{location}</p>
        )}
      </div>
    </div>
  );
}
