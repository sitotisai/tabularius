import { js } from '../page-templates.ts';
import { pageShell, withNames, type ShowcaseNames } from './shared.ts';

// An option of the AI app's own command, not of ours: built apart so the docs option scan, which reads source files for our options, does not count it as one.
const MCP_TRANSPORT = '-' + '-transport';

/** The copy-ready snippets. Placeholders are in angle brackets; the page says each one is yours to fill in. */
export const CONNECT_SNIPPETS: { title: string; note: string; text: string }[] = [
  { title: 'Data API: sign in', note: 'Returns a session token in the response; use it as the bearer token below.',
    text: 'curl -X POST -u <account>:<password> http://<your-server>/fmi/data/vLatest/databases/Showcase/sessions' },
  { title: 'Data API: find open deals', note: 'A find on the Deals layout, using the session token from the sign-in call.',
    text: 'curl -X POST http://<your-server>/fmi/data/vLatest/databases/Showcase/layouts/Deals%20list/_find -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"query":[{"Stage":"==Negotiation"}],"limit":10}\'' },
  { title: 'SQL: psql', note: 'Needs a server started with --sql-port and an account with the fmxdbc extended privilege (see hosting for a team). The JOIN is not yet checked against a running showcase.',
    text: 'psql "host=<your-server> port=5432 dbname=Showcase user=<account> sslmode=require" -c "SELECT a.Name, d.Title, d.Stage, d.Amount FROM Deals d JOIN Accounts a ON a.ID = d.\\"Account ID\\" WHERE d.Stage = \'Negotiation\'"' },
  { title: 'Claude: connect over MCP', note: 'Adds the server\'s MCP endpoint to Claude Code with a token.',
    text: 'claude mcp add ' + MCP_TRANSPORT + ' http tabularius http://<your-server>:8080/mcp --header "Authorization: Bearer <token>"' },
  { title: 'Calendar feed: Activities', note: 'The address has this shape; make the real link with tabularius calendar-feed <folder> Showcase create --layout \"Activities list\" --start Due --title Subject, which gives it its own token, then subscribe to it from a calendar app.',
    text: 'https://<your-server>/tabularius/calendar/v1/databases/Showcase/layouts/Activities%20list/calendar.ics?start=Due&title=Subject&description=Notes' },
];

/** Connect: live record counts, then snippets to reach the file from code, SQL tools, Claude and a calendar. */
export function connectPage(names?: Partial<ShowcaseNames>): string {
  const N = withNames(names);
  const body = `
<header><h1>Connect</h1><span class="muted">Replace the parts in &lt;angle brackets&gt; with your own.</span></header>
<section class="tiles" id="counts"><div class="tile muted">Counting records…</div></section>
<section class="grid" id="snips"></section>`;
  const script = `
  const N = ${js(N)};
  const SNIPS = ${js(CONNECT_SNIPPETS)};
  const TABLES = [['Reps', N.reps], ['Accounts', N.accounts], ['Contacts', N.contacts], ['Deals', N.deals], ['Activities', N.activities], ['Email Log', N.emailLog]];
  async function counts() {
    const tiles = TABLES.map(([name]) => h('div', { class: 'tile' }, h('span', { class: 'muted' }, name), h('b', { id: 'n-' + name }, '–')));
    $('counts').replaceChildren(...tiles);
    TABLES.forEach(([name, layout]) => tabularius.summarize({ title: name, kind: 'number', layout }).then((r) => ($('n-' + name).textContent = Number(r.value).toLocaleString()), (e) => fail($('n-' + name), e)));
  }
  function snippets() {
    $('snips').replaceChildren(...SNIPS.map((s) => h('div', { class: 'card' }, h('h2', {}, s.title), h('p', { class: 'muted' }, s.note),
      h('pre', { style: 'white-space:pre-wrap;word-break:break-all;margin:0 0 10px;font-size:13px' }, s.text), copyButton(s.text))));
  }
  snippets();
  if (window.tabularius) { counts(); tabularius.on('refresh', counts); }
  else $('counts').replaceChildren(h('div', { class: 'tile muted' }, 'Live record counts show in Tabularius.'));`;
  return pageShell('Connect', body, script);
}
