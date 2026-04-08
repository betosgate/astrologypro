
# Fetch Planet Signs API Logic (Next.js + PostgreSQL)

## Overview
This API fetches **planet** and **signs** data from the PostgreSQL table `astro_decan_new_infos` and returns it in a structured JSON response.

The endpoint replicates the behavior of the previous NestJS API but is implemented using **Next.js API routes**.

---

## Endpoint

**URL**
```

/api/astro-decan/fetch-planet-signs

```

**Method**
```

GET

```

**Description**

Fetches all planet and sign combinations from the database.

---

## API Logic

The API follows these steps:

1. Receive a **GET request** on the endpoint.

2. Execute a SQL query to fetch only the required fields from the database.

```

SELECT planet, signs
FROM astro_decan_new_infos;

```

3. Retrieve the query result from PostgreSQL.

4. Format the response into a structured JSON object.

5. Return the response to the client.

---

## Next.js Route Logic

Example implementation inside:

```

app/api/astro-decan/fetch-planet-signs/route.ts

````

```ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT planet, signs FROM astro_decan_new_infos`
    );

    return NextResponse.json({
      status: "success",
      message: "Planet signs fetched successfully",
      results: result.rows,
    });

  } catch (error) {
    console.error("Fetch planet signs error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Something went wrong",
      },
      { status: 500 }
    );
  }
}
````

---

## Response Format

Successful response:

```json
{
  "status": "success",
  "message": "Planet signs fetched successfully",
  "results": [
    {
      "planet": "Mars",
      "signs": "Aries"
    },
    {
      "planet": "Venus",
      "signs": "Taurus"
    }
  ]
}
```

---

## Error Response

If an error occurs while fetching data:

```json
{
  "status": "error",
  "message": "Something went wrong"
}
```

HTTP Status Code:

```
500 Internal Server Error
```

---

## Summary

The API:

* Receives a GET request
* Queries the `astro_decan_new_infos` table
* Fetches `planet` and `signs` fields
* Returns the result in JSON format

