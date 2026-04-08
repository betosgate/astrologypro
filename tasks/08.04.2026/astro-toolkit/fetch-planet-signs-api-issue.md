# Astro Decan Fetch Planet Signs API Error Documentation

## Error Observed

While calling the API endpoint:

    GET /api/astro-decan/fetch-planet-signs

The following error is returned:

``` json
{
  "code": "PGRST205",
  "details": null,
  "hint": "Perhaps you meant the table 'public.astro_decan_info'",
  "message": "Could not find the table 'public.astro_decan_new_infos' in the schema cache"
}
```

HTTP Response:

    500 Internal Server Error

------------------------------------------------------------------------

# 1. What This Error Means

The error originates from **Supabase PostgREST** when an API tries to
query a database table that **does not exist in the schema cache**.

The API attempted to query:

    public.astro_decan_new_infos

However, the database schema cache **does not contain this table**.

Instead, the system detected a similar table:

    public.astro_decan_info

Therefore the query fails.

------------------------------------------------------------------------

# 2. Error Code Explanation

### PGRST205

This PostgREST error means:

> The requested table or view cannot be found in the database schema
> cache.

Common causes include:

-   Table does not exist
-   Table name mismatch
-   Schema cache not refreshed
-   Table created in a different schema
-   Typo in table name

------------------------------------------------------------------------

# 3. Possible Root Causes

## 1. Table Does Not Exist

The table `astro_decan_new_infos` may not have been created.

Verify using:

``` sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

If the table does not appear in the result, it does not exist.

------------------------------------------------------------------------

## 2. Table Name Mismatch

Your code may be using:

    astro_decan_new_infos

But the database contains:

    astro_decan_info

Even a small difference in the table name will cause this error.

------------------------------------------------------------------------

## 3. Schema Cache Not Refreshed

Supabase uses **PostgREST schema caching**.

If you recently created the table, the API layer may not yet be aware of
it.

Refresh the schema cache:

``` sql
NOTIFY pgrst, 'reload schema';
```

Or restart the Supabase project.

------------------------------------------------------------------------

## 4. Wrong Schema

The table may exist but in a different schema.

Example:

    astro.astro_decan_new_infos

But your API query is targeting:

    public.astro_decan_new_infos

Verify schema using:

``` sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'astro_decan_new_infos';
```

------------------------------------------------------------------------

# 4. Where the Error Occurs in Code

Most likely inside the API logic:

    /api/astro-decan/fetch-planet-signs

Example problematic query:

``` ts
const { data, error } = await supabase
.from("astro_decan_new_infos")
.select("*");
```

If the actual table is:

    astro_decan_info

Then the query must be corrected.

------------------------------------------------------------------------

# 5. Solution Options

## Option 1 (Recommended)

Update the query to match the existing table name.

Example:

``` ts
supabase
.from("astro_decan_info")
.select("*")
```

------------------------------------------------------------------------

## Option 2

Create the expected table.

Example SQL:

``` sql
CREATE TABLE public.astro_decan_new_infos (
id uuid PRIMARY KEY,
planet text,
signs text,
tarot_name text,
tarot_card_big_image text
);
```

------------------------------------------------------------------------

## Option 3

Reload the schema cache if the table already exists.

``` sql
NOTIFY pgrst, 'reload schema';
```

------------------------------------------------------------------------

# 6. Debugging Steps

Run the following queries in the Supabase SQL editor.

### Check available tables

``` sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema='public';
```

### Check tables related to astro decan

``` sql
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE '%astro_decan%';
```

### Check schema of specific table

``` sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name='astro_decan_new_infos';
```

------------------------------------------------------------------------

# 7. Most Likely Cause

Based on the error hint:

    Perhaps you meant the table 'public.astro_decan_info'

The most likely problem is:

-   The code queries `astro_decan_new_infos`
-   The database only contains `astro_decan_info`

------------------------------------------------------------------------

# 8. Recommended Fix

Update the API query to use the correct table name.

Example:

``` ts
.from("astro_decan_info")
```

------------------------------------------------------------------------

# 9. AI Prompting Context

When asking an AI assistant to help resolve this issue, include:

-   The API endpoint (`/api/astro-decan/fetch-planet-signs`)
-   The exact error message
-   The database table names
-   The query used in the code
-   Supabase/PostgREST environment details

This will allow the AI to correctly diagnose the schema mismatch
problem.

------------------------------------------------------------------------