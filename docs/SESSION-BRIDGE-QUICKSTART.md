# Session Bridge Quick Start -- Angular Team

This is a streamlined guide for integrating the Angular back-office with AstrologyPro's session bridge. For the full specification, see `session-bridge-integration.md`.

---

## What This Does

When a diviner starts a video session on AstrologyPro, the platform generates a signed JWT containing the client's birth data, questionnaire responses, and session details. Your Angular app needs to:

1. Receive the JWT
2. Verify it
3. Use the data to pre-populate the correct chart/tarot tool

---

## 3 Steps to Integrate

### Step 1: Install the `jose` Library

```bash
npm install jose
```

### Step 2: Create the Token Verification Service

Create `src/app/services/session-bridge.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import * as jose from 'jose';

// Types for the JWT payload
export interface SessionBridgePayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  jti: string;

  session: {
    id: string;
    service_type: string;      // e.g., "natal-chart", "10-card-celtic-cross"
    service_category: string;  // "astrology" or "tarot"
    service_name: string;
    duration_minutes: number;
    scheduled_at: string;      // ISO 8601
    daily_room_name: string;
  };

  diviner: {
    id: string;
    username: string;
    display_name: string;
    email: string;
    is_astrologer: boolean;
    is_tarotreader: boolean;
  };

  client: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    birth_data?: {
      date: string;       // "YYYY-MM-DD"
      time: string;       // "HH:mm" (24-hour)
      city: string;
      latitude: number;
      longitude: number;
      timezone: string;   // IANA, e.g., "America/New_York"
    };
  };

  questionnaire: {
    focus_question: string;
    life_area: string;         // "career", "love", "health", "spiritual", "general"
    has_previous_reading: boolean;
    additional_notes?: string;
    custom_responses?: Record<string, string>;
  };

  partner_birth_data?: {
    date: string;
    time: string;
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };

  // Optional: present if booking used a gift certificate
  gift_certificate?: {
    code: string;
    amount_applied: number;
    purchaser_name: string;
  };

  // Optional: present if a loyalty discount was applied
  loyalty_discount?: {
    rule_name: string;
    discount_percent: number;
    sessions_completed: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SessionBridgeService {
  private jwksUrl = 'https://astrologypro.com/api/bridge/.well-known/jwks.json';
  private usedTokens = new Set<string>(); // Replay protection

  async verifyToken(token: string): Promise<SessionBridgePayload> {
    // 1. Create remote JWKS client
    const JWKS = jose.createRemoteJWKSet(new URL(this.jwksUrl));

    // 2. Verify signature, issuer, audience, and expiration
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: 'astrologypro.com',
      audience: 'backofficeportal.divineinfinitebeing.com',
    });

    // 3. Replay protection: reject reused tokens
    const jti = payload.jti as string;
    if (this.usedTokens.has(jti)) {
      throw new Error('Token has already been used');
    }
    this.usedTokens.add(jti);

    return payload as unknown as SessionBridgePayload;
  }

  // Map service_type to the correct back-office route
  getRoute(serviceType: string): string {
    const tarotTypes = [
      '3-card-basic', '5-card-complex', '7-card-forecast',
      '7-card-horseshoe', '10-card-relationship', '10-card-celtic-cross',
      '12-card-astrological', 'tarot-freelance',
    ];

    if (tarotTypes.includes(serviceType)) {
      return '/tarot-card/tarotCard3';
    }

    // All astrology types go to western horoscope v2
    return '/horoscope?tab=western_horoscope_v2';
  }
}
```

### Step 3: Handle the Incoming Token

There are two ways the token arrives. Implement whichever matches your setup:

**Option A: URL parameter (for iframe embedding)**

In your route guard or session component:

