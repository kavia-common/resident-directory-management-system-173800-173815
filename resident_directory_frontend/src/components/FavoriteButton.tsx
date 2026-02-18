"use client";

import { useState } from "react";

export default function FavoriteButton({
  isFavorite,
  disabled,
  onToggle,
}: {
  isFavorite: boolean;
  disabled?: boolean;
  onToggle: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const label = isFavorite ? "Unfavorite" : "Favorite";
  const title = isFavorite ? "Remove from favorites" : "Add to favorites";

  return (
    <button
      className={`btn ${isFavorite ? "btnDanger" : "btnSuccess"}`}
      type="button"
      title={title}
      aria-pressed={isFavorite}
      disabled={disabled || busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onToggle();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Working…" : label}
    </button>
  );
}
