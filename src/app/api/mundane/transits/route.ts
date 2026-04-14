import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin-auth";
import {
  PLANETS,
  getEclipticLongitude,
  isRetrograde,
  longitudeToSignIndex,
  SIGNS,
} from "@/lib/ephemeris";

export const dynamic = "force-dynamic";

/**
 * GET /api/mundane/transits?date=YYYY-MM-DD
 * Returns current planetary positions for a given date.
 * Used by the Chart Studio bi-wheel (transit overlay).
 *
 * Auth: Admin only.
 *
 * Response: { planets: [{ name, longitude, sign, retrograde }] }
 */
export async function GET(req: NextRequest) {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json(
      {
        type: "/errors/unauthorized",
        title: "Unauthorized",
        status: 401,
        detail: "Admin access required.",
      },
      { status: 401 }
    );
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  if (!dateParam) {
    return NextResponse.json(
      {
        type: "/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "Query parameter 'date' is required (ISO date, e.g. 2025-04-14).",
      },
      { status: 422 }
    );
  }

  // Validate ISO date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateParam)) {
    return NextResponse.json(
      {
        type: "/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "Date must be in YYYY-MM-DD format.",
      },
      { status: 422 }
    );
  }

  const date = new Date(`${dateParam}T12:00:00Z`);
  if (isNaN(date.getTime())) {
    return NextResponse.json(
      {
        type: "/errors/validation",
        title: "Validation Error",
        status: 422,
        detail: "Invalid date value.",
      },
      { status: 422 }
    );
  }

  try {
    const planets = PLANETS.map((planet) => {
      const longitude = getEclipticLongitude(planet, date);
      const signIndex = longitudeToSignIndex(longitude);
      const sign = SIGNS[signIndex];
      const retrograde = isRetrograde(planet, date);

      // Capitalize planet name to match PlanetData convention ("Sun", "Moon", etc.)
      const name = planet.charAt(0).toUpperCase() + planet.slice(1);

      return { name, longitude, sign, retrograde };
    });

    return NextResponse.json({ planets });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ephemeris calculation failed";
    return NextResponse.json(
      {
        type: "/errors/internal",
        title: "Internal Server Error",
        status: 500,
        detail: message,
      },
      { status: 500 }
    );
  }
}
