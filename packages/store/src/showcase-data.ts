// Seeded, invented sample data for the CRM showcase starter. Every name, company, email and number here is made
// up from the word lists below. The same seed and the same `now` give the same rows; only the dates move, because
// each one is counted back from (or forward of) `now`. A few rows are deliberately messy (near-duplicate accounts,
// off-list values) through their data alone, so Clean Up Data and find_data_problems have something to find.

import type { Starter } from './starters.ts';

type Row = Record<string, string | number>;

/** The value lists the showcase fields use (the starter's value lists are built from these). */
export const SHOWCASE_LISTS = {
  stage: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
  industry: ['Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Logistics', 'Education', 'Hospitality', 'Services'],
  region: ['West', 'East', 'Central', 'South'],
  source: ['Referral', 'Web', 'Event', 'Outbound', 'Partner'],
  activityType: ['Call', 'Meeting', 'Email', 'Note', 'Task'],
  lostReason: ['Price', 'Timing', 'Competitor', 'No decision', 'Fit'],
} as const;

const FIRST = ['Alder', 'Amara', 'Anselm', 'Beatrix', 'Callum', 'Dalia', 'Dmitri', 'Elowen', 'Farid', 'Greta', 'Hana', 'Idris', 'Jonas', 'Keira', 'Lucan', 'Mireille', 'Nadia', 'Oskar', 'Priya', 'Quentin', 'Rowan', 'Soraya', 'Tobias', 'Ulla', 'Viktor', 'Wren', 'Xavier', 'Yara', 'Zane', 'Ashby', 'Briar', 'Cosmo', 'Delphine', 'Emeka', 'Fiona', 'Gideon', 'Hollis', 'Imogen', 'Joaquin', 'Linnea'];
const LAST = ['Abernathy', 'Bellweather', 'Castellan', 'Draycott', 'Eastwick', 'Fairbanks', 'Galloway', 'Hartigan', 'Ironside', 'Jessup', 'Kestrel', 'Lockhart', 'Marlowe', 'Northcott', 'Oakenshaw', 'Pemberton', 'Quillfeather', 'Ravensdale', 'Sandoval', 'Thorncliffe', 'Underhill', 'Vandermeer', 'Whitlock', 'Yarrow', 'Zimmerman', 'Aldridge', 'Brightwater', 'Cavendish', 'Dunmore', 'Ellsworth', 'Fenwick', 'Gresham', 'Holloway', 'Ingram', 'Jorgensen', 'Kingsley', 'Lindqvist', 'Mercado', 'Nakamura', 'Okonkwo'];
const STEM = ['Alderbank', 'Birchwood', 'Cobalt Ridge', 'Dunmore', 'Everlight', 'Fernhill', 'Granite Peak', 'Highmoor', 'Ivory Coast Trading', 'Juniper', 'Kingfisher', 'Lanternworks', 'Millstone', 'Northgate', 'Orchard Lane', 'Pinecrest', 'Quarry Hill', 'Riverbend', 'Silverleaf', 'Tidewater', 'Umber', 'Valemont', 'Willowmere', 'Yellowfin', 'Zephyr Point', 'Ashgrove', 'Brightfield', 'Copperline', 'Driftwood', 'Elmhurst', 'Foxglove', 'Greystone', 'Hawthorne', 'Inkwell', 'Jasper Bay', 'Kestrel Point', 'Longmeadow', 'Marigold', 'Nettlefield', 'Oakvale'];
const SUFFIX = ['Co', 'Ltd', 'Group', 'Partners', 'Systems', 'Supply', 'Labs', 'Works', 'Holdings', 'Industries'];
const RESERVED_STEMS = ['harbour', 'harbor', 'larkspur', 'redfern'];
const ROLE = ['Owner', 'Managing Director', 'Operations Manager', 'Purchasing Lead', 'Finance Director', 'IT Manager', 'Office Manager', 'Head of Sales', 'Project Coordinator', 'Facilities Manager', 'Buyer', 'General Manager'];
const DEAL_ITEM = ['Annual licence renewal', 'Warehouse rollout', 'Pilot programme', 'Regional expansion', 'Support plan upgrade', 'Training package', 'Fleet refresh', 'Site survey and fit-out', 'Reporting suite', 'Seasonal supply agreement', 'Onboarding bundle', 'Equipment upgrade', 'Integration project', 'Service contract', 'Pop-up stand order'];
const ACTIVITY_SUBJECT: Record<string, string[]> = {
  Call: ['Intro call', 'Check-in on pricing', 'Follow-up after demo', 'Renewal conversation', 'Scheduling call'],
  Meeting: ['Discovery meeting', 'Site visit', 'Quarterly review', 'Proposal walkthrough', 'Stakeholder lunch'],
  Email: ['Sent updated quote', 'Shared case study', 'Answered technical questions', 'Sent meeting notes'],
  Note: ['Budget confirmed for next quarter', 'Prefers phone over email', 'New decision maker joined', 'Waiting on legal review'],
  Task: ['Prepare proposal', 'Send contract for signature', 'Book onboarding session', 'Call back about delivery dates', 'Update the quote', 'Confirm renewal terms'],
};
const OUTCOME = ['Interested, wants a quote', 'Left a message', 'Agreed next steps', 'Needs approval from finance', 'Asked to call back next week', 'Happy to proceed', 'Comparing two suppliers', 'No change'];
const EMAIL_SUBJECT = ['Quote for your review', 'Following up on our call', 'Delivery dates for next month', 'Question about the service plan', 'Thanks for meeting with us', 'Updated pricing attached', 'Contract draft for signature', 'Training session options', 'Invoice query', 'Renewal reminder', 'Introduction and next steps', 'Your onboarding checklist'];
const EMAIL_OPEN = ['Thank you for your time earlier this week.', 'Please find the details you asked for below.', 'I wanted to follow up on our last conversation.', 'Here is a short update from our side.', 'We have gone through your questions with the team.', 'Thanks for getting back to us so quickly.'];
const EMAIL_CLOSE = ['Let me know if a call on Thursday would suit you.', 'Happy to adjust the numbers if anything looks off.', 'We can start as soon as you give the go-ahead.', 'Reply here and I will send the paperwork over.', 'If anyone else should be copied, tell me and I will add them.', 'I am around all week if you want to talk it through.'];
const PRODUCT: [string, string, number][] = [
  ['SKU-1001', 'Starter licence', 49], ['SKU-1002', 'Team licence', 120], ['SKU-1003', 'Onboarding session', 300], ['SKU-1004', 'Standard support plan', 480],
  ['SKU-1005', 'Premium support plan', 900], ['SKU-1006', 'Reporting add-on', 250], ['SKU-1007', 'Integration pack', 1500], ['SKU-1008', 'Site survey', 2400],
  ['SKU-1009', 'Hardware kit', 3600], ['SKU-1010', 'Regional rollout', 5200], ['SKU-1011', 'Enterprise suite', 7800], ['SKU-1012', 'Managed service year', 12000],
];
const REP_NAME: [string, string, string][] = [
  ['Marta', 'Lindgren', 'West'], ['Dev', 'Okoye', 'East'], ['Sasha', 'Whitcombe', 'Central'], ['Tomasz', 'Ferreira', 'South'], ['Noor', 'Haddad', 'West'], ['Callie', 'Brennan', 'East'],
];

