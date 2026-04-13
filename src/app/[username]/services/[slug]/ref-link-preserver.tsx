"use client";

import { type ReactNode } from "react";

/**
 * Thin wrapper that renders children only on the client side.
 * Used to wrap the sticky pricing bar that contains links with ?ref= params.
 * The parent server component passes the bookUrl with ref already embedded.
 */
export function RefLinkPreserver({
  children,
  bookUrl,
}: {
  children: ReactNode;
  bookUrl: string;
}) {
  return <>{children}</>;
}