```typescript
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionBridgeService, SessionBridgePayload } from '../services/session-bridge.service';

@Component({
  selector: 'app-session-receiver',
  template: `
    <div *ngIf="loading">Authenticating session...</div>
    <div *ngIf="error" class="error">{{ error }}</div>
    <div *ngIf="session">
      <h2>Session with {{ session.client.full_name }}</h2>
      <p>Question: {{ session.questionnaire.focus_question }}</p>
      <p>Life area: {{ session.questionnaire.life_area }}</p>
      <p *ngIf="session.questionnaire.additional_notes">
        Notes: {{ session.questionnaire.additional_notes }}
      </p>
      <!-- The chart/tarot tool will be loaded via routing -->
    </div>
  `
})
export class SessionReceiverComponent implements OnInit {
  session: SessionBridgePayload | null = null;
  loading = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bridge: SessionBridgeService,
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error = 'No session token provided';
      this.loading = false;
      return;
    }

    try {
      this.session = await this.bridge.verifyToken(token);

      // Pre-populate birth data into the chart calculator
      if (this.session.client.birth_data) {
        this.chartService.setBirthData({
          date: this.session.client.birth_data.date,
          time: this.session.client.birth_data.time,
          latitude: this.session.client.birth_data.latitude,
          longitude: this.session.client.birth_data.longitude,
          timezone: this.session.client.birth_data.timezone,
        });
      }

      // If synastry/relationship reading, also load partner data
      if (this.session.partner_birth_data) {
        this.chartService.setPartnerBirthData({
          date: this.session.partner_birth_data.date,
          time: this.session.partner_birth_data.time,
          latitude: this.session.partner_birth_data.latitude,
          longitude: this.session.partner_birth_data.longitude,
          timezone: this.session.partner_birth_data.timezone,
        });
      }

      // Route to the correct tool
      const route = this.bridge.getRoute(this.session.session.service_type);
      this.router.navigateByUrl(route);

    } catch (err: any) {
      this.error = `Authentication failed: ${err.message}`;
    } finally {
      this.loading = false;
    }
  }
}
```

**Option B: postMessage (for screen sharing mode)**

In `app.component.ts` or a global listener:

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { SessionBridgeService } from './services/session-bridge.service';

@Component({ selector: 'app-root', templateUrl: './app.component.html' })
export class AppComponent implements OnInit, OnDestroy {
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor(private bridge: SessionBridgeService, private router: Router) {}

  ngOnInit() {
    this.messageHandler = async (event: MessageEvent) => {
      // Only accept messages from AstrologyPro
      if (event.origin !== 'https://astrologypro.com') return;
      if (event.data?.type !== 'ASTROPRO_SESSION_TOKEN') return;

      try {
        const session = await this.bridge.verifyToken(event.data.token);

        // Pre-populate tools and navigate (same as Option A)
        if (session.client.birth_data) {
          this.chartService.setBirthData(session.client.birth_data);
        }

        const route = this.bridge.getRoute(session.session.service_type);
        this.router.navigateByUrl(route);

      } catch (err) {
        console.error('Session bridge error:', err);
      }
    };

    window.addEventListener('message', this.messageHandler);
  }

  ngOnDestroy() {
    if (this.messageHandler) {
      window.removeEventListener('message', this.messageHandler);
    }
  }
}
```

---

## How to Extract and Use Birth Data

The `client.birth_data` object contains everything needed to compute a natal chart:

```typescript
const bd = session.client.birth_data;

