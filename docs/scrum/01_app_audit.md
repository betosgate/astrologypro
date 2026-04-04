# Angular App — Technical Audit
## `divine-infinite-being-angular-ui`

> Audited: 2026-04-03 | Angular 16.1.0 | Angular Material 16.1.3

---

## 1. Project Identity

| Field | Value |
|---|---|
| Package name | `divine-infinite-being-angular-ui` |
| Framework | Angular 16.1.0 |
| UI Library | Angular Material 16.1.3 + CDK 16.1.3 |
| Language | TypeScript (ES2022) |
| State management | Service-based RxJS + DataServiceService (BehaviorSubject store) |
| Auth storage | Cookies (`login_user_details` via ngx-cookie-service) |
| Build output | `dist/divine-infinite-being-angular-ui/` |
| Deployment | AWS S3 + CloudFront |

---

## 2. Environments

| Env | API Base | Frontend | Notes |
|---|---|---|---|
| Local | `http://localhost:3522/` (commented out) | `http://localhost:4200/` | Dev only |
| Development | `https://d36fwfwo4vnk9h.cloudfront.net/` | `https://dev.divineinfinitebeing.com/` | CloudFront CDN |
| Production (main) | `https://api.divineinfinitebeing.com/` | `https://www.backofficeportal.divineinfinitebeing.com/` | Direct API |

**Other environment variables:**

| Variable | Value / Purpose |
|---|---|
| `api_url_lambda` | `https://a0ef6m9zyg.execute-api.us-west-1.amazonaws.com/prod/` — Lambda fallback |
| `new_astrology_api_url` | `https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws` — AI astrology Lambda |
| `astrology_api_url` | `https://json.astrologyapi.com/v1/` — External astrology API |
| `confarence_room_base_url` | `https://main.d1njtuljco40va.amplifyapp.com` — Amplify-hosted conference room UI |
| `image_base_url` | `https://all-frontend-assets.s3.amazonaws.com` — S3 asset CDN |
| `stripe_pub_key` | pk_live_... (production Stripe publishable key) |
| `positionstack_api_key` | `f94b49d3a2592c82286e616abcb1b45d` — Location/geocoding |
| `free_astrology_api_keys` | Array of rotation keys for rate-limit handling |
| `sequencial_lock` | `true` — sequential API lock flag |
| `environment_name` | `main` / `development` |

**External API endpoints (hardcoded, not in environment):**

| Service | URL |
|---|---|
| Calendar Lambda | `https://i526y91jwg.execute-api.us-east-2.amazonaws.com/dev/` |
| Calendar Lambda (alt) | `https://m9mkuic6o9.execute-api.us-east-1.amazonaws.com/dev/` |
| VideoSDK | `https://api.videosdk.live/v2/rooms` |
| PositionStack | `http://api.positionstack.com/v1/forward` |

---

## 3. Third-Party Libraries

| Library | Purpose | Status |
|---|---|---|
| `@angular/material` 16.1.3 | UI components (dialogs, snackbars, forms) | ✅ Active |
| `@stripe/stripe-js` ^7.1.0 | Stripe payment integration | ✅ Active |
| `ngx-cookie-service` ^16.0.0 | Cookie-based auth storage | ✅ Active |
| `ngx-material-timepicker` | Time picker UI | ✅ Active |
| `ngx-image-cropper` | Profile image cropping | ✅ Active |
| `ngx-uploader` | File upload handling | ✅ Active |
| `ng2-ckeditor` ^1.3.7 | Rich text editor for content management | ✅ Active |
| `listing-angular15` ^0.0.44 | Private custom data table library | ✅ Active |
| `gsap` ^3.12.5 | Animation library | ✅ Active |
| `swiper` ^12.0.2 | Carousel/slider | ✅ Active |
| `three` ^0.167.1 | 3D graphics for astrology aspect visualization | ✅ Active |
| `turn-js` ^0.5.4 | Page-flip book effect | ✅ Active |
| `moment` ^2.29.4 | Date/time manipulation | ✅ Active |
| `moment-timezone` ^0.5.43 | Timezone support | ✅ Active |
| `rxjs` ^7.8.0 | Reactive programming | ✅ Active |

---

## 4. Application Architecture

### Module Structure

