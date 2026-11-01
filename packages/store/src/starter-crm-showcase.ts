// Shared foundation for the CRM showcase. Later showcase items fill in these sections.
import type { FieldSpec } from './design.ts';
import type { Starter } from './starters.ts';

const serial = (): FieldSpec => ({ name: 'ID', type: 'number', options: { autoEnter: { serial: { next: '1', increment: 1 } }, validation: { notEmpty: true, unique: true } } });
const text = (name: string): FieldSpec => ({ name, type: 'text' });
const required = (name: string): FieldSpec => ({ name, type: 'text', options: { validation: { notEmpty: true } } });

export function crmShowcaseStarter(_now: Date = new Date()): Starter {
  return {
    name: 'crm-showcase', title: 'Tabularius CRM Showcase', summary: 'A CRM showcase foundation for accounts, contacts, deals and activity.',
    // TABLES: only the fields needed for the first board, calendar, dashboard and automation.
    tables: [
      { name: 'Reps', fields: [serial(), required('Name')] },
      { name: 'Accounts', fields: [serial(), required('Name')] },
      { name: 'Contacts', fields: [serial(), required('Name')] },
      { name: 'Deals', fields: [serial(), required('Title'), { name: 'Stage', type: 'text', options: { autoEnter: { data: 'Lead' } } }, { name: 'Amount', type: 'number' }, text('Source'),
        { name: 'Weighted Amount', type: 'number', kind: 'calculation', calculation: 'Case ( Stage = "Won" or Stage = "Lost" ; 0 ; Amount * Case ( Stage = "Lead" ; 0.1 ; Stage = "Qualified" ; 0.25 ; Stage = "Proposal" ; 0.5 ; Stage = "Negotiation" ; 0.75 ; 0 ) )' } ] },
      { name: 'Activities', fields: [serial(), required('Subject'), { name: 'Deal ID', type: 'number' }, text('Type'), { name: 'When', type: 'timestamp' }, { name: 'Due', type: 'date' }] },
      { name: 'Email Log', fields: [serial()] },
      { name: 'Products', fields: [serial()] },
      { name: 'Deal Lines', fields: [serial()] },
    ],
    // RELATIONSHIPS
    relationships: [{ left: 'Deals::ID', right: 'Activities::Deal ID' }],
    // VALUE LISTS
    valueLists: [
      { name: 'Stage', values: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'] },
      { name: 'Lead source', values: ['Referral', 'Web', 'Event', 'Outbound', 'Partner'] },
    ],
    popups: { 'Deals::Stage': 'Stage', 'Deals::Source': 'Lead source' },
    // SCRIPTS
    scripts: [{ name: 'Add onboarding task', text: `Set Variable [ $deal ; Value: Deals::ID ]
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Subject ; "Onboard new customer" ]
Set Field [ Activities::Type ; "Task" ]
Set Field [ Activities::Due ; Get ( CurrentDate ) ]
Commit Records/Requests [ With dialog: Off ]` }],
    // LAYOUTS
    layouts: ['Reps', 'Accounts', 'Contacts', 'Deals', 'Activities', 'Email Log', 'Products', 'Deal Lines'].map((table) => ({ table })),
    // REPORTS
    reports: [],
    // PRIVILEGES
    privilegeSets: [],
    // SAMPLE
    sample: [],
    extras: 'crm-showcase',
  };
}
