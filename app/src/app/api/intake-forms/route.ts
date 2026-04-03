import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface IntakeQuestion {
  id: string;
  question_text: string;
  question_type: "text" | "textarea" | "select" | "checkbox";
  options: string[];
  is_required: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { diviner_id, service_id, questions } = body as {
      diviner_id: string;
      service_id: string;
      questions: IntakeQuestion[];
    };

    if (!diviner_id || !service_id || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify diviner belongs to user
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", diviner_id)
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("intake_forms")
      .insert({ diviner_id, service_id, questions })
      .select()
      .single();

    if (error) {
      console.error("Insert intake_form error:", error);
      return NextResponse.json(
        { error: "Failed to create intake form" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, diviner_id, service_id, questions } = body as {
      id: string;
      diviner_id: string;
      service_id: string;
      questions: IntakeQuestion[];
    };

    if (!id || !diviner_id || !service_id || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify diviner belongs to user
    const { data: diviner } = await supabase
      .from("diviners")
      .select("id")
      .eq("id", diviner_id)
      .eq("user_id", user.id)
      .single();

    if (!diviner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("intake_forms")
      .update({ questions })
      .eq("id", id)
      .eq("diviner_id", diviner_id)
      .select()
      .single();

    if (error) {
      console.error("Update intake_form error:", error);
      return NextResponse.json(
        { error: "Failed to update intake form" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // RLS ensures only the diviner's own records can be deleted
    const { error } = await supabase
      .from("intake_forms")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete intake_form error:", error);
      return NextResponse.json(
        { error: "Failed to delete intake form" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
