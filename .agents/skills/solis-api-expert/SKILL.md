---
name: solis-api-expert
description: >-
  Expert knowledge, HMAC-SHA1 authentication algorithm, endpoints, and error handling for SolisCloud Platform API Document V2.0.3. Use whenever interacting with Solis API, constructing request headers, debugging authentication signatures, or mapping inverter telemetry data.
---

# SolisCloud API V2.0.3 Reference & Guide

This skill provides comprehensive instructions for interacting with the SolisCloud REST API (V2.0.3).

## 1. Authentication & Signature Specification

All endpoints are `POST` requests and require four custom HTTP headers.

- **Base URL**: `https://www.soliscloud.com:13333/`
- **Rate Limit**: Maximum 2 requests per second (10 req/s for station batch energy list).
- **Body**: Always JSON (`application/json;charset=UTF-8`).

### Required Headers
1. `Content-Type`: `application/json;charset=UTF-8`
2. `Content-MD5`: MD5 digest of the raw JSON body encoded in Base64:
   ```ts
   const contentMd5 = crypto.createHash('md5').update(bodyString, 'utf8').digest('base64');
   ```
3. `Date`: Current time in GMT / RFC 1123 format (must match `EEE, d MMM yyyy HH:mm:ss 'GMT'`, e.g. `Tue, 27 Jun 2023 06:23:30 GMT`).
   *Note: Server rejects timestamps diverging by more than ±15 minutes.*
4. `Authorization`: `API {keyId}:{signature}` where signature is:
   ```ts
   const stringToSign = `POST\n${contentMd5}\n${contentType}\n${date}\n${canonicalizedResource}`;
   const signature = crypto.createHmac('sha1', secretKey).update(stringToSign, 'utf8').digest('base64');
   ```
   - `canonicalizedResource`: The endpoint path, e.g. `/v1/api/inverterList` or `/v1/api/inverterDetail`.

---

## 2. Key API Endpoints & Request Bodies

### 2.1 Device Interfaces
- **Inverter List** (`/v1/api/inverterList`):
  - Request: `{ pageNo: "1", pageSize: "20", stationId?: string, snList?: string[] }`
  - Returns: Inverter list with installed capacity, `pac`, `etoday`, `etotal`, status (`state`: 1=online, 2=offline, 3=alarm), collector SN.
- **Single Inverter Detail** (`/v1/api/inverterDetail`):
  - Request: `{ id?: number, sn?: string }` (either id or sn required)
  - Returns: Granular DC string voltages (`uPv1`..`uPv32`), string currents (`iPv1`..`iPv32`), AC voltages/currents (`uAc1`..`3`, `iAc1`..`3`), battery SOC (`batteryCapacitySoc`), battery power (`batteryPower`), grid power (`pSum`), household load (`familyLoadPower`), temperatures, frequencies.
- **Inverter Real-time Day Curve** (`/v1/api/inverterDay`):
  - Request: `{ id?: number, sn?: string, money: "USD"|"EUR"|"THB"|"", time: "YYYY-MM-DD", timeZone: 7 }`
  - Returns: 5-minute sampling points of power, string telemetry, battery state.
- **Inverter Monthly / Yearly Data** (`/v1/api/inverterMonth`, `/v1/api/inverterYear`):
  - Returns daily breakdown for a month or monthly breakdown for a year.
- **Device Alarm List** (`/v1/api/alarmList`):
  - Request: `{ pageNo: "1", pageSize: "20", alarmDeviceSn?: string, state?: number }` (0=pending, 1=processed, 2=restored).

### 2.2 Plant (Power Station) Interfaces
- **Power Station List** (`/v1/api/userStationList`):
  - Request: `{ pageNo: 1, pageSize: 20 }`
  - Returns: Station IDs, capacities, daily/monthly/total yield, installer info.
- **Single Power Station Details** (`/v1/api/stationDetail`):
  - Request: `{ id: number }`
  - Returns: Station overview, current output, environmental savings (CO2 avoided, trees planted), weather data.
- **Station Day Real-time Curve** (`/v1/api/stationDay`):
  - Request: `{ id: number, time: "YYYY-MM-DD", timeZone: 7 }`

### 2.3 Meters & EPM (Export Power Management)
- `/v1/api/epmList` and `/v1/api/epmDetail`: Export power manager status, grid export limit.
- `/v1/api/ammeterList` and `/v1/api/ammeterDetail`: Dedicated smart meter telemetry.

---

## 3. Important Status Codes & Enum Mappings

### Inverter State (`state`):
- `1`: Online / Generating
- `2`: Offline
- `3`: Fault / Alarm

### Plant Type (`stationTypeNew`):
- `0`: Grid-tied
- `1`: Energy Storage (Hybrid)
- `2`: AC-Coupled
- `3`: EPM (Grid + Meter)
- `6`/`7`: S5 Series Energy Storage
- `10`/`11`: S6 Series Energy Storage

---

## 4. Best Practices for Developers
1. **Never blast the API without caching**: SolisCloud rate limit is strict (2 requests/sec). Cache real-time responses for at least 60–120 seconds since inverter telemetry updates every 5 minutes on SolisCloud.
2. **Support Mock Mode**: When no live credentials are configured, return realistic simulated telemetry so frontend and MCP tools can be tested offline.
3. **Timezones**: Always supply the user's local timezone offset (e.g. `+7` for UTC+7).