// For your chart calculation engine:
const chartInput = {
  year: parseInt(bd.date.split('-')[0]),   // 1990
  month: parseInt(bd.date.split('-')[1]),  // 6
  day: parseInt(bd.date.split('-')[2]),    // 15
  hour: parseInt(bd.time.split(':')[0]),   // 14
  minute: parseInt(bd.time.split(':')[1]), // 30
  latitude: bd.latitude,                   // 40.7128
  longitude: bd.longitude,                 // -74.0060
  timezone: bd.timezone,                   // "America/New_York"
};
```

For relationship readings (synastry, composite), `partner_birth_data` uses the exact same structure.

**Important:** `birth_data` is only present when the service has `requires_birth_data = true`. For tarot-only and horary readings, it may be `null`. Your UI should handle this gracefully -- show an empty form that the diviner can fill in manually.

---

## How to Route to the Correct Tool

The `session.service_type` slug maps to back-office routes:

| Service Type | Category | Route |
|-------------|----------|-------|
| `natal-chart` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `solar-return` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `monthly-transit` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `saturn-return` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `jupiter-return` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `weekly-transits` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `romantic-relationships` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `friendship-relationships` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `business-relationships` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `horary` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `astrology-freelance` | astrology | `/horoscope?tab=western_horoscope_v2` |
| `3-card-basic` | tarot | `/tarot-card/tarotCard3` |
| `5-card-complex` | tarot | `/tarot-card/tarotCard3` |
| `7-card-forecast` | tarot | `/tarot-card/tarotCard3` |
| `7-card-horseshoe` | tarot | `/tarot-card/tarotCard3` |
| `10-card-relationship` | tarot | `/tarot-card/tarotCard3` |
| `10-card-celtic-cross` | tarot | `/tarot-card/tarotCard3` |
| `12-card-astrological` | tarot | `/tarot-card/tarotCard3` |
| `tarot-freelance` | tarot | `/tarot-card/tarotCard3` |

**Quick check:** If `session.service_category === 'tarot'`, route to tarot. Otherwise route to horoscope.

---

## Questionnaire Data

The `questionnaire` object provides context the diviner needs during the reading:

```typescript
interface Questionnaire {
  focus_question: string;     // "I want to understand my career path"
  life_area: string;          // "career" | "love" | "health" | "spiritual" | "general"
  has_previous_reading: boolean;
  additional_notes?: string;  // "Specifically interested in the next 6 months"
  custom_responses?: Record<string, string>;  // Diviner-defined intake form answers
}
```

Display this in a sidebar panel so the diviner can reference it during the session. The `custom_responses` field contains answers to any custom questions the diviner configured in their intake form (key = question ID, value = answer).

---

## Test Endpoint for Development

AstrologyPro provides a test token generator for development:

```bash
curl -X POST https://astrologypro.com/api/bridge/test-token \
  -H "Content-Type: application/json" \
  -H "X-Test-Secret: your-test-secret" \
  -d '{
    "divinerId": "test-diviner-uuid",
    "serviceType": "natal-chart",
    "clientBirthDate": "1990-06-15",
    "clientBirthTime": "14:30",
    "clientBirthCity": "New York, NY"
  }'
```

Response:
```json
{ "token": "eyJhbGciOiJSUzI1NiI..." }
```

Use this token to test your verification flow without running a real session. This endpoint is only available on staging (`https://staging.astrologypro.com`).

---

## CORS Configuration

Your Angular app must allow requests from AstrologyPro. Add to your server/proxy config:

```
Access-Control-Allow-Origin: https://astrologypro.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

---

## Troubleshooting

### "Invalid signature" error

- **Cause:** The JWKS endpoint is unreachable or returning stale keys.
- **Fix:** Verify you can fetch `https://astrologypro.com/api/bridge/.well-known/jwks.json` from your server. Check for network/firewall issues. The `jose` library caches JWKS, so a stale cache can cause issues after key rotation.

### "Token expired" error

- **Cause:** The JWT has a 15-minute lifetime. If the Angular app receives it more than 15 minutes after generation, it will be expired.
- **Fix:** This is expected. The diviner can refresh the token from the AstrologyPro video session room. Your app should show a message like "Session token expired. Please refresh from AstrologyPro."

### Birth data is missing

- **Cause:** The service does not require birth data (e.g., tarot readings, horary astrology).
- **Fix:** Show an empty birth data form so the diviner can manually enter it if needed. Check `session.service_category` -- tarot services rarely have birth data.

### Token works once but fails on retry

- **Cause:** Replay protection. Each token has a unique `jti` and should only be used once.
- **Fix:** Each new session action generates a fresh token. Do not cache or reuse tokens.

### postMessage not received

- **Cause:** Origin check is failing, or the listener is not set up before the message is sent.
- **Fix:** Verify `event.origin` matches exactly `https://astrologypro.com` (no trailing slash). Ensure the listener is registered in `ngOnInit` before the iframe/tab sends the message.

### Custom questionnaire responses are empty

- **Cause:** The diviner has not configured custom intake form questions.
- **Fix:** `custom_responses` is optional. Only display it if present and non-empty. The standard `focus_question`, `life_area`, and `additional_notes` fields are always present.

---

## Security Reminders

1. **Token lifetime is 15 minutes.** Do not cache tokens beyond their expiration.
2. **Each token has a unique `jti`.** Track used JTI values and reject replays within the expiry window.
3. **Birth data is PII.** Do not log or persist the JWT payload beyond the session duration. Clear session data when the tab closes.
4. **HTTPS only.** All communication must be over HTTPS.
5. **Key rotation.** AstrologyPro will announce JWKS key rotations 30 days in advance. The JWKS endpoint supports multiple keys via `kid`.
