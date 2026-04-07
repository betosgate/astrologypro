# AI Interpretation API Error Documentation

## Error Observed
When calling the AI interpretation API endpoint:
`api/admin/astro/ai-interpret`

The following error response is received:
```json
{
  "error": "ASTRO_AI_API_URL is not configured"
}
```

## Root Cause
This error is a **configuration error** triggered within the application logic, rather than from an external service. It indicates that the environment variable `ASTRO_AI_API_URL`, which holds the endpoint for the AI Lambda service, is either missing, empty, or not accessible to the server-side process.

### Technical Explanation
The AI interpretation logic depends on an external AWS Lambda function. To secure and parameterize this, the URL is stored in an environment variable.

1.  **Variable Retrieval**: The code attempts to read `process.env.ASTRO_AI_API_URL`.
2.  **Validation Check**: In `src/lib/astrology-api.ts`, a explicit check is performed:
    ```typescript
    const aiUrl = process.env.ASTRO_AI_API_URL;
    if (!aiUrl) {
      throw new Error("ASTRO_AI_API_URL is not configured");
    }
    ```
3.  **Exception Handling**: Since the variable is falsy (undefined or empty), an error is thrown with the specific message "ASTRO_AI_API_URL is not configured".
4.  **API Response**: The route handler in `src/app/api/admin/astro/ai-interpret/route.ts` catches this error and returns it in the JSON response with a **502 Bad Gateway** (or similar) status.

## Location in Code
- **Trigger point**: `src/lib/astrology-api.ts` (inside `callAstroAiApi` function).
- **Endpoint**: `src/app/api/admin/astro/ai-interpret/route.ts`.

## How to Resolve
To fix this error, ensure that the environment variable is correctly set in your environment:

### 1. Update the .env File
Check your `.env` (or `.env.local`) file in the project root. It must contain the following entry:
```env
ASTRO_AI_API_URL=https://wczfs5i4xwvt6h3g4z6jgcm4ei0rsvyp.lambda-url.us-east-1.on.aws
```

### 2. Restart the Server
Environment variables in Next.js are typically loaded at process startup. If you recently added or modified the `.env` file, you **must restart your development server** (e.g., `npm run dev`) for the changes to take effect.

### 3. Verify Server-Side Access
Ensure that you are not trying to access this variable from the client-side (browser) unless it is prefixed with `NEXT_PUBLIC_`. However, for this specific API, it is used on the **server-side** (API Route), which is correct for security reasons as it keeps the Lambda URL hidden from the public.

---
**Note:** Even if the variable is present in the file, ensure there are no leading/trailing spaces or typos in the key name `ASTRO_AI_API_URL`.
