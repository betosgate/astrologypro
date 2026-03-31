"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface IntakeData {
  fullName: string;
  email: string;
  phone: string;
  birthDate: string;
  birthTime: string;
  birthCity: string;
  focusQuestion: string;
  lifeArea: string;
}

interface IntakeFormProps {
  requiresBirthData: boolean;
  data: IntakeData;
  onChange: (data: IntakeData) => void;
}

const LIFE_AREAS = [
  "General",
  "Career",
  "Love & Relationships",
  "Health & Wellness",
  "Spiritual Growth",
  "Finances",
  "Family",
];

function generateTimeOptions(): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour24 = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const period = h < 12 ? "AM" : "PM";
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${hour12}:${String(m).padStart(2, "0")} ${period}`;
      options.push({ value: hour24, label });
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

export function IntakeForm({
  requiresBirthData,
  data,
  onChange,
}: IntakeFormProps) {
  function update(field: keyof IntakeData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      {/* Client Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Information</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              placeholder="Your full name"
              value={data.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={data.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 000-0000"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>
      </div>

      {/* Birth Data */}
      {requiresBirthData && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Birth Information</h3>
          <p className="text-sm text-muted-foreground">
            Accurate birth data helps provide the most precise reading.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Birth Date *</Label>
              <Input
                id="birthDate"
                type="date"
                value={data.birthDate}
                onChange={(e) => update("birthDate", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthTime">Birth Time</Label>
              <Select
                value={data.birthTime}
                onValueChange={(val) => update("birthTime", val)}
              >
                <SelectTrigger id="birthTime" className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  {TIME_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthCity">Birth City</Label>
              <Input
                id="birthCity"
                placeholder="e.g., New York, NY"
                value={data.birthCity}
                onChange={(e) => update("birthCity", e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Questions</h3>

        <div className="space-y-2">
          <Label htmlFor="lifeArea">What area of life are you focused on? *</Label>
          <Select
            value={data.lifeArea}
            onValueChange={(val) => update("lifeArea", val)}
          >
            <SelectTrigger id="lifeArea" className="w-full">
              <SelectValue placeholder="Select an area" />
            </SelectTrigger>
            <SelectContent>
              {LIFE_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="focusQuestion">
            What questions do you want answered? *
          </Label>
          <Textarea
            id="focusQuestion"
            placeholder="Share what's on your mind and what guidance you're seeking..."
            value={data.focusQuestion}
            onChange={(e) => update("focusQuestion", e.target.value)}
            rows={4}
            required
          />
        </div>
      </div>
    </div>
  );
}
