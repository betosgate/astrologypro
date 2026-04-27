# Recreating `astro-ai/save-astro-AI-Response` in Next.js with Supabase

This document outlines the logic and implementation steps to recreate the `save-astro-AI-Response` API endpoint using Next.js (App Router) and Supabase (PostgreSQL).

## 1. Database Schema (Supabase / PostgreSQL)

Create the `astro_ai_responses` table in your Supabase SQL Editor. We use `JSONB` for complex objects to maintain compatibility with the original MongoDB structure.

```sql
-- Create the table
CREATE TABLE IF NOT EXISTS astro_ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    condition JSONB DEFAULT '{}'::jsonb,
    toolname TEXT,
    ai_response TEXT,
    json_condition TEXT,
    chat_response JSONB DEFAULT '{}'::jsonb,
    chat_questions JSONB DEFAULT '[]'::jsonb,
    natal_chart JSONB DEFAULT '{}'::jsonb,
    form_data JSONB DEFAULT '{}'::jsonb,
    astro_api_data JSONB DEFAULT '{}'::jsonb,
    summary TEXT,
    free_natal_wheel_chart TEXT,
    free_natal_wheel_chart_transit TEXT,
    free_natal_wheel_chart_self TEXT,
    free_natal_wheel_chart_partner TEXT,
    response_share_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) if needed
ALTER TABLE astro_ai_responses ENABLE ROW LEVEL SECURITY;

-- Simple trigger to update 'updated_at' on every save
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_astro_ai_responses_updated_at
    BEFORE UPDATE ON astro_ai_responses
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

---

## 2. Supabase Client Utility

Create a utility to initialize the Supabase client.

`lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use Service Role Key for backend operations

export const supabase = createClient(supabaseUrl, supabaseKey);
```

---

## 3. API Route Implementation (Next.js App Router)

`app/api/astro-ai/save-astro-ai-response/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { _id, ...data } = body;

    // Map NestJS field names to Postgres snake_case if necessary
    // or keep them as is if you prefer matching the original entities exactly.
    const dbPayload = {
      condition: data.condition,
      toolname: data.toolname,
      ai_response: data.ai_response,
      json_condition: data.json_condition,
      chat_response: data.chat_response,
      chat_questions: data.chat_questions,
      natal_chart: data.natal_chart,
      form_data: data.formData, // mapped from formData
      astro_api_data: data.astro_api_data,
      summary: data.summary,
      free_natal_wheel_chart: data.freeNatalWheelChart,
      free_natal_wheel_chart_transit: data.freeNafreeNatalWheelChartForTrasittalWheelChart,
      free_natal_wheel_chart_self: data.freeNatalWheelChartForself,
      free_natal_wheel_chart_partner: data.freeNatalWheelChartForPartner,
      response_share_url: data.response_share_url,
    };

    let result;

    if (_id) {
      // UPDATE logic
      const { data: updatedDoc, error } = await supabase
        .from('astro_ai_responses')
        .update(dbPayload)
        .eq('id', _id)
        .select()
        .single();

      if (error) throw error;
      result = updatedDoc;
    } else {
      // INSERT logic
      const { data: newDoc, error } = await supabase
        .from('astro_ai_responses')
        .insert([dbPayload])
        .select()
        .single();

      if (error) throw error;
      result = newDoc;
    }

    return NextResponse.json({
      status: 'success',
      res: result,
    });
  } catch (error: any) {
    console.error('Error in save-astro-ai-response:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error.message || 'Something went wrong!',
      },
      { status: 400 }
    );
  }
}
```

---

## 4. Key Logic Differences & Considerations

1.  **ID Management**:
    *   **NestJS/MongoDB**: Uses `_id` as a hex string (24 chars).
    *   **Supabase/Postgres**: Uses `id` as a UUID. When migrating, ensure the frontend sends a valid UUID or handles the change from `_id` to `id`.
2.  **Timestamps**:
    *   MongoDB version uses `number` (milliseconds).
    *   Postgres uses `TIMESTAMPTZ` which is more robust for date queries.
3.  **Upsert vs Manual Check**:
    *   NestJS logic manually checks for `_id` presence. 
    *   Supabase provides `.upsert()` but performing explicit `update` or `insert` based on ID presence is safer when specific fields shouldn't be overwritten.
4.  **Security**:
    *   Ensure proper environment variables are set in `.env.local`:
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `SUPABASE_SERVICE_ROLE_KEY` (Keep this secret!)
