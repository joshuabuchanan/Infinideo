"use client";

import { useSyncExternalStore } from "react";

const consentKey = "infinideo-analytics-consent";
let fallbackChoice: "granted" | "denied" | "unknown" = "unknown";

function getConsent(): "granted" | "denied" | "unknown" {
  try {
    const storedChoice = window.localStorage.getItem(consentKey);
    if (storedChoice === "granted" || storedChoice === "denied") {
      fallbackChoice = storedChoice;
      return storedChoice;
    }
  } catch {
    return fallbackChoice;
  }

  return fallbackChoice;
}

function subscribeToConsent(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("infinideo-consent-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("infinideo-consent-change", onChange);
  };
}

export function AnalyticsConsent() {
  const choice = useSyncExternalStore(subscribeToConsent, getConsent, () => "unknown");

  function saveChoice(value: "granted" | "denied") {
    fallbackChoice = value;
    try {
      window.localStorage.setItem(consentKey, value);
    } catch {
      // Keep the choice for this page session when browser storage is unavailable.
    }
    window.dispatchEvent(new Event("infinideo-consent-change"));
  }

  if (choice !== "unknown") return null;

  return (
    <aside className="analytics-consent" aria-label="Analytics consent">
      <div>
        <strong>Help improve Infinideo</strong>
        <p>Allow anonymous, first-party playback statistics such as starts and completions.</p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => saveChoice("denied")}>Decline</button>
        <button type="button" onClick={() => saveChoice("granted")}>Allow analytics</button>
      </div>
    </aside>
  );
}