# Astro System Settings Management Plan

## Overview

This document describes the full design and implementation plan for
managing Astrology API keys, Free Astrology API keys, and system
configuration values in a **single database table**.\
The system supports: - Multiple **ASTROLOGY_API** keys (access key +
secret key) - Multiple **FREEASTROLOGY_API** keys (only API key) -
Single system configuration values: - `ASTRO_AI_API_URL` -
`ASTRO_PLANET_RETURN_URL` - Status control for activation/deactivation -
Fetching values dynamically by `key_name`

------------------------------------------------------------------------

# 1. Database Table

Table Name:

    astro_system_settings

### Fields

  ------------------------------------------------------------------------
  Field           Type            Description
  --------------- --------------- ----------------------------------------
  id              uuid / serial   Primary Key

  type            varchar         `ASTROLOGY_API`, `FREEASTROLOGY_API`,
                                  `SYSTEM_CONFIG`

  key_name        varchar         Key identifier

  key_value       text            API key / URL / Access key

  secret_value    text            Secret key (only for ASTROLOGY_API)

  status          integer         1 = active, 0 = inactive

  created_at      timestamp       record created time

  updated_at      timestamp       record updated time
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 2. Example Data

## Astrology API Keys

  id   type            key_name        key_value      secret_value   status
  ---- --------------- --------------- -------------- -------------- --------
  1    ASTROLOGY_API   ASTROLOGY_API   access_key_1   secret_key_1   1
  2    ASTROLOGY_API   ASTROLOGY_API   access_key_2   secret_key_2   1

## Free Astrology API Keys

  -----------------------------------------------------------------------------------------------
  id          type                key_name            key_value        secret_value   status
  ----------- ------------------- ------------------- ---------------- -------------- -----------
  3           FREEASTROLOGY_API   FREEASTROLOGY_API   free_api_key_1   null           1

  4           FREEASTROLOGY_API   FREEASTROLOGY_API   free_api_key_2   null           1
  -----------------------------------------------------------------------------------------------

## System Config Values

  ---------------------------------------------------------------------------------------------------
  id             type            key_name                  key_value                   status
  -------------- --------------- ------------------------- --------------------------- --------------
  5              SYSTEM_CONFIG   ASTRO_AI_API_URL          https://astro-ai.com        1

  6              SYSTEM_CONFIG   ASTRO_PLANET_RETURN_URL   https://planet-return.com   1
  ---------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 3. Create Setting API

### Endpoint

    POST /admin/astro-system-setting/create

### Payload (Astrology API)

``` json
{
"type": "ASTROLOGY_API",
"key_name": "ASTROLOGY_API",
"key_value": "access_key_here",
"secret_value": "secret_key_here",
"status": 1
}
```

### Payload (Free Astrology API)

``` json
{
"type": "FREEASTROLOGY_API",
"key_name": "FREEASTROLOGY_API",
"key_value": "free_api_key_here",
"status": 1
}
```

### Payload (System Config)

``` json
{
"type": "SYSTEM_CONFIG",
"key_name": "ASTRO_AI_API_URL",
"key_value": "https://astro-ai.com",
"status": 1
}
```

------------------------------------------------------------------------

# 4. Fetch Configuration API

### Endpoint

    POST /astro/fetch-config

### Request Payload

``` json
{
"keys": [
"ASTROLOGY_API",
"FREEASTROLOGY_API",
"ASTRO_AI_API_URL",
"ASTRO_PLANET_RETURN_URL"
]
}
```

------------------------------------------------------------------------

# 5. Fetch Logic

### Fetch Astrology API Key

    SELECT key_value, secret_value
    FROM astro_system_settings
    WHERE key_name='ASTROLOGY_API'
    AND status=1
    LIMIT 1;

### Fetch Free Astrology API Key

    SELECT key_value
    FROM astro_system_settings
    WHERE key_name='FREEASTROLOGY_API'
    AND status=1
    LIMIT 1;

### Fetch System Configs

    SELECT key_name,key_value
    FROM astro_system_settings
    WHERE key_name IN (...)
    AND status=1;

------------------------------------------------------------------------

# 6. Fetch API Response

``` json
{
"ASTROLOGY_API": {
"access_key": "access_key_1",
"secret_key": "secret_key_1"
},
"FREEASTROLOGY_API": {
"api_key": "free_api_key_1"
},
"ASTRO_AI_API_URL": "https://astro-ai.com",
"ASTRO_PLANET_RETURN_URL": "https://planet-return.com"
}
```

------------------------------------------------------------------------

# 7. Status Update API

### Endpoint

    PATCH /admin/astro-system-setting/status-update

### Payload

``` json
{
"id": 3,
"status": 0
}
```

### Status Values

  status   meaning
  -------- ----------
  1        Active
  0        Inactive

### SQL Example

    UPDATE astro_system_settings
    SET status = 0,
    updated_at = NOW()
    WHERE id = 3;

------------------------------------------------------------------------

# 8. Recommended Index

To improve performance:

    CREATE INDEX idx_key_status
    ON astro_system_settings(key_name,status);

------------------------------------------------------------------------

# 9. Benefits of This Design

-   Single table architecture
-   Supports multiple API keys
-   Status control for each key
-   Fetch configuration by key_name
-   Easy to extend for future settings
-   Compatible with high‑traffic production systems

------------------------------------------------------------------------

# 10. Optional Production Enhancement

For API rate limit protection, implement **key rotation**:

    SELECT key_value, secret_value
    FROM astro_system_settings
    WHERE key_name='ASTROLOGY_API'
    AND status=1
    ORDER BY updated_at ASC
    LIMIT 1;

This ensures different API keys are used over time to avoid hitting
provider limits.

------------------------------------------------------------------------