"use client";

import { useEffect, useState } from "react";
import { textStyles } from "@/lib/typography";

const TIME_ZONE = "Asia/Manila";
const LOCATION = "PH";

function format(date: Date) {
  return date.toLocaleTimeString("en-US", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function Clock() {
  const [time, setTime] = useState(() => format(new Date()));

  useEffect(() => {
    const id = setInterval(() => setTime(format(new Date())), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      suppressHydrationWarning
      className={`hidden items-center gap-1.5 sm:inline-flex ${textStyles.numeralPrimary}`}
    >
      {LOCATION} {time}
    </span>
  );
}
