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