```
AppModule (root)
├── SharedModule            ← Headers, footer, tarot spreads, common modals
├── AppRoutingModule        ← Root routes
│
├── [Lazy] AdminDashboardModule
│   ├── [Lazy] TrainingModule
│   │   ├── [Lazy] QuizModule
│   │   └── [Lazy] AssignmentModule
│   ├── [Lazy] RoleModule → [Lazy] RoleAddModuleModule
│   ├── [Lazy] PackageModule → [Lazy] PackageAddModule
│   ├── [Lazy] WebinerModule
│   ├── [Lazy] SocialAdvoModule → [Lazy] SocialAdvoAddModule
│   ├── [Lazy] RitualInvocationModule
│   ├── [Lazy] TarotSpreadsModule → [Lazy] TarotSpreadAddModule, [Lazy] TarotcardModule
│   ├── [Lazy] PaymentModule
│   ├── [Lazy] ReportModule
│   ├── [Lazy] ClassConfigurationModule
│   ├── [Lazy] SpiritualWisdomModule
│   ├── [Lazy] ContentManagementModule
│   ├── [Lazy] CalenderOfEventsModule
│   ├── [Lazy] RefundRequestModule
│   ├── [Lazy] WheelSignModule
│   └── [Lazy] OrdersModule
│
├── [Lazy] AstrologerDashboardModule
│   ├── [Lazy] AstroworkModule
│   ├── [Lazy] CalendarModule
│   ├── [Lazy] TrainingCenterModule
│   ├── [Lazy] TestimonialModule
│   └── [Lazy] ProfileModule
│
├── [Lazy] CustomerdashboardModule
│   ├── [Lazy] SocialAdvoModule
│   └── [Lazy] ProfileModule (shared)
│
├── [Lazy] MysterySchoolModule
├── [Lazy] PerennialMandalismModule
├── [Lazy] AffiliateDashboardModule
├── [Lazy] DivinerModule
├── [Lazy] RecordedSessionModule
├── [Lazy] ConfarenceRoomModule
├── [Lazy] HorosceopModule
├── [Lazy] ShopModule
├── [Lazy] ProductModule
├── [Lazy] CalenderModule (public calendar)
├── [Lazy] UserProfileModule
├── [Lazy] TarotCardModule
├── [Lazy] MyAccountModule
├── [Lazy] SignupModule
├── [Lazy] VerificationModule
├── [Lazy] ForgetPasswordModule
└── [Lazy] ResetPasswordModule
```

### Service Architecture

```
Services
├── ApiservicesService     ← Centralised HTTP client; handles all API calls, auth injection, retry logic
├── AuthService            ← Role detection, cookie reads, route mapping by user_type
├── AuthGuardService       ← CanActivate; subscription status checks, Stripe modal triggers
├── ResolveService         ← Route data pre-loader (Resolve<any>) — 100+ URL patterns
├── DataServiceService     ← BehaviorSubject key-value store (shared state between components)
├── AstroService           ← Zodiac decan data; getCurrentAstroPosition()
├── CommonService          ← navigateToPath() wrapper
├── LocationService        ← PositionStack geocoding API calls
├── LoaderService          ← Global loading state (isLoading$ BehaviorSubject)
├── ThreeService           ← THREE.js 3D sphere visualization for astrological aspects
└── IngressIkonService     ← SVG icon map for planets and zodiac signs
```

### Authentication Flow

```
User → LoginComponent (POST user/login)
         ↓
       API sets "login_user_details" cookie (JSON with token + userinfo)
         ↓
       AuthGuardService reads cookie → checks user_type
         ↓
       is_admin                      → /admin-dashboard
       is_astrologer                 → /astrologer-dashboard
       is_tarotreader                → /astrologer-dashboard
       is_astrologer_tarotreader     → /astrologer-dashboard
       is_social_advo                → /customer-dashboard
       is_customer                   → /customer-dashboard
       is_customer_socialadvo        → /customer-dashboard
       is_Perennial_Mandalism        → /perennial-mandalism-dashboard
       is_mystery_school (flag=1)    → /mystery-school-dashboard
       is_diviner (flag=1)           → /diviner
       is_trainee                    → recognised as logged in
```

### Subscription Guard Logic

```
AuthGuardService.canActivate()
  ↓
  Route = mystery-school-dashboard?
    → check userinfo.mystery_school_status === 'subscription running'
    → if not: POST stripe/create-subscription-mystery-school
              → open MysteryStripeModal
  ↓
  Route = perennial-mandalism-dashboard?
    → check userinfo.is_perennial_mandalism === 1
    → check userinfo.perennial_mandalism_status === 'subscription running'
    → if not: POST cart_management/subscription-payment
              → open PerennialStripeModal
```

---

## 5. Cookie & Session Shape

### `login_user_details` (ngx-cookie-service)