/** mulberry32: a small seeded generator, so no dependency and the same numbers on every machine. */
function generator(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (lo: number, hi: number) => lo + Math.floor(next() * (hi - lo + 1));
  const pick = <T>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const shuffle = <T>(list: readonly T[]): T[] => {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  };
  return { next, int, pick, shuffle };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const pad = (n: number) => String(n).padStart(2, '0');

export function showcaseSample(now: Date, seed = 20261101): Starter['sample'] {
  const g = generator(seed);
  const nowMs = now.getTime();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const DAY = 86_400_000;
  /** 'YYYY-MM-DD' for a day `ago` days before now's day (negative: after). */
  const dateAgo = (ago: number) => new Date(dayStart - ago * DAY).toISOString().slice(0, 10);
  /** 'YYYY-MM-DDTHH:MM:SS' on that day at a working hour, never later than now. */
  const stampAgo = (ago: number) => {
    const ms = Math.min(dayStart - ago * DAY + g.int(9, 17) * 3_600_000 + g.int(0, 59) * 60_000, nowMs - 60_000);
    return new Date(Math.floor(ms / 1000) * 1000).toISOString().slice(0, 19);
  };

  // Reps
  const reps: Row[] = REP_NAME.map(([first, last, region]) => ({
    Name: `${first} ${last}`, Email: `${first}.${last}@showcase.example`.toLowerCase(), Region: region,
    'Quarterly Quota': g.int(12, 30) * 5000, Login: first.toLowerCase(),
  }));
  const repsByRegion = (region: string) => reps.map((r, i) => ({ r, id: i + 1 })).filter((x) => x.r.Region === region);

  // Accounts
  const names: string[] = [];
  const seen = new Set<string>();
  for (const stem of g.shuffle(STEM)) {
    if (names.length >= 34) break;
    if (RESERVED_STEMS.some((r) => stem.toLowerCase().startsWith(r))) continue;
    let name = `${stem} ${g.pick(SUFFIX)}`;
    if (seen.has(name.toLowerCase())) name = `${stem} Group`;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  // Three near-duplicate pairs, messy through their text alone.
  names.push('Harbour Freight Co', 'Harbor Freight Co.', 'Larkspur Works Ltd', 'Larkspur Works Ltd.', 'Redfern Supply Co', 'Redfern Supply Company');
  const accounts: Row[] = names.map((name, i) => {
    const region = g.pick(SHOWCASE_LISTS.region);
    const owner = g.pick(repsByRegion(region).length ? repsByRegion(region) : reps.map((r, k) => ({ r, id: k + 1 })));
    return {
      Name: name, Industry: g.pick(SHOWCASE_LISTS.industry), Region: region, Employees: Math.round(Math.exp(g.next() * Math.log(400) + Math.log(5))),
      Website: `${slug(name)}.example`, 'Owner ID': owner.id,
      ...(i % 4 === 1 ? { Notes: g.pick(['Prefers email.', 'Fiscal year ends in March.', 'Existing customer since last year.', 'Referred by a partner.']) } : {}),
    };
  });
  accounts[7].Industry = 'Manufactring'; // off-list value
  accounts[13].Region = 'Wset'; // off-list value

  // Contacts: three per account on average, every account has at least one.
  const contacts: Row[] = [];
  const contactAccount: number[] = [];
  const nameSeen = new Set<string>();
  for (let i = 0; i < 120; i++) {
    const accountId = i < accounts.length ? i + 1 : g.int(1, accounts.length);
    let first = g.pick(FIRST), last = g.pick(LAST);
    while (nameSeen.has(`${first} ${last}`)) { first = g.pick(FIRST); last = g.pick(LAST); }
    nameSeen.add(`${first} ${last}`);
    contacts.push({
      'Account ID': accountId, Name: `${first} ${last}`, Role: g.pick(ROLE),
      Email: `${first}.${last}@${slug(String(accounts[accountId - 1].Name))}.example`.toLowerCase(),
      Phone: `555-01${pad(g.int(0, 99))}`,
    });
    contactAccount.push(accountId);
  }
  const contactsOf = (accountId: number) => contactAccount.map((a, i) => (a === accountId ? i + 1 : 0)).filter(Boolean);

  // Deals: 28 open, 25 won, 17 lost.
  const stagePlan = g.shuffle([
    ...Array<string>(8).fill('Lead'), ...Array<string>(8).fill('Qualified'), ...Array<string>(7).fill('Proposal'), ...Array<string>(5).fill('Negotiation'),
    ...Array<string>(25).fill('Won'), ...Array<string>(17).fill('Lost'),
  ]);
  const openIdx = stagePlan.map((s, i) => (s === 'Won' || s === 'Lost' ? -1 : i)).filter((i) => i >= 0);
  const stale = new Set(g.shuffle(openIdx).slice(0, 5));
  const lostReasons = g.shuffle([...Array<string>(5).fill('Price'), ...Array<string>(3).fill('Timing'), ...Array<string>(4).fill('Competitor'), ...Array<string>(3).fill('No decision'), ...Array<string>(2).fill('Fit')]);
  let lostN = 0;
  const deals: Row[] = [];
  const dealAccount: number[] = [];
  const dealOpenedAgo: number[] = [];
  for (let i = 0; i < 70; i++) {
    const accountId = i < accounts.length ? i + 1 : g.int(1, accounts.length);
    const account = accounts[accountId - 1];
    const stage = stagePlan[i];
    const amount = Math.min(90_000, Math.max(1_200, Math.round(Math.exp(Math.log(1200) + g.next() * (Math.log(90_000) - Math.log(1200))) / 50) * 50));
    const item = g.pick(DEAL_ITEM);
    const row: Row = {
      'Account ID': accountId, 'Owner ID': account['Owner ID'], Title: `${item}, ${String(account.Name).replace(/ (Co|Ltd|Group|Partners|Systems|Supply|Labs|Works|Holdings|Industries)\.?$/, '')}`,
      Stage: stage, Amount: amount, Source: g.pick(SHOWCASE_LISTS.source),
    };
    let openedAgo: number;
    if (stage === 'Won' || stage === 'Lost') {
      const closedAgo = g.int(1, 270);
      openedAgo = closedAgo + g.int(14, 90);
      row.Closed = dateAgo(closedAgo);
      row['Expected Close'] = dateAgo(closedAgo + g.int(0, 7));
      row['Stage Changed'] = stampAgo(closedAgo);
      if (stage === 'Lost') row['Lost Reason'] = lostReasons[lostN++];
    } else {
      const inStage = stale.has(i) ? g.int(15, 59) : g.int(0, 13);
      openedAgo = inStage + g.int(0, 150);
      row['Expected Close'] = dateAgo(-g.int(3, 90));
      row['Stage Changed'] = stampAgo(inStage);
    }
    row.Opened = dateAgo(openedAgo);
    deals.push(row);
    dealAccount.push(accountId);
    dealOpenedAgo.push(openedAgo);
  }
  const typoDeals = deals.filter((d) => d.Stage === 'Qualified');
  typoDeals[0].Stage = 'Qualifed'; // off-list values
  typoDeals[1].Stage = 'Qualified ';
  deals.find((d) => d.Source === 'Referral')!.Source = 'Refferal';
  deals.find((d) => d['Lost Reason'] === 'Competitor')!['Lost Reason'] = 'Competitior';

  // Products and deal lines: 150 lines, at least one per deal, totals near the deal's amount.
  const products: Row[] = PRODUCT.map(([sku, name, price], i) => ({ SKU: sku, Name: name, 'Unit Price': price, Active: i === 5 ? 'No' : 'Yes' }));
  const lineCount = Array<number>(70).fill(1);
  for (let extra = 80; extra > 0;) { const i = g.int(0, 69); if (lineCount[i] < 4) { lineCount[i]++; extra--; } }
  const lines: Row[] = [];
  deals.forEach((deal, d) => {
    const weights = Array.from({ length: lineCount[d] }, () => 0.5 + g.next());
    const total = weights.reduce((a, b) => a + b, 0);
    const used = new Set<number>();
    weights.forEach((w) => {
      const target = Number(deal.Amount) * (w / total);
      let choices = products.map((p, k) => k).filter((k) => Number(products[k]['Unit Price']) <= target * 1.5 && !used.has(k));
      if (!choices.length) choices = [0];
      const k = g.pick(choices);
      used.add(k);
      const price = Number(products[k]['Unit Price']);
      const discount = g.pick([0, 0, 5, 10]);
      const qty = Math.min(500, Math.max(1, Math.round(target / (price * (1 - discount / 100)))));
      lines.push({ 'Deal ID': d + 1, 'Product ID': k + 1, Quantity: qty, 'Unit Price': price, 'Discount Percent': discount });
    });
  });

  // Activities: 350 over the last 6 months; tasks are the ones with a due date.
  const activities: Row[] = [];
  for (let i = 0; i < 350; i++) {
    const accountId = g.int(1, accounts.length);
    const ago = g.int(0, 180);
    const type = g.next() < 0.15 ? 'Task' : g.pick(['Call', 'Call', 'Meeting', 'Email', 'Email', 'Note']);
    const contactIds = contactsOf(accountId);
    const dealIds = deals.map((_, d) => d + 1).filter((d) => dealAccount[d - 1] === accountId && dealOpenedAgo[d - 1] >= ago);
    const row: Row = {
      'Account ID': accountId, 'Contact ID': g.pick(contactIds), ...(dealIds.length && g.next() < 0.7 ? { 'Deal ID': g.pick(dealIds) } : {}),
      'Rep ID': accounts[accountId - 1]['Owner ID'], Type: type, Subject: g.pick(ACTIVITY_SUBJECT[type]), When: stampAgo(ago),
    };
    if (type === 'Task') {
      // Overdue ones are still open, a few are due this week, the rest were done.
      const roll = g.next();
      if (roll < 0.2) { row.Due = dateAgo(-g.int(0, 7)); row.Done = 'No'; }
      else if (roll < 0.4) { row.Due = dateAgo(g.int(1, Math.max(1, Math.min(ago, 30)))); row.Done = 'No'; }
      else { row.Due = dateAgo(Math.max(0, ago - g.int(0, 5))); row.Done = 'Yes'; row.Outcome = 'Done'; }
    } else {
      row.Done = 'Yes';
      if (type === 'Call' || type === 'Meeting') row.Outcome = g.pick(OUTCOME);
    }
    activities.push(row);
  }
  activities[40].Type = 'Cal'; // off-list values
  activities[41].Type = 'Meting';

  // Emails: 60, each between a contact and us.
  const emails: Row[] = [];
  for (let i = 0; i < 60; i++) {
    const contactId = g.int(1, contacts.length);
    emails.push({
      'Account ID': contactAccount[contactId - 1], 'Contact ID': contactId, Direction: g.pick(['Inbound', 'Outbound']),
      Subject: g.pick(EMAIL_SUBJECT), Body: `${g.pick(EMAIL_OPEN)} ${g.pick(EMAIL_CLOSE)}`, Sent: stampAgo(g.int(0, 180)),
    });
  }

  return [
    { table: 'Reps', rows: reps },
    { table: 'Accounts', rows: accounts },
    { table: 'Contacts', rows: contacts },
    { table: 'Products', rows: products },
    { table: 'Deals', rows: deals },
    { table: 'Deal Lines', rows: lines },
    { table: 'Activities', rows: activities },
    { table: 'Email Log', rows: emails },
  ];
}
