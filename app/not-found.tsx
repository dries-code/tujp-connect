import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="not-found">
        <h1>We couldn&apos;t find that card</h1>
        <p>This connect card doesn&apos;t exist, or is no longer active.</p>
        <Link href="/">← Back to the team overview</Link>
      </div>
    </main>
  );
}