```json
{
  "token": "JWT_TOKEN",
  "userinfo": {
    "_id": "mongo_object_id",
    "user_type": "is_admin | is_astrologer | is_tarotreader | is_astrologer_tarotreader | is_social_advo | is_customer | is_customer_socialadvo | is_Perennial_Mandalism | is_trainee",
    "is_perennial_mandalism": 0,
    "is_mystery_school": 0,
    "is_diviner": 0,
    "mystery_school_status": "subscription running | ...",
    "mystery_subscription_id": "stripe_sub_id",
    "perennial_mandalism_status": "subscription running | ...",
    "perennial_subscription_id": "stripe_sub_id",
    "email": "user@email.com",
    "username": "username"
  }
}
```

---

## 6. Routing Map

### Root Routes

| Path | Component/Module | Guard | Notes |
|---|---|---|---|
| `` (root) | LoginComponent | AuthGuardService | Redirects if logged in |
| `/force-password-change` | ForcePasswordChangeComponent | - | Forced on first login |
| `/change-password` | ChangePasswordComponent | AuthGuardService | Self-service password change |
| `/forget-password` | ForgetPasswordModule | - | Lazy |
| `/reset-password` | ResetPasswordModule | - | Lazy |
| `/verification` | VerificationModule | - | OTP verification after signup |
| `/signup` | SignupModule | - | Multi-step user registration |
| `/admin-dashboard/**` | AdminDashboardModule | AuthGuardService | Lazy |
| `/astrologer-dashboard/**` | AstrologerDashboardModule | AuthGuardService | Lazy |
| `/astrologer-tarot-signup` | AstroTarotSignupModule | - | Lazy |
| `/customer-signup` | CustomerSignupModule | - | Lazy |
| `/customer-dashboard/**` | CustomerdashboardModule | AuthGuardService | Lazy |
| `/horoscope` | HorosceopModule | - | Lazy, public |
| `/horoscope-share` | HorosceopModule | - | Lazy, public |
| `/my-account/**` | MyAccountModule | - | Lazy |
| `/testimonial` | TestimonialsModule | - | Lazy |
| `/tarot-card/**` | TarotCardModule | AuthGuardService | Lazy, 9 spread routes |
| `/showcasespread` | ShowcasespreadModule | AuthGuardService | Lazy |
| `/profile/:unique_name` | UserProfileModule | - | Public profile pages |
| `/profile/:unique_name/:id` | UserProfileModule | - | Public profile with product ID |
| `/sharespread` | SharespreadModule | - | Lazy |
| `/shop/**` | ShopModule | - | Lazy |
| `/calender/**` | CalenderModule | - | Lazy, public calendar |
| `/product/**` | ProductModule | - | Lazy |
| `/perennial-mandalism-dashboard/**` | PerennialMandalismModule | AuthGuardService | Lazy, subscription-gated |
| `/divination-certification-dashboard/**` | DivinationCertificationModule | AuthGuardService | Lazy |
| `/mystery-school-dashboard/**` | MysterySchoolModule | AuthGuardService | Lazy, subscription-gated |
| `/diviner/**` | DivinerModule | - | Lazy |
| `/affiate-dashboard/**` | AffiliateDashboardModule | - | Lazy |
| `/blog-manegement/**` | BlogManagementRoutingModuleModule | - | Lazy |
| `/video-management/**` | VideoManagementModule | - | Lazy |
| `/brod-casting/**` | BrodCastingModule | - | Lazy |
| `/confarence-room/**` | ConfarenceRoomModule | - | Lazy |
| `/recorded-session/**` | RecordedSessionModule | AuthGuardService | Lazy |
| `/mysteryschool-signup/:_id` | MysterySchoolSignupComponent | - | Direct + resolver |
| `/ingress-chart-details/:_id` | IngressChartDetailComponent | - | Direct + resolver |
| `/perennial-stripe-success-page` | PerennialSubscriptionSuccessComponent | - | Stripe success |
| `/mystery-stripe-success-page` | MysterySubscriptionSuccessComponent | - | Stripe success |
| `/customer/**` | CustomerModule | - | Lazy |
| `/ingress-details/:_id` | IngressDetailsComponent | - | Direct |
| `/ingresscharts` | IngresschartsComponent | - | Direct |
| `/ingress-charts-list` | IngressChartsListComponent | - | Direct |
| `**` | LoginComponent | AuthGuardService | Wildcard 404 |

---

## 7. API Contract

### Standard Request Body

```json
{
  "condition": { "limit": 10, "skip": 0 },
  "searchcondition": {},
  "sort": { "type": "desc", "field": "created_at" },
  "project": {},
  "token": ""
}
```

### Standard Response

```json
{
  "status": "success",
  "message": "successful",
  "results": { "res": [], "count": 0 }
}
```

### API Namespace Summary

