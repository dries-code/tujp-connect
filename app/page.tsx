import Link from "next/link";
import { getAllPeople, initials } from "@/lib/team";

export const revalidate = 300;

export default async function OverviewPage() {
  const people = await getAllPeople();

  return (
    <main className="page">
      <div className="overview">
        <section className="overview-hero">
          <div className="wordmark">
            <img src="/tujp-logotype.svg" alt="The Urban Jungle Project" />
          </div>
          <h1>Connect with the team</h1>
          <p>Tap a name to save someone&apos;s contact details or share their digital business card.</p>
        </section>

        <div className="people-grid">
          {people.map((person) => (
            <Link key={person.slug} href={`/${person.slug}`} className="person-card">
              <div className="avatar">
                {person.photoUrl ? (
                  <img src={person.photoUrl} alt={person.name} />
                ) : (
                  initials(person.name)
                )}
              </div>
              <div>
                <div className="person-card-name">{person.name}</div>
                <div className="person-card-role">{person.role}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="overview-footer">
          <div className="footer-mark">
            <img src="/tujp-logomark.svg" alt="TUJP" />
          </div>
          <p>theurbanjungleproject.com</p>
        </div>
      </div>
    </main>
  );
}
