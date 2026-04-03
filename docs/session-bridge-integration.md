# Session Bridge Integration Guide

## For the Angular Back-Office Development Team

This document explains how to connect the AstrologyPro.com front-end platform with the existing Angular back-office system at `backofficeportal.divineinfinitebeing.com`. The two systems share sessions via signed JWT tokens so that diviners can seamlessly transition between the client-facing platform and the astrology/tarot tools.

---

## Overview

```
┌─────────────────────────┐        JWT Token         ┌──────────────────────────────────┐
│  AstrologyPro.com       │ ──────────────────────►  │  backofficeportal                │
│  (Next.js on Vercel)    │                           │  .divineinfinitebeing.com        │
│                         │                           │  (Angular on AWS)                │
│  - Client booking       │                           │                                  │
│  - Video session room   │   ◄── Screen sharing ──  │  - Chart calculations            │
│  - Payment processing   │       via Daily.co        │  - Tarot card software           │
│  - Client management    │                           │  - Western horoscope v2          │
└─────────────────────────┘                           └──────────────────────────────────┘
```

When a diviner starts a video session on AstrologyPro.com, the platform generates a signed JWT containing session data (including the client's birth data and questionnaire responses). The Angular back-office validates this JWT and uses the data to pre-populate the astrology/tarot tools.

---

## JWT Token Specification

### Algorithm: RS256 (RSA Signature with SHA-256)

### Token Payload

```json
{
  "iss": "astrologypro.com",
  "sub": "diviner_user_id_uuid",
  "aud": "backofficeportal.divineinfinitebeing.com",
  "exp": 1711900000,
  "iat": 1711899100,
  "jti": "unique_token_id_uuid",

  "session": {
    "id": "booking_uuid",
    "service_type": "natal-chart",
    "service_category": "astrology",
    "service_name": "Natal Chart Reading",
    "duration_minutes": 60,
    "scheduled_at": "2026-04-15T14:00:00-04:00",
    "daily_room_name": "astropro-session-abc123"
  },

  "diviner": {
    "id": "diviner_uuid",
    "username": "mysticmaya",
    "display_name": "Mystic Maya",
    "email": "maya@example.com",
    "is_astrologer": true,
    "is_tarotreader": true
  },

  "client": {
    "id": "client_uuid",
    "full_name": "John Smith",
    "email": "john@example.com",
    "phone": "+15551234567",
    "birth_data": {
      "date": "1990-06-15",
      "time": "14:30",
      "city": "New York, NY",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "timezone": "America/New_York"
    }
  },

  "questionnaire": {
    "focus_question": "I want to understand my career path and what opportunities are coming up.",
    "life_area": "career",
    "has_previous_reading": true,
    "additional_notes": "Specifically interested in the next 6 months.",
    "custom_responses": {
      "relationship_status": "single",
      "preferred_focus": "career_and_finance"
    }
  },

  "partner_birth_data": {
    "date": "1988-03-22",
    "time": "09:15",
    "city": "Los Angeles, CA",
    "latitude": 34.0522,
    "longitude": -118.2437,
    "timezone": "America/Los_Angeles"
  },

  "gift_certificate": {
    "code": "GIFT-ABC123",
    "amount_applied": 75.00,
    "purchaser_name": "Jane Doe"
  },

  "loyalty_discount": {
    "rule_name": "Loyal Client 10% Off",
    "discount_percent": 10,
    "sessions_completed": 5
  }
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `session.id` | UUID | Yes | Booking ID from AstrologyPro database |
| `session.service_type` | String | Yes | Service slug (e.g., "natal-chart", "solar-return", "10-card-celtic-cross") |
| `session.service_category` | String | Yes | "astrology" or "tarot" |
| `session.service_name` | String | Yes | Human-readable service name |
| `session.duration_minutes` | Integer | Yes | 30 or 60 |
| `session.scheduled_at` | ISO 8601 | Yes | Session start time with timezone |
| `session.daily_room_name` | String | Yes | Daily.co room identifier |
| `diviner.is_astrologer` | Boolean | Yes | Map to `is_astrologer` role in back-office |
| `diviner.is_tarotreader` | Boolean | Yes | Map to `is_tarotreader` role in back-office |
| `client.birth_data` | Object | Conditional | Required for astrology services where `requires_birth_data=true` |
| `client.birth_data.date` | String | Yes* | Format: YYYY-MM-DD |
| `client.birth_data.time` | String | Yes* | Format: HH:mm (24-hour) |
| `client.birth_data.city` | String | Yes* | City name as entered by client |
| `client.birth_data.latitude` | Float | Yes* | Geocoded latitude |
| `client.birth_data.longitude` | Float | Yes* | Geocoded longitude |
| `client.birth_data.timezone` | String | Yes* | IANA timezone (e.g., "America/New_York") |
| `questionnaire` | Object | Yes | Client's pre-session questionnaire responses |
| `questionnaire.focus_question` | String | Yes | Main question the client wants answered |
| `questionnaire.life_area` | String | Yes | "career", "love", "health", "spiritual", "general" |
| `questionnaire.has_previous_reading` | Boolean | Yes | Whether the client has had a reading with this diviner before |
| `questionnaire.additional_notes` | String | Optional | Free-text notes from the client (e.g., "Focus on the next 6 months") |
| `questionnaire.custom_responses` | Object | Optional | Answers to diviner-defined intake form questions (key = question ID, value = answer) |
| `partner_birth_data` | Object | Optional | Only present for relationship readings (synastry) |
| `gift_certificate` | Object | Optional | Present if the booking was paid with a gift certificate |
| `gift_certificate.code` | String | Yes* | The gift certificate code |
| `gift_certificate.amount_applied` | Number | Yes* | Dollar amount applied from the certificate |
| `gift_certificate.purchaser_name` | String | Yes* | Name of the person who purchased the gift |
| `loyalty_discount` | Object | Optional | Present if a loyalty discount was applied to the booking |
| `loyalty_discount.rule_name` | String | Yes* | Name of the discount rule (e.g., "Loyal Client 10% Off") |
| `loyalty_discount.discount_percent` | Number | Yes* | Percentage discount applied |
| `loyalty_discount.sessions_completed` | Number | Yes* | Number of sessions the client has completed with this diviner |

\* Required when the parent object is present

\* Required when the service has `requires_birth_data=true`

### Service Type Mapping to Back-Office Views

| Service Slug | Back-Office Route | Notes |
|-------------|-------------------|-------|
| `natal-chart` | `/horoscope?tab=western_horoscope_v2` | Pre-load with client birth data |
| `solar-return` | `/horoscope?tab=western_horoscope_v2` | Calculate solar return chart |
| `monthly-transit` | `/horoscope?tab=western_horoscope_v2` | Load transit overlay |
| `saturn-return` | `/horoscope?tab=western_horoscope_v2` | Saturn return calculation |
| `jupiter-return` | `/horoscope?tab=western_horoscope_v2` | Jupiter return calculation |
| `weekly-transits` | `/horoscope?tab=western_horoscope_v2` | Weekly transit overlay |
| `romantic-relationships` | `/horoscope?tab=western_horoscope_v2` | Load synastry with partner data |
| `friendship-relationships` | `/horoscope?tab=western_horoscope_v2` | Load synastry with partner data |
| `business-relationships` | `/horoscope?tab=western_horoscope_v2` | Load synastry with partner data |
| `horary` | `/horoscope?tab=western_horoscope_v2` | Use current time, not birth data |
| `astrology-freelance` | `/horoscope?tab=western_horoscope_v2` | Flexible, use birth data if present |
| `3-card-basic` | `/tarot-card/tarotCard3` | 3-card spread |
| `5-card-complex` | `/tarot-card/tarotCard3` | 5-card spread |
| `7-card-forecast` | `/tarot-card/tarotCard3` | 7-card spread |
| `7-card-horseshoe` | `/tarot-card/tarotCard3` | 7-card horseshoe |
| `10-card-relationship` | `/tarot-card/tarotCard3` | 10-card spread |
| `10-card-celtic-cross` | `/tarot-card/tarotCard3` | Celtic cross layout |
| `12-card-astrological` | `/tarot-card/tarotCard3` | 12-card astrological |
| `tarot-freelance` | `/tarot-card/tarotCard3` | Flexible |

---

## Authentication Flow

### 1. Token Generation (AstrologyPro side)

When a diviner clicks "Start Session" in the video room:

```
POST /api/bridge/session-token
Body: { bookingId: "uuid" }
Response: { token: "eyJ...", expiresAt: "2026-04-15T15:15:00Z" }
```

The token is signed with AstrologyPro's **private RSA key** (RS256).

### 2. Token Delivery

The token is delivered to the Angular back-office via one of two methods:

**Method A: URL Parameter (Recommended for iframe embed)**
```
https://backofficeportal.divineinfinitebeing.com/session?token=eyJ...
```

**Method B: postMessage (Recommended for screen sharing mode)**
```javascript
// In AstrologyPro's video session page
const iframe = document.getElementById('backoffice-iframe');
iframe.contentWindow.postMessage({
  type: 'ASTROPRO_SESSION_TOKEN',
  token: 'eyJ...'
}, 'https://backofficeportal.divineinfinitebeing.com');
```

### 3. Token Verification (Angular side)

The Angular back-office must:

1. Fetch AstrologyPro's public key from:
   ```
   GET https://astrologypro.com/api/bridge/.well-known/jwks.json
   ```
   Response:
   ```json
   {
     "keys": [{
       "kty": "RSA",
       "kid": "astropro-2026",
       "use": "sig",
       "alg": "RS256",
       "n": "...",
       "e": "AQAB"
     }]
   }
   ```

2. Verify the JWT signature using the public key
3. Check `exp` (token must not be expired — 15 min validity)
4. Check `aud` matches "backofficeportal.divineinfinitebeing.com"
5. Check `iss` matches "astrologypro.com"
6. Extract session data and pre-populate tools

### Example Angular Verification (using `jose` library)

```typescript
import * as jose from 'jose';

async function verifySessionToken(token: string) {
  // Fetch JWKS from AstrologyPro
  const JWKS = jose.createRemoteJWKSet(
    new URL('https://astrologypro.com/api/bridge/.well-known/jwks.json')
  );

  // Verify token
  const { payload } = await jose.jwtVerify(token, JWKS, {
    issuer: 'astrologypro.com',
    audience: 'backofficeportal.divineinfinitebeing.com',
  });

  return payload;
}

// Usage in Angular component
async onSessionStart(token: string) {
  try {
    const session = await verifySessionToken(token);

    // Pre-populate birth data into the chart calculator
    if (session.client?.birth_data) {
      this.chartService.setBirthData({
        date: session.client.birth_data.date,
        time: session.client.birth_data.time,
        latitude: session.client.birth_data.latitude,
        longitude: session.client.birth_data.longitude,
        timezone: session.client.birth_data.timezone,
      });
    }

    // Route to correct tool based on service type
    const route = this.getBackOfficeRoute(session.session.service_type);
    this.router.navigate([route]);

    // Display questionnaire responses for diviner reference
    this.sessionPanel.showClientInfo({
      name: session.client.full_name,
      question: session.questionnaire.focus_question,
      lifeArea: session.questionnaire.life_area,
      notes: session.questionnaire.additional_notes,
    });

  } catch (error) {
    console.error('Invalid session token:', error);
    this.showError('Session authentication failed');
  }
}
```

---

## CORS Configuration

The Angular back-office must allow requests from AstrologyPro:

```
Access-Control-Allow-Origin: https://astrologypro.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Data Flow During a Session

```
1. Client books session on AstrologyPro.com
   └─ Birth data + questionnaire saved to Supabase

2. Session starts (video room on AstrologyPro)
   └─ AstrologyPro generates signed JWT with all client data
   └─ JWT sent to Angular back-office via iframe/postMessage

3. Angular back-office receives JWT
   └─ Verifies signature against JWKS endpoint
   └─ Extracts birth data → pre-populates chart calculator
   └─ Extracts questionnaire → displays to diviner
   └─ Routes to correct tool (horoscope or tarot)

4. Diviner screen-shares the Angular back-office
   └─ Daily.co handles screen share in the video session
   └─ Client sees the charts/cards on AstrologyPro video room

5. Session ends
   └─ AstrologyPro calculates final duration + overage
   └─ Recording saved and shared with client
```

---

## Testing

### Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Astrologer | testastrologer.divine@yopmail.com | (existing back-office password) |
| Tarot Reader | testtarot.divine@yopmail.com | (existing back-office password) |

### Test Token Endpoint

For development, AstrologyPro provides a test token generator:

```
POST https://astrologypro.com/api/bridge/test-token
Headers: { "X-Test-Secret": "your-test-secret" }
Body: {
  "divinerId": "test-diviner-uuid",
  "serviceType": "natal-chart",
  "clientBirthDate": "1990-06-15",
  "clientBirthTime": "14:30",
  "clientBirthCity": "New York, NY"
}
Response: { "token": "eyJ..." }
```

This test endpoint is only available in development/staging environments.

---

## Error Handling

| Error | HTTP Code | Action |
|-------|-----------|--------|
| Token expired | 401 | Request new token from AstrologyPro |
| Invalid signature | 401 | Check JWKS endpoint is reachable |
| Missing birth data | 200 (partial) | Show empty chart form, let diviner enter manually |
| Missing questionnaire | 200 (partial) | Skip questionnaire panel |
| Back-office unavailable | 503 | Show "Tools loading..." message in video room |

---

## Security Considerations

1. **Token lifetime**: 15 minutes max. After expiry, the diviner can request a refresh from the video session room.
2. **One-time use**: Each token has a unique `jti` (JWT ID). The Angular app should track used `jti` values and reject replays within the expiry window.
3. **Birth data sensitivity**: Birth data is PII. The Angular app should not log or persist the JWT payload beyond the session duration. Clear session data when the browser tab closes.
4. **HTTPS only**: All communication between the two systems must be over HTTPS.
5. **Key rotation**: JWKS endpoint supports multiple keys via `kid` (Key ID). AstrologyPro will announce key rotations 30 days in advance.

---

## Webhook Notifications (AstrologyPro -> Angular Back-Office)

AstrologyPro can send webhook notifications to the Angular back-office when session lifecycle events occur. This allows the back-office to react to session state changes (e.g., clean up resources, log session activity, trigger post-session workflows).

### Configuration

The Angular back-office must expose a webhook endpoint and share its URL with the AstrologyPro team. AstrologyPro will configure it as the `BRIDGE_WEBHOOK_URL` environment variable.

### Webhook Events

#### `session.started`

Sent when a diviner joins the video room and the session timer begins.

```json
{
  "event": "session.started",
  "timestamp": "2026-04-15T14:00:05Z",
  "data": {
    "booking_id": "booking_uuid",
    "diviner_id": "diviner_uuid",
    "client_id": "client_uuid",
    "service_type": "natal-chart",
    "service_category": "astrology",
    "daily_room_name": "astropro-session-abc123",
    "scheduled_duration_minutes": 60
  }
}
```

#### `session.ended`

Sent when the diviner ends the session. Includes actual duration and overage information.

```json
{
  "event": "session.ended",
  "timestamp": "2026-04-15T15:05:23Z",
  "data": {
    "booking_id": "booking_uuid",
    "diviner_id": "diviner_uuid",
    "client_id": "client_uuid",
    "service_type": "natal-chart",
    "actual_duration_minutes": 65,
    "scheduled_duration_minutes": 60,
    "overage_minutes": 5,
    "session_notes_present": true,
    "recording_available": false
  }
}
```

#### `recording.ready`

Sent when the session recording has been processed and is available for download.

```json
{
  "event": "recording.ready",
  "timestamp": "2026-04-15T15:35:00Z",
  "data": {
    "booking_id": "booking_uuid",
    "diviner_id": "diviner_uuid",
    "recording_share_id": "abc123XYZ456",
    "recording_url": "https://astrologypro.com/session/abc123XYZ456/recording"
  }
}
```

### Webhook Authentication

All webhook requests include an HMAC-SHA256 signature in the `X-AstroPro-Signature` header. The signature is computed over the raw request body using a shared secret.

```
X-AstroPro-Signature: sha256=<hex-encoded HMAC>
```

Verification in Node.js/TypeScript:

```typescript
import { createHmac } from 'crypto';

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  return signature === expected;
}
```

### Webhook Retry Policy

- AstrologyPro will retry failed webhooks (non-2xx response) up to 3 times
- Retry intervals: 1 minute, 5 minutes, 30 minutes
- After 3 failures, the event is logged and no further retries are attempted
- The Angular back-office should respond with HTTP 200 within 10 seconds

### Idempotency

Each webhook includes a unique `event_id` in the request headers:

```
X-AstroPro-Event-ID: evt_unique_id
```

The Angular back-office should track received event IDs and skip duplicates, in case a retry arrives after a delayed successful delivery.

---

## Quick Start Guide

For a streamlined integration walkthrough with copy-paste Angular/TypeScript code, see `SESSION-BRIDGE-QUICKSTART.md`.

---

## Contact

For integration questions, contact the AstrologyPro development team.
JWKS endpoint: `https://astrologypro.com/api/bridge/.well-known/jwks.json`
Test environment: `https://staging.astrologypro.com`
