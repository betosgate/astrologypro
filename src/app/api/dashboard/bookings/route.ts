import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/dashboard/bookings
 *
 * Returns the authenticated diviner's bookings for the schedule view.
 *
 * Query params:
 *   status  — comma-separated list, e.g. "confirmed,pending"  (default: all statuses)
 *   from    — ISO datetime lower bound on scheduled_at         (default: start of current week)
 *   to      — ISO datetime upper bound on scheduled_at         (default: end of current week)
 *
 * Response: { bookings: Booking[] }
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  // ownerId is either the Diviner ID or the User ID
  const ownerId = diviner?.id || user.id;

  const { searchParams } = request.nextUrl;

  // Parse status filter
  const rawStatus = searchParams.get("status");
  const statusList =
    rawStatus && rawStatus !== "all"
      ? rawStatus.split(",").map((s) => s.trim()).filter(Boolean)
      : null;

  // Parse date range — default to current ISO week (Mon–Sun)
  const now = new Date();
  const todayDay = now.getDay(); // 0=Sun
  const daysFromMonday = (todayDay + 6) % 7; // shift so Monday=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const from = searchParams.get("from") ?? monday.toISOString();
  const to = searchParams.get("to") ?? sunday.toISOString();

  try {
    let query = supabase
      .from("bookings")
      .select(
        `id,
         scheduled_at,
         duration_minutes,
         status,
         base_price,
         total_amount,
         session_notes,
         services(id, name, category),
         clients(id, full_name, email)`
      )
      .eq("owner_id", ownerId)
      .gte("scheduled_at", from)
      .lte("scheduled_at", to)
      .order("scheduled_at", { ascending: true });

    if (statusList && statusList.length > 0) {
      query = query.in("status", statusList);
    }

    const { data: bookings, error } = await query;
    console.log(`[api/dashboard/bookings] Fetching for ownerId: ${ownerId}, Found: ${bookings?.length ?? 0}`);

    if (error) {
      console.error("[api/dashboard/bookings] query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/bookings
 *
 * Creates a new manual booking.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: diviner } = await admin
    .from("diviners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const ownerId = diviner?.id || user.id;

  try {
    const body = await request.json();
    const { 
      client_id, 
      manual_client, 
      is_reminder, 
      service_id, 
      scheduled_date, 
      scheduled_time, 
      scheduled_end_time,
      timezone, 
      notes, 
      send_email 
    } = body;

    if (!is_reminder && !client_id && !manual_client) {
      return NextResponse.json({ error: "Client selection or details required" }, { status: 400 });
    }
    if (!scheduled_date || !scheduled_time || !timezone) {
      return NextResponse.json({ error: "Missing required scheduling fields" }, { status: 400 });
    }

    // 1. Timezone conversion to UTC
    const wallClock = new Date(`${scheduled_date}T${scheduled_time}:00`);
    const tzString = wallClock.toLocaleString("en-US", { timeZone: timezone });
    const tzDate = new Date(tzString);
    const offset = wallClock.getTime() - tzDate.getTime();
    const scheduled_at_utc = new Date(wallClock.getTime() + offset).toISOString();

    // 2. Duration calculation
    let calculated_duration = 30; // Fallback
    if (scheduled_end_time) {
      const start = new Date(`${scheduled_date}T${scheduled_time}:00`);
      const end = new Date(`${scheduled_date}T${scheduled_end_time}:00`);
      calculated_duration = Math.round((end.getTime() - start.getTime()) / 60000);
      
      if (calculated_duration <= 0) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
      }
    }

    // 2. Client Handling
    let final_client_id = client_id;

    if (is_reminder) {
      const selfEmail = user.email || user.user_metadata?.email || `internal-${user.id}@astrologypro.dev`;
      const selfName = user.user_metadata?.full_name || "Self (Personal)";
      let dbError = null;

      if (selfEmail) {
        // Find or create a "Self" client record for the diviner
        let { data: selfClient, error: fetchError } = await admin
          .from("clients")
          .select("id")
          .eq("email", selfEmail.toLowerCase())
          .maybeSingle();

        if (fetchError) dbError = fetchError;

        if (!selfClient) {
          const { data: newSelf, error: selfError } = await admin
            .from("clients")
            .insert({
              full_name: selfName,
              email: selfEmail.toLowerCase(),
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single();
          
          if (!selfError && newSelf) {
            selfClient = newSelf;
          } else {
            if (selfError) dbError = selfError;
            // If it failed (likely exists or other issue), try one more search
            const { data: retry } = await admin
              .from("clients")
              .select("id")
              .eq("email", selfEmail.toLowerCase())
              .maybeSingle();
            selfClient = retry;
          }
        }
        
        if (selfClient) {
          final_client_id = selfClient.id;
        }
      }

      // Absolute fallback: pick any existing client so the insert doesn't fail
      if (!final_client_id) {
        const { data: anyRel } = await admin
          .from("client_diviners")
          .select("client_id")
          .eq("owner_id", ownerId)
          .limit(1)
          .maybeSingle();
        if (anyRel) final_client_id = anyRel.client_id;
      }
      
      // If still null, try finding ANY client in the entire table (last resort system record)
      if (!final_client_id) {
        const { data: globalClient } = await admin
          .from("clients")
          .select("id")
          .limit(1)
          .maybeSingle();
        if (globalClient) final_client_id = globalClient.id;
      }

      if (!final_client_id) {
         return NextResponse.json({ 
           error: "Personal reminder failed: Could not resolve client identity.",
           details: dbError ? JSON.stringify(dbError) : "Check if clients table exists and is writable."
         }, { status: 400 });
      }
    }

    if (!is_reminder && !client_id && manual_client) {
      const { name, email } = manual_client;
      // Check if client exists by email
      let { data: existingClient } = await admin
        .from("clients")
        .select("id")
        .eq("email", email.toLowerCase())
        .maybeSingle();

      if (existingClient) {
        final_client_id = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await admin
          .from("clients")
          .insert({
            full_name: name,
            email: email.toLowerCase(),
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (clientError) {
          console.error("Client creation error:", clientError);
          return NextResponse.json({ error: "Failed to create new client" }, { status: 500 });
        }
        final_client_id = newClient.id;
      }

      // Ensure relationship exists
      await admin.from("client_diviners").upsert({
        owner_id: ownerId,
        client_id: final_client_id,
        // Optional: initialize stats
      }, { onConflict: "client_id,owner_id" });
    }

    // 3. Fetch Service Details
    let final_service_id = service_id;
    let service_data = {
      base_price: 0,
      duration_minutes: 30,
      name: "Manual Booking",
    };

    if (final_service_id) {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("base_price, duration_minutes, name")
        .eq("id", final_service_id)
        .eq("owner_id", ownerId)
        .single();

      if (service && !serviceError) {
        service_data = service;
      }
    } else {
      // Try to find an active service as a fallback
      const { data: firstActive } = await supabase
        .from("services")
        .select("id, base_price, duration_minutes, name")
        .eq("owner_id", ownerId)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      
      if (firstActive) {
        final_service_id = firstActive.id;
        service_data = firstActive;
      } else {
        // Fallback to ANY service for this diviner (even inactive)
        const { data: anyService } = await supabase
          .from("services")
          .select("id, base_price, duration_minutes, name")
          .eq("owner_id", ownerId)
          .limit(1)
          .maybeSingle();
        
        if (anyService) {
          final_service_id = anyService.id;
          service_data = anyService;
        } else {
          // No services found at all - Create a default service automatically
          const { data: autoService, error: autoError } = await admin
            .from("services")
            .insert({
              owner_id: ownerId,
              name: "Manual Booking",
              slug: "manual-booking-" + Math.random().toString(36).substring(7),
              category: "freelance",
              duration_minutes: 30,
              base_price: 0,
              is_active: true,
            })
            .select("id, base_price, duration_minutes, name")
            .single();
          
          if (!autoError && autoService) {
            final_service_id = autoService.id;
            service_data = autoService;
          } else {
            final_service_id = null;
          }
        }
      }
    }

    // 4. Insert Booking
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .insert({
        owner_id: ownerId,
        client_id: final_client_id, 
        service_id: final_service_id,
        scheduled_at: scheduled_at_utc,
        duration_minutes: calculated_duration,
        base_price: service_data.base_price,
        total_amount: service_data.base_price,
        status: "confirmed", // Set all manual entries to confirmed status
        session_notes: notes || "",
        // Metadata to remember this was a manual/timezone-specific booking
        metadata: {
          timezone,
          is_manual: true,
          is_reminder,
          original_scheduled_at: `${scheduled_date} ${scheduled_time}`,
          scheduled_end_time: body.scheduled_end_time,
        }
      })
      .select()
      .single();

    if (bookingError) {
      console.error("[api/dashboard/bookings] insert error:", bookingError);
      return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }

    // 5. TODO: Trigger email notification if send_email is true
    if (send_email && !is_reminder && final_client_id) {
       // Placeholder for email service trigger
       console.log(`[Notification] Would send email to client for booking ${booking.id}`);
    }

    return NextResponse.json({ booking });
  } catch (err) {
    console.error("[api/dashboard/bookings] POST error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
