# Implementation Logic: `astro-ai/save-astro-AI-Response`

This document outlines the logic and implementation details for recreating the `save-astro-AI-Response` API using **Next.js (App Router)** and **Supabase (PostgreSQL)**.

## 1. Database Schema (PostgreSQL/Supabase)

You will need a table to store the AI responses and associated metadata.

### SQL Schema
Run this in your Supabase SQL Editor:

```sql
-- Create the astro_ai_responses table
CREATE TABLE IF NOT EXISTS astro_ai_responses (
    id UUID PRIMARY KEY DEFAULT auth.uid(), -- Or use gen_random_uuid() if for public access
    toolname TEXT NOT NULL,
    ai_response JSONB NOT NULL,
    natal_chart JSONB,
    form_data JSONB,
    astro_api_data JSONB,
    free_natal_wheel_chart JSONB,
    response_share_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by ID
CREATE INDEX idx_astro_ai_responses_id ON astro_ai_responses(id);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE astro_ai_responses ENABLE ROW LEVEL SECURITY;
```

> [!NOTE]
> If you want these records to be publicly shareable via the ID, ensure your RLS policies allow `SELECT` and `INSERT`/`UPDATE` for public or authenticated users as per your requirements.

---

## 2. Next.js API Implementation (`/app/api/astro-ai/save-astro-AI-Response/route.ts`)

This implementation handles both creation (initial save) and updates (adding the share URL).

### Implementation Block

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role for backend operations
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      _id, // If provided, we update
      toolname,
      ai_response,
      natal_chart,
      formData,
      astro_api_data,
      freeNatalWheelChart,
      response_share_url
    } = body;

    let result;

    if (_id) {
      // Logic for Update
      const { data, error } = await supabase
        .from('astro_ai_responses')
        .update({
          ...(toolname && { toolname }),
          ...(ai_response && { ai_response }),
          ...(natal_chart && { natal_chart }),
          ...(formData && { form_data: formData }),
          ...(astro_api_data && { astro_api_data }),
          ...(freeNatalWheelChart && { free_natal_wheel_chart: freeNatalWheelChart }),
          ...(response_share_url && { response_share_url }),
          updated_at: new Date().toISOString()
        })
        .eq('id', _id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Logic for Create
      const { data, error } = await supabase
        .from('astro_ai_responses')
        .insert([{
          toolname,
          ai_response,
          natal_chart,
          form_data: formData,
          astro_api_data,
          free_natal_wheel_chart: freeNatalWheelChart,
          response_share_url
        }])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      res: {
        ...result,
        _id: result.id // Map back to _id for frontend compatibility
      }
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 3. Fetch Logic Implementation (`/app/api/astro-ai/fetch-save-astro-AI-Response/route.ts`)

To support viewing shared results, you also need the fetch logic.

### Implementation Block

```typescript
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const { _id } = await request.json();

    if (!_id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('astro_ai_responses')
      .select('*')
      .eq('id', _id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      res: {
        ...data,
        _id: data.id,
        formData: data.form_data, // Map back to camelCase for frontend
        freeNatalWheelChart: data.free_natal_wheel_chart
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 4. Key Differences & Considerations

1.  **Snake_case vs CamelCase**: PostgreSQL usually uses `snake_case`. I've mapped `formData` to `form_data` and `freeNatalWheelChart` to `free_natal_wheel_chart` in the database to follow SQL conventions, while mapping them back in the JSON response for Angular frontend compatibility.
2.  **ID Generation**: Supabase/Postgres uses `UUID` (e.g., `550e8400-e29b-41d4-a716-446655440000`) whereas the original likely used MongoDB `ObjectId` (e.g., `60d5ec...`). The frontend should handle UUIDs fine as they are just strings.
3.  **JSONB Types**: Using `JSONB` columns in Supabase allows you to store the complex AI response objects and chart data efficiently while still being able to query into them if needed later.
4.  **Environment Variables**: Ensure you have `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set in your `.env.local`.
