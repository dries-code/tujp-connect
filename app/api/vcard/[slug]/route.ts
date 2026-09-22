import { NextResponse } from "next/server";
import { getPerson, vcardFor } from "@/lib/team";

export const revalidate = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const person = await getPerson(slug);

  if (!person) {
    return new NextResponse("Not found", { status: 404 });
  }

  const vcf = vcardFor(person);

  return new NextResponse(vcf, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${person.slug}.vcf"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
