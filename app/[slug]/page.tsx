import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllPeople, getPerson, initials, formatPhone } from "@/lib/team";
import HubSpotForm from "../HubSpotForm";
import RevealOnScroll from "../RevealOnScroll";

export const revalidate = 300;
export const dynamicParams = true; // new sheet rows render on-demand, then cache

export async function generateStaticParams() {
  const people = await getAllPeople();
  return people.map((p) => ({ slug: p.slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPerson(slug);
  if (!person) return { title: "TUJP Connect" };
  return {
    title: `${person.name} · The Urban Jungle Project`,
    description:
      "Connect with The Urban Jungle Project — greenery solutions for roofs, façades and public squares.",
  };
}

export default async function PersonPage({ params }: PageProps) {
  const { slug } = await params;
  const person = await getPerson(slug);

  if (!person) {
    notFound();
  }

  return (
    <main className="page">
      <RevealOnScroll />
      <div className="card">
        <section className="section sec-hero reveal">
          <div className="wordmark">
            <img src="/tujp-logotype.svg" alt="The Urban Jungle Project" />
          </div>
          <div className="hero-title">
            Lightweight.
            <br />
            Modular.
            <br />
            Smart.
          </div>
          <p className="hero-sub">
            Greenery solution for roofs, façades, and public squares — where it seemed
            technically impossible.
          </p>
        </section>

        <section className="section sec-contact reveal">
          <div className="avatar">
            {person.photoUrl ? (
              <img src={person.photoUrl} alt={person.name} width={76} height={76} />
            ) : (
              initials(person.name)
            )}
          </div>
          <div>
            <div className="contact-name">{person.name}</div>
            <div className="contact-role">
              {person.role} · {person.org === "The Urban Jungle Project" ? "TUJP" : person.org}
            </div>
            {person.email && <div className="contact-email">{person.email}</div>}
            {person.phone && <div className="contact-email">{formatPhone(person.phone)}</div>}
          </div>
        </section>

        <section className="section sec-cta reveal">
          <a className="cta-btn" href={`/api/vcard/${person.slug}`} download={`${person.slug}.vcf`}>
            <span>Save my details</span>
            <span className="cta-arrow">→</span>
          </a>
          <div className="cta-sub">Straight into your contacts — no app needed</div>
        </section>

        <section className="section sec-video reveal">
          <div className="video-block">
            <iframe
              src="https://player.vimeo.com/video/1195758883?h=5a07bd0e10&dnt=1&autoplay=1&muted=1"
              title="The Urban Jungle Project — mission"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </section>

        <div className="sec-label reveal">Impact in numbers</div>
        <section className="section sec-stats reveal">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-num">250 kg/m²</div>
              <div className="stat-lbl">Max. roof load</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">+70</div>
              <div className="stat-lbl">Projects</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">+12k m²</div>
              <div className="stat-lbl">Grey → green</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">+150k</div>
              <div className="stat-lbl">Water buffer capacity</div>
            </div>
          </div>
        </section>

        <div className="sec-label reveal">Our products</div>
        <section className="section sec-product reveal">
          <div className="product-block">
            <div className="product-title">Jungle Blocks®</div>
            <div className="photo-slot">
              <img
                src="/jungle-blocks.jpg"
                alt="Jungle Blocks® rooftop installation with integrated solar panels"
                loading="lazy"
              />
            </div>
            <p className="product-desc">
              Modular 3D-printed tree planters made from consumer waste (PP) and pre-filled with
              our lightweight Jungle Mix substrate. Plug-and-play connection, built-in irrigation,
              no anchoring required — built for roofs with limited load capacity.
            </p>
            <div className="product-tags">
              <span className="product-tag">3D-printed</span>
              <span className="product-tag">Circular</span>
              <span className="product-tag">Plug-and-play</span>
              <span className="product-tag">Sensors</span>
            </div>
          </div>
        </section>

        <div className="sec-label reveal">Get more information</div>
        <section className="section sec-form reveal">
          <div className="form-title">Get more information</div>
          <p className="form-sub">
            Leave your details and we&apos;ll send you more information about TUJP and Jungle
            Blocks®.
          </p>
          <HubSpotForm />
        </section>

        <section className="section sec-footer reveal">
          <p className="footer-quote">
            &quot;A single tree is not a jungle, but every jungle starts with a single tree.&quot;
          </p>
          <div className="footer-addr">
            theurbanjungleproject.com
            <br />
            Beerseweg 45 · Cuijk · T +31 345 520004
          </div>
          <div className="footer-mark">
            <img src="/tujp-logomark.svg" alt="TUJP beeldmerk" />
          </div>
          <div className="footer-eu">
            <img
              src="/eu-co-funded.png"
              alt="Co-funded by the European Union"
              width={148}
              height={31}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
