"use client";

import { useSyncExternalStore } from "react";

import { APP_URL } from "@/constants";

const subscribeToOrigin = () => () => {};
const getOriginSnapshot = () => window.location.origin;
const getServerOriginSnapshot = () => APP_URL;

export function useAppOrigin() {
  return useSyncExternalStore(
    subscribeToOrigin,
    getOriginSnapshot,
    getServerOriginSnapshot,
  );
}