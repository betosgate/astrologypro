"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Upload,
  Eye,
  Image as ImageIcon,
  Camera,
  AtSign,
  Tv,
  Globe,
  Hash,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

const PLATFORM_INSTAGRAM = "Instagram";
const PLATFORM_TWITTER = "Twitter / X";
const PLATFORM_YOUTUBE = "YouTube";
const PLATFORM_TIKTOK = "TikTok";
const PLATFORM_FACEBOOK = "Facebook";

interface PlatformOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

const availablePlatforms: PlatformOption[] = [
  { id: "instagram", label: PLATFORM_INSTAGRAM, icon: Camera },
  { id: "twitter", label: PLATFORM_TWITTER, icon: AtSign },
  { id: "youtube", label: PLATFORM_YOUTUBE, icon: Tv },
  { id: "tiktok", label: PLATFORM_TIKTOK, icon: Hash },
  { id: "facebook", label: PLATFORM_FACEBOOK, icon: Globe },
];

export default function ContentManagementPage() {
  const [caption, setCaption] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Simulate variable substitution for preview
  const previewCaption = caption
    .replace(/\{username\}/g, "CosmicReader")
    .replace(/\{link\}/g, "https://astrologypro.com/cosmicreader");

  function togglePlatform(platformId: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/marketing">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Content Management
          </h1>
          <p className="text-muted-foreground">
            Upload and manage your marketing content.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Content</CardTitle>
            <CardDescription>
              Upload an image or video and write a caption template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Media</Label>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
                <ImageIcon className="mb-2 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">
                  Drop an image or video here
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, MP4 up to 50MB
                </p>
                <Button variant="outline" size="sm" className="mt-3">
                  <Upload className="mr-1.5 size-3.5" />
                  Choose File
                </Button>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label htmlFor="caption">Caption Template</Label>
              <Textarea
                id="caption"
                placeholder="Write your caption here. Use {username} and {link} as placeholders."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Available variables:{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {"{username}"}
                </code>{" "}
                <code className="rounded bg-muted px-1 py-0.5">
                  {"{link}"}
                </code>
              </p>
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Platforms</Label>
              <div className="grid grid-cols-2 gap-2">
                {availablePlatforms.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <label
                      key={platform.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePlatform(platform.id)}
                      />
                      <Icon className="size-4" />
                      <span className="text-sm">{platform.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1">Save to Library</Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
              >
                <Eye className="mr-1.5 size-3.5" />
                Preview
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-4">
          {showPreview && caption ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Post Preview</CardTitle>
                <CardDescription>
                  How your post will look with your info substituted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Simulated post preview */}
                <div className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="size-8 rounded-full bg-muted" />
                    <div>
                      <p className="text-sm font-medium">CosmicReader</p>
                      <p className="text-xs text-muted-foreground">Just now</p>
                    </div>
                  </div>
                  <div className="mb-3 flex aspect-square items-center justify-center rounded-lg bg-muted">
                    <ImageIcon className="size-12 text-muted-foreground/50" />
                  </div>
                  <p className="whitespace-pre-wrap text-sm">
                    {previewCaption}
                  </p>
                </div>

                {selectedPlatforms.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Will post to:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedPlatforms.map((id) => {
                        const p = availablePlatforms.find(
                          (pl) => pl.id === id
                        );
                        return (
                          <Badge key={id} variant="secondary">
                            {p?.label ?? id}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Eye className="mb-3 size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Preview</p>
                <p className="text-xs text-muted-foreground">
                  Write a caption and click Preview to see how your post will
                  look.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Content Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">*</span>
                  Use square images (1:1) for Instagram and Facebook
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">*</span>
                  Keep captions under 280 characters for Twitter/X
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">*</span>
                  Vertical videos (9:16) work best for TikTok and Reels
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">*</span>
                  Include your booking link using the {"{link}"} placeholder
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">*</span>
                  Post during peak hours: 10am-12pm and 7pm-9pm
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
