const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function formatRelativeDatasetDate(
  dateValue: string | Date,
  now: Date = new Date(),
): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid dataset update date.");
  }

  const days = Math.round(
    (date.getTime() - now.getTime()) / DAY_IN_MILLISECONDS,
  );
  const relative = new Intl.RelativeTimeFormat("id-ID", { numeric: "always" });

  if (days === 0) return "hari ini";
  if (Math.abs(days) < 30) return relative.format(days, "day");
  const months = Math.round(days / 30);
  if (Math.abs(months) < 12) return relative.format(months, "month");
  return relative.format(Math.round(days / 365), "year");
}

export function formatDatasetDate(dateValue: string | Date): string {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Invalid dataset update date.");
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export interface HighlightedTextPart {
  text: string;
  highlighted: boolean;
}

export function getHighlightedTextParts(
  text: string,
  query: string,
): HighlightedTextPart[] {
  const terms = [...new Set(query.trim().split(/\s+/).filter(Boolean))];
  if (terms.length === 0) return [{ text, highlighted: false }];

  const parts: HighlightedTextPart[] = [];
  const lowerText = text.toLocaleLowerCase();
  let cursor = 0;

  while (cursor < text.length) {
    let matchIndex = -1;
    let matchedTerm = "";
    for (const term of terms) {
      const index = lowerText.indexOf(term.toLocaleLowerCase(), cursor);
      if (
        index >= 0 &&
        (matchIndex < 0 ||
          index < matchIndex ||
          (index === matchIndex && term.length > matchedTerm.length))
      ) {
        matchIndex = index;
        matchedTerm = term;
      }
    }

    if (matchIndex < 0) {
      parts.push({ text: text.slice(cursor), highlighted: false });
      break;
    }
    if (matchIndex > cursor) {
      parts.push({ text: text.slice(cursor, matchIndex), highlighted: false });
    }
    const matchEnd = matchIndex + matchedTerm.length;
    parts.push({ text: text.slice(matchIndex, matchEnd), highlighted: true });
    cursor = matchEnd;
  }

  return parts;
}
