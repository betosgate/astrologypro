# Astro Decan Fetch Details API Documentation

## Overview
This document provides instructions for using the `astro_decan_new_infos/fetch-decan-details` API endpoint. This endpoint is designed to fetch detailed information about a specific decan based on the planet and zodiac sign provided in the request.

## Endpoint Details
- **URL**: `astro_decan_new_infos/fetch-decan-details`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Description**: Triggered when the user clicks the decan icon to retrieve associated details like Greek daemon, tarot information, and descriptions.

## Implementation Details
The API is implemented using NestJS and queries the `astro_decan_new_infos` collection in MongoDB.

- **Controller**: `src/astro_decan_info/astro_decan_info.controller.ts`
- **Service**: `src/astro_decan_info/astro_decan_info.service.ts`
- **Model**: `src/models/astro_decan_info/astro_decan_info.interface.ts`

### Request Payload
The request body should contain the zodiac sign and the planet name.

```json
{
  "signs": "Leo",
  "planet": "Sun"
}
```

### Response Structure
The API returns a success status and the results containing all the decan details.

**Sample Response**:
```json
{
  "status": "success",
  "results": {
    "_id": "64c7...",
    "planet": "Sun",
    "signs": "Leo",
    "decan": "1st Decan",
    "greek_daemon": "Iadalbaoth",
    "tarot_name": "Five of Wands",
    "planet_sign_short_desc": "...",
    "planet_sign_long_desc": "...",
    "daemon_short_desc": "...",
    "daemon_long_desc": "...",
    "tarot_short_desc": "...",
    "tarot_long_desc": "..."
  }
}
```

## Logic Workflow
1. **Trigger**: User interaction (clicking a decan icon).
2. **Controller**: The `fetchDecan` method in `AstroDecanInfoController` receives the POST request.
3. **Service**: The `fetchDecandetails` method in `AstroDecanInfoService` is called with `signs` and `planet`.
4. **Database Query**: Performs a `findOne` query on the `astro_decan_new_infos` collection using the provided parameters.
5. **Validation**: If no record is found, it returns a `404 Not Found` error.
6. **Output**: Returns the full document if found, including descriptions and metadata.

## Code Example

### Controller Method
```typescript
@Post('fetch-decan-details')
async fetchDecan(
  @Body() body: FetchDecanName,
  @Req() request: FastifyRequest,
  @Res() reply: FastifyReply,
) {
  try {
    const response = await this.AstroService.fetchDecandetails(
      body.signs,
      body.planet,
    );
    return reply
      .status(HttpStatus.OK)
      .header('Content-Type', 'application/json')
      .send({
        status: 'success',
        message: 'Decan details fetched successfully',
        results: response,
      });
  } catch (error) {
    // Error handling logic
  }
}
```

### Service Method
```typescript
async fetchDecandetails(signs: string, planet: string): Promise<any> {
  try {
    const decanInfo = await this.astroDecanModel
      .findOne({ signs: signs, planet })
      .exec();

    if (!decanInfo) {
      throw new HttpException(
        { message: 'Decan not found', status: HttpStatus.NOT_FOUND },
        HttpStatus.NOT_FOUND,
      );
    }

    return decanInfo;
  } catch (error) {
    // Error handling logic
  }
}
```

## Testing
To test this API, you can use tools like Postman or cURL:

```bash
curl -X POST http://localhost:3000/astro_decan_new_infos/fetch-decan-details \
-H "Content-Type: application/json" \
-d '{"signs": "Leo", "planet": "Sun"}'
```