| Namespace | Controller |
|---|---|
| `user/*` | User management, auth, membership |
| `user-profile/*` | Public profile data |
| `admin/*` | Admin-only: roles, training CRUD, lesson/quiz |
| `training-centre/*` | Training progress, assignments |
| `package/*` | Service packages |
| `subscription/*` | Subscription management |
| `stripe/*` | Stripe payment, transactions |
| `cart_management/*` | Cart, orders, subscription payments |
| `cart/*` | Cart data, counts |
| `payment/*` | Payment records |
| `refund-processing/*` | Refund workflow |
| `refund-activity/*` | Refund activity log |
| `tarot-spreads/*` | Tarot spread templates + card management |
| `tarot-readings/*` | Reading session records |
| `wheel_signs/*` | Wheel signs, decan info, journals |
| `ritual-invocation/*` | Ritual data |
| `content/*` | Perennial mandalism content |
| `event/*` | Calendar events |
| `social-advo/*` | Social advocacy content |
| `spiritual-wishdom/*` | Spiritual wisdom content |
| `notes/*` | Per-customer notes |
| `webinar/*` | Webinar management |
| `conference-room/*` | Video conference sessions |
| `product-category/*` | Product categories |
| `product-management/*` | Product management (Printify sync) |
| `order/*` | Order management |
| `quatermanagement/*` | Quarters, class configuration |
| `report/*` | Analytics reports |
| `ingress-charts/*` | Ingress chart data |
| `videogallery/*` | Video gallery management |
| `googleapi/*` | Google Calendar (via external Lambda) |

---

## 8. Known Issues / Technical Debt

| Issue | Location | Impact |
|---|---|---|
| AWS credentials hardcoded | `divine-infinite-being-nest-api/config/configuration.ts` | Critical security risk |
| Stripe/API keys in config files | Backend config + frontend env | Security |
| `bypassSecurityTrustHtml` in multiple pipes | `safe-html.pipe.ts`, `astro-header-modifier-pipe.ts`, `global-header-returner.pipe.ts`, `ingress-icon-pipe.pipe.ts` | XSS vectors |
| JWT token hardcoded in service | `three.service.ts` | Security |
| Naming typos throughout | `confarence` (conference), `menber` (member), `brod-casting` (broadcasting), `terrot` (tarot), `webiner` (webinar), `gernal` (general), `perenial` (perennial), `wishdom` (wisdom) | Maintainability |
| All HTTP via single service | `apiservices.service.ts` | Tight coupling |
| No global error interceptor | Throughout | Silent failures |
| No centralized state (NgRx) | Throughout | Ad-hoc prop drilling |
| Three.js potentially unused in main app | `three.service.ts` | Bundle bloat |
| Multiple `CUSTOM_ELEMENTS_SCHEMA` / `NO_ERRORS_SCHEMA` | `app.module.ts`, `shared.module.ts` | Hides template errors |
| No token refresh logic | `auth.service.ts` | Sessions expire silently |
| 44+ NestJS modules monolithic | Backend | Should be microservices |
| No DB migration system | Backend | Schema drift risk |

---

## 9. Deployment Pipeline

```
Developer → git push
               ↓
         npm run build:production
               ↓
         aws s3 sync dist/ s3://backofficeportal.divineinfinitebeing.com
               ↓
         CloudFront serves static files
               ↓
         Frontend → CloudFront → NestJS API (AWS Lambda via Serverless)
                              → Calendar Lambda (us-east-2)
                              → AI Astrology Lambda (us-east-1)
```

---

## 10. Backend: `divine-infinite-being-nest-api`

| Field | Value |
|---|---|
| Framework | NestJS 10.0.3 + Fastify adapter |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT + AWS Cognito |
| Deployment | AWS Lambda (Serverless Framework) + API Gateway |
| Swagger | `/api` endpoint |
| Port | 3522 (local) / 80 (prod) |
| Modules | 44 |
| Controllers | 44 |
| MongoDB Collections | 80+ |
| Key integrations | Stripe, VideoSDK.live, GoToMeeting, OpenAI, AWS Cognito, Printify, Twitter, LinkedIn, Facebook, WhatsApp, GoToMeeting, HERE Maps, PositionStack |

---

## 11. Conference Room: `conference-room-angular-v1`

> **Note:** Despite the folder name, this is a **Next.js 13** app, not Angular.

| Field | Value |
|---|---|
| Framework | Next.js 13.4.7 (React 18) |
| State | Redux Toolkit |
| Video | `@videosdk.live/react-sdk` |
| UI | Material-UI v5 |
| Hosting | AWS Amplify (`main.d1njtuljco40va.amplifyapp.com`) |
| Purpose | Real-time video conference room UI embedded from Angular via URL redirect |
