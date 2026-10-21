import { EntryForms } from "./ui/entry-forms.tsx";
import { sampleTitles } from "../src/fixtures/sample-room.ts";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const invite = typeof params.invite === "string" ? params.invite : "";
  return <main id="main" className="wrap home-grid">
    <section className="home-story">
      <p className="intro-note">For the books you loved. And the ones you’ll love next.</p>
      <h1>Good books find<br className="desktop-break"/> their next reader.</h1>
      <p className="lede">There’s a good chance your next read is on a friend’s shelf. Bring a few books, choose the ones you’d welcome, and find a swap that works for everyone.</p>
      <div className="shelf-preview" aria-label="Fictional books in the example room">
        {Object.values(sampleTitles).map((title, n) => <div key={title} className={`book-jacket jacket-${n}`}><span className="jacket-rule"/><strong>{title.replace(" (fictional sample)", "")}</strong><span>CultureLoop<br/>example collection</span></div>)}
      </div>
      <p className="caption">Fictional titles from our example room. Real rooms start with your books.</p>
      <div className="how-it-works"><p><strong>Bring a book.</strong> Offer up to three copies.</p><p><strong>Choose your next read.</strong> Taste suggestions help; your shortlist decides.</p><p><strong>Make a little loop.</strong> Two or three readers approve the exchange together.</p></div>
    </section>
    <aside id="start" className="entry-panel"><EntryForms invite={invite}/><p className="fine-print">A small circle of 2–6 readers. Physical books. Local handoffs. No account needed.</p></aside>
  </main>;
}
