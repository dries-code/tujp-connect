// Team directory — reads directly from a public Google Sheet (CSV export),
// no API key or service account needed. The sheet only needs to be shared
// as "Anyone with the link" (Viewer).
//
// Columns expected (see .env.example for the sheet id):
//   Slug | Naam | Functie | Email | Telefoon | Organisatie | Foto bestand | Actief

export type Person = {
  slug: string;
  name: string;
  role: string;
  email: string;
  phone: string; // digits only, e.g. "31610501760"
  org: string;
  photoUrl: string | null; // ready-to-use <img src>, or null if no photo yet
  active: boolean;
};

const SHEET_ID = process.env.TEAM_SHEET_ID;

function sheetCsvUrl(): string {
  if (!SHEET_ID) {
    throw new Error(
      "TEAM_SHEET_ID is not set. Add it as an environment variable (see .env.example)."
    );
  }
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
}

/** Minimal CSV parser — handles quoted fields and commas/newlines inside quotes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (c === '"' && next === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && next === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Turns a Drive "share" link (or a bare file id) into a directly embeddable image URL. */
function toDriveImageUrl(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  const match = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  const fileId = match ? match[1] : value; // fall back to treating the value itself as an id

  if (!/^[a-zA-Z0-9_-]{10,}$/.test(fileId)) return null;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function rowsToPeople(rows: string[][]): Person[] {
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iSlug = idx("slug");
  const iName = idx("naam");
  const iRole = idx("functie");
  const iEmail = idx("email");
  const iPhone = idx("telefoon");
  const iOrg = idx("organisatie");
  const iPhoto = idx("foto bestand");
  const iActive = idx("actief");

  return rows
    .slice(1)
    .map((cells): Person | null => {
      const name = (cells[iName] || "").trim();
      if (!name) return null;

      const slugRaw = (cells[iSlug] || "").trim();
      const slug = slugRaw ? slugify(slugRaw) : slugify(name);

      const activeRaw = (cells[iActive] || "").trim().toUpperCase();
      const active = activeRaw === "" || activeRaw === "TRUE" || activeRaw === "WAAR";

      const photoRaw = (cells[iPhoto] || "").trim();

      return {
        slug,
        name,
        role: (cells[iRole] || "").trim(),
        email: (cells[iEmail] || "").trim(),
        phone: (cells[iPhone] || "").trim(),
        org: (cells[iOrg] || "The Urban Jungle Project").trim(),
        photoUrl: photoRaw ? toDriveImageUrl(photoRaw) : null,
        active,
      };
    })
    .filter((p): p is Person => p !== null);
}

async function fetchPeople(): Promise<Person[]> {
  const res = await fetch(sheetCsvUrl(), {
    // Revalidate periodically so new rows/edits in the sheet show up without a redeploy.
    next: { revalidate: 300 },
  });
  if (!res.ok) {
    throw new Error(`Could not load the team directory sheet (HTTP ${res.status}).`);
  }
  const csv = await res.text();
  return rowsToPeople(parseCsv(csv));
}

export async function getAllPeople(): Promise<Person[]> {
  const people = await fetchPeople();
  return people.filter((p) => p.active);
}

export async function getPerson(slug: string): Promise<Person | null> {
  const people = await fetchPeople();
  return people.find((p) => p.slug === slug && p.active) ?? null;
}

/** Initials for the placeholder avatar, e.g. "Dries Grasveld" -> "DG". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Formats a bare digit phone number for display, e.g. "31610501760" -> "+31 6 10501760". */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("31") && digits.length === 11) {
    return `+31 ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }
  if (digits.startsWith("49")) {
    return `+49 ${digits.slice(2)}`;
  }
  return `+${digits}`;
}

export function vcardFor(person: Person): string {
  const nameParts = person.name.trim().split(/\s+/);
  const last = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";
  const first = nameParts.slice(0, nameParts.length > 1 ? -1 : undefined).join(" ");
  const phoneDigits = person.phone.replace(/\D/g, "");

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${person.name}`,
    `ORG:${person.org}`,
    `TITLE:${person.role}`,
    person.email ? `EMAIL;TYPE=INTERNET,WORK:${person.email}` : null,
    phoneDigits ? `TEL;TYPE=CELL,VOICE:+${phoneDigits}` : null,
    "URL:https://theurbanjungleproject.com",
    "NOTE:lightweight. modular. smart. — The Urban Jungle Project",
    "END:VCARD",
    "",
  ].filter((l): l is string => l !== null);

  return lines.join("\r\n");
}
