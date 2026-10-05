// Distance search by Indian PIN code.
// data/pincodes.json maps every PIN to the centre point (lat, lng) of its post offices
// (source: India Post / data.gov.in "All India Pincode Directory"; see data/README.md).
// Distances are straight-line (as the crow flies) between PIN centres, so treat them as approximate.
import { readFileSync } from "node:fs";
import { toNumber } from "./helpers.js";

const PINS = JSON.parse(readFileSync(new URL("../data/pincodes.json", import.meta.url), "utf-8"));

export const DEFAULT_RADIUS_KM = 30;
export const MAX_RADIUS_KM = 500;
const MAX_CANDIDATES = 2000; // safety cap on how many records one distance search will look at

export const getPinCoords = (pin) => PINS[String(pin ?? "").trim()] || null;

export const distanceKm = (a, b) => {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// Reads ?pinCode=&radiusKm= . Returns { active:false } when no PIN was given, { error } for a bad PIN,
// otherwise { active:true, pin, origin, radiusKm }.
export const geoFromQuery = (query) => {
  const raw = query.pinCode;
  if (raw === undefined || raw === null || String(raw).trim() === "") return { active: false };

  const pin = String(raw).trim();
  if (!/^\d{6}$/.test(pin)) return { error: "PIN code must be exactly 6 digits" };

  const origin = getPinCoords(pin);
  if (!origin) return { error: `We could not find PIN code ${pin}. Please check it and try again.` };

  const requested = toNumber(query.radiusKm);
  const radiusKm = Math.min(MAX_RADIUS_KM, Math.max(1, requested ?? DEFAULT_RADIUS_KM));
  return { active: true, pin, origin, radiusKm };
};

// Keeps only items within geo.radiusKm, adds distanceKm, sorts nearest first.
// Items whose own PIN is missing/unknown cannot be placed on the map, so they are left out and counted.
export const withinRadius = (items, geo, getPin) => {
  const found = [];
  let skippedUnknownPin = 0;
  for (const item of items) {
    const coords = getPinCoords(getPin(item));
    if (!coords) { skippedUnknownPin++; continue; }
    const km = distanceKm(geo.origin, coords);
    if (km <= geo.radiusKm) {
      const plain = typeof item.toObject === "function" ? item.toObject() : { ...item };
      found.push({ ...plain, distanceKm: Math.round(km * 10) / 10 });
    }
  }
  return { found, skippedUnknownPin };
};

export const CANDIDATE_LIMIT = MAX_CANDIDATES;
