// Shared foundation for the CRM showcase. Later showcase items fill in these sections.
import type { FieldSpec } from './design.ts';
import type { Starter } from './starters.ts';
import type { Store } from './store.ts';
import { SHOWCASE_LISTS, showcaseSample } from './showcase-data.ts';

const serial = (): FieldSpec => ({ name: 'ID', type: 'number', options: { autoEnter: { serial: { next: '1', increment: 1 } }, validation: { notEmpty: true, unique: true } } });
const text = (name: string): FieldSpec => ({ name, type: 'text' });
const required = (name: string): FieldSpec => ({ name, type: 'text', options: { validation: { notEmpty: true } } });
const num = (name: string): FieldSpec => ({ name, type: 'number' });
const date = (name: string): FieldSpec => ({ name, type: 'date' });
const key = (name: string): FieldSpec => ({ name, type: 'number', options: { validation: { notEmpty: true } } });
const today = (name: string): FieldSpec => ({ name, type: 'date', options: { autoEnter: { value: 'creationDate' } } });
const calc = (name: string, calculation: string, type: 'text' | 'number' | 'date' | 'timestamp' = 'number', unstored = false): FieldSpec =>
  ({ name, type, kind: 'calculation', calculation, ...(unstored ? { options: { unstored: true } } : {}) });
const initial = (name: string, value: string): FieldSpec => ({ name, type: 'text', options: { autoEnter: { data: value } } });
const yesNo = (name: string): FieldSpec => initial(name, 'No');

export function crmShowcaseStarter(now: Date = new Date()): Starter {
  return {
    name: 'crm-showcase', title: 'Tabularius CRM Showcase', summary: 'A CRM showcase foundation for accounts, contacts, deals and activity.',
    // TABLES
    tables: [
      { name: 'Reps', fields: [serial(), required('Name'), text('Email'), text('Region'), num('Quarterly Quota'), text('Login')] },
      { name: 'Accounts', fields: [serial(), required('Name'), text('Industry'), text('Region'), num('Employees'), text('Website'), key('Owner ID'),
        calc('Owner Name', 'Reps::Name', 'text', true), today('Created'), text('Notes'),
        calc('Contacts Count', 'Count ( Contacts::ID )', 'number', true),
        calc('Open Pipeline', 'Sum ( Deals::Open Amount )', 'number', true),
        calc('Won Total', 'Sum ( Deals::Won Amount )', 'number', true),
        calc('Last Touch', 'Max ( Activities::When )', 'timestamp', true),
        calc('Days Quiet', 'Case ( IsEmpty ( Last Touch ) ; 0 ; Get ( CurrentDate ) - GetAsDate ( Last Touch ) )', 'number', true),
        calc('Health', 'Case ( Days Quiet > 30 or Sum ( Deals::Stale ) > 0 ; "At risk" ; Days Quiet > 14 ; "Watch" ; "Healthy" )', 'text', true)] },
      { name: 'Contacts', fields: [serial(), key('Account ID'), calc('Account Name', 'Accounts::Name', 'text', true), required('Name'), text('Role'), text('Email'), text('Phone'),
        calc('Last Contacted', 'Max ( Activities::When )', 'timestamp', true), text('Notes')] },
      { name: 'Deals', fields: [serial(), key('Account ID'), calc('Account Name', 'Accounts::Name', 'text', true), key('Owner ID'), calc('Owner Name', 'Reps::Name', 'text', true),
        required('Title'), initial('Stage', 'Lead'), num('Amount'), text('Source'), today('Opened'), date('Expected Close'), date('Closed'), text('Lost Reason'),
        { name: 'Stage Changed', type: 'timestamp', options: { autoEnter: { value: 'creationTimestamp' } } }, text('Notes'),
        calc('Probability', 'Case ( Stage = "Lead" ; 10 ; Stage = "Qualified" ; 25 ; Stage = "Proposal" ; 50 ; Stage = "Negotiation" ; 75 ; Stage = "Won" ; 100 ; 0 )'),
        calc('Weighted Amount', 'Amount * Probability / 100'),
        calc('Days In Stage', 'Get ( CurrentDate ) - GetAsDate ( Stage Changed )', 'number', true),
        calc('Stale', 'Case ( Stage = "Won" or Stage = "Lost" ; 0 ; Days In Stage > 14 ; 1 ; 0 )', 'number', true),
        calc('Quote Total', 'Sum ( Deal Lines::Line Total )', 'number', true),
        calc('Open Amount', 'Case ( Stage = "Won" or Stage = "Lost" ; 0 ; Amount )'),
        calc('Won Amount', 'Case ( Stage = "Won" ; Amount ; 0 )')] },
      { name: 'Activities', fields: [serial(), key('Account ID'), num('Contact ID'), num('Deal ID'), key('Rep ID'), text('Type'), required('Subject'),
        { name: 'When', type: 'timestamp', options: { autoEnter: { value: 'creationTimestamp' } } }, date('Due'), yesNo('Done'), text('Outcome'), text('Notes'),
        calc('Account Name', 'Accounts::Name', 'text', true), calc('Contact Name', 'Contacts::Name', 'text', true),
        calc('Deal Title', 'Deals::Title', 'text', true), calc('Rep Name', 'Reps::Name', 'text', true)] },
      { name: 'Email Log', fields: [serial(), key('Account ID'), num('Contact ID'), text('Direction'), text('Subject'), text('Body'),
        { name: 'Sent', type: 'timestamp' }, calc('Account Name', 'Accounts::Name', 'text', true), calc('Contact Name', 'Contacts::Name', 'text', true)] },
      { name: 'Products', fields: [serial(), text('SKU'), required('Name'), num('Unit Price'), initial('Active', 'Yes')] },
      { name: 'Deal Lines', fields: [serial(), key('Deal ID'), key('Product ID'), calc('Product Name', 'Products::Name', 'text', true), num('Quantity'), num('Unit Price'), num('Discount Percent'),
        calc('Line Total', 'Quantity * Unit Price * ( 1 - Discount Percent / 100 )')] },
    ],
    // RELATIONSHIPS
    relationships: [
      { left: 'Reps::ID', right: 'Accounts::Owner ID' }, { left: 'Reps::ID', right: 'Deals::Owner ID' }, { left: 'Reps::ID', right: 'Activities::Rep ID' },
      { left: 'Accounts::ID', right: 'Contacts::Account ID' }, { left: 'Accounts::ID', right: 'Deals::Account ID' },
      { left: 'Accounts::ID', right: 'Activities::Account ID' }, { left: 'Accounts::ID', right: 'Email Log::Account ID' },
      { left: 'Contacts::ID', right: 'Activities::Contact ID' }, { left: 'Contacts::ID', right: 'Email Log::Contact ID' },
      { left: 'Deals::ID', right: 'Activities::Deal ID' }, { left: 'Deals::ID', right: 'Deal Lines::Deal ID' },
      { left: 'Products::ID', right: 'Deal Lines::Product ID' },
    ],
    // VALUE LISTS
    valueLists: [
      { name: 'Stage', values: [...SHOWCASE_LISTS.stage] },
      { name: 'Industry', values: [...SHOWCASE_LISTS.industry] },
      { name: 'Region', values: [...SHOWCASE_LISTS.region] },
      { name: 'Lead source', values: [...SHOWCASE_LISTS.source] },
      { name: 'Activity type', values: [...SHOWCASE_LISTS.activityType] },
      { name: 'Lost reason', values: [...SHOWCASE_LISTS.lostReason] },
    ],
    popups: { 'Deals::Stage': 'Stage', 'Deals::Source': 'Lead source', 'Accounts::Industry': 'Industry', 'Accounts::Region': 'Region',
      'Reps::Region': 'Region', 'Activities::Type': 'Activity type', 'Deals::Lost Reason': 'Lost reason' },
    // SCRIPTS
    scripts: [
      { name: 'Advance stage', text: `# Moves an open deal one stage forward and records the change.
If [ IsEmpty ( Deals::ID ) ]
	Exit Script [ Result: "need a deal" ]
End If
If [ Deals::Stage = "Won" or Deals::Stage = "Lost" ]
	Exit Script [ Result: "already closed" ]
End If
Set Variable [ $old ; Value: Deals::Stage ]
Set Variable [ $next ; Value: Case ( $old = "Lead" ; "Qualified" ; $old = "Qualified" ; "Proposal" ; $old = "Proposal" ; "Negotiation" ; "" ) ]
If [ IsEmpty ( $next ) ]
	Exit Script [ Result: "close this deal instead" ]
End If
Set Variable [ $deal ; Value: Deals::ID ]
Set Variable [ $account ; Value: Deals::Account ID ]
Set Variable [ $rep ; Value: Deals::Owner ID ]
Set Field [ Deals::Stage ; $next ]
Set Field [ Deals::Stage Changed ; Get ( CurrentTimestamp ) ]
Commit Records/Requests [ With dialog: Off ]
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Account ID ; $account ]
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Rep ID ; $rep ]
Set Field [ Activities::Type ; "Note" ]
Set Field [ Activities::Subject ; "Stage changed from " & $old & " to " & $next ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "advanced" ]` },
      { name: 'Close deal', text: `# Closes the current deal. Pass Won or Lost|<reason>; a lost deal needs a reason.
Set Variable [ $status ; Value: GetValue ( Substitute ( Get ( ScriptParameter ) ; "|" ; ¶ ) ; 1 ) ]
Set Variable [ $reason ; Value: GetValue ( Substitute ( Get ( ScriptParameter ) ; "|" ; ¶ ) ; 2 ) ]
If [ $status ≠ "Won" and $status ≠ "Lost" or $status = "Lost" and IsEmpty ( $reason ) or $status = "Won" and not IsEmpty ( $reason ) ]
	Exit Script [ Result: "say Won or Lost|reason" ]
End If
If [ IsEmpty ( Deals::ID ) ]
	Exit Script [ Result: "need a deal" ]
End If
If [ Deals::Stage = "Won" or Deals::Stage = "Lost" ]
	Exit Script [ Result: "already closed" ]
End If
Set Variable [ $old ; Value: Deals::Stage ]
Set Variable [ $deal ; Value: Deals::ID ]
Set Variable [ $account ; Value: Deals::Account ID ]
Set Variable [ $rep ; Value: Deals::Owner ID ]
Set Field [ Deals::Stage ; $status ]
Set Field [ Deals::Closed ; Get ( CurrentDate ) ]
Set Field [ Deals::Stage Changed ; Get ( CurrentTimestamp ) ]
Set Field [ Deals::Lost Reason ; $reason ]
Commit Records/Requests [ With dialog: Off ]
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Account ID ; $account ]
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Rep ID ; $rep ]
Set Field [ Activities::Type ; "Note" ]
Set Field [ Activities::Subject ; "Stage changed from " & $old & " to " & $status ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "closed" ]` },
      { name: 'Log activity', text: `# Adds an activity to the current account or deal. Pass type|subject|notes.
Set Variable [ $type ; Value: GetValue ( Substitute ( Get ( ScriptParameter ) ; "|" ; ¶ ) ; 1 ) ]
Set Variable [ $subject ; Value: GetValue ( Substitute ( Get ( ScriptParameter ) ; "|" ; ¶ ) ; 2 ) ]
Set Variable [ $notes ; Value: GetValue ( Substitute ( Get ( ScriptParameter ) ; "|" ; ¶ ) ; 3 ) ]
If [ IsEmpty ( $type ) or IsEmpty ( $subject ) ]
	Exit Script [ Result: "need type|subject|notes" ]
End If
If [ Get ( LayoutTableName ) = "Deals" ]
	Set Variable [ $account ; Value: Deals::Account ID ]
	Set Variable [ $deal ; Value: Deals::ID ]
	Set Variable [ $rep ; Value: Deals::Owner ID ]
Else If [ Get ( LayoutTableName ) = "Accounts" ]
	Set Variable [ $account ; Value: Accounts::ID ]
	Set Variable [ $rep ; Value: Accounts::Owner ID ]
Else
	Exit Script [ Result: "need an account or deal" ]
End If
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Account ID ; $account ]
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Rep ID ; $rep ]
Set Field [ Activities::Type ; $type ]
Set Field [ Activities::Subject ; $subject ]
Set Field [ Activities::Notes ; $notes ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "logged" ]` },
      { name: 'Add follow-up', text: `# Adds a task for this account or deal. Pass a nonnegative whole number of days.
Set Variable [ $days ; Value: GetAsNumber ( Get ( ScriptParameter ) ) ]
If [ IsEmpty ( Get ( ScriptParameter ) ) or Filter ( Get ( ScriptParameter ) ; "0123456789" ) ≠ Get ( ScriptParameter ) ]
	Exit Script [ Result: "need days from today" ]
End If
If [ Get ( LayoutTableName ) = "Deals" ]
	Set Variable [ $account ; Value: Deals::Account ID ]
	Set Variable [ $deal ; Value: Deals::ID ]
	Set Variable [ $rep ; Value: Deals::Owner ID ]
Else If [ Get ( LayoutTableName ) = "Accounts" ]
	Set Variable [ $account ; Value: Accounts::ID ]
	Set Variable [ $rep ; Value: Accounts::Owner ID ]
Else
	Exit Script [ Result: "need an account or deal" ]
End If
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Account ID ; $account ]
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Rep ID ; $rep ]
Set Field [ Activities::Type ; "Task" ]
Set Field [ Activities::Subject ; "Follow up" ]
Set Field [ Activities::Due ; Get ( CurrentDate ) + $days ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "follow-up added" ]` },
      { name: 'Reassign owner', text: `# Assigns the current account or deal to the rep ID in the parameter.
Set Variable [ $rep ; Value: GetAsNumber ( Get ( ScriptParameter ) ) ]
If [ $rep ≤ 0 or Filter ( Get ( ScriptParameter ) ; "0123456789" ) ≠ Get ( ScriptParameter ) ]
	Exit Script [ Result: "need a rep id" ]
End If
If [ Get ( LayoutTableName ) = "Deals" ]
	Set Field [ Deals::Owner ID ; $rep ]
Else If [ Get ( LayoutTableName ) = "Accounts" ]
	Set Field [ Accounts::Owner ID ; $rep ]
Else
	Exit Script [ Result: "need an account or deal" ]
End If
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "reassigned" ]` },
      { name: 'Assign by region', text: `# Assigns an account to the next rep in its region, wrapping after the last ID.
If [ IsEmpty ( Accounts::ID ) ]
	Exit Script [ Result: "need an account" ]
End If
Set Variable [ $account ; Value: Accounts::ID ]
Set Variable [ $region ; Value: Accounts::Region ]
Set Variable [ $old ; Value: Accounts::Owner ID ]
If [ IsEmpty ( $region ) ]
	Exit Script [ Result: "need a region" ]
End If
Go to Layout [ "Reps" ]
Enter Find Mode
Set Field [ Reps::Region ; $region ]
Perform Find
If [ Get ( FoundCount ) = 0 ]
	Exit Script [ Result: "no rep in region" ]
End If
Sort Records [ Restore; Reps::ID; ascending ; With dialog: Off ]
Go to Record/Request/Page [ First ]
Set Variable [ $chosen ; Value: Reps::ID ]
Loop
	Exit Loop If [ Reps::ID > $old ]
	Exit Loop If [ Get ( RecordNumber ) = Get ( FoundCount ) ]
	Go to Record/Request/Page [ Next ]
End Loop
If [ Reps::ID > $old ]
	Set Variable [ $chosen ; Value: Reps::ID ]
End If
Go to Layout [ "Accounts" ]
Enter Find Mode
Set Field [ Accounts::ID ; $account ]
Perform Find
Set Field [ Accounts::Owner ID ; $chosen ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "assigned" ]` },
      { name: 'Mark task done', text: `# Finds the activity by its ID field value and marks it complete.
Set Variable [ $id ; Value: Get ( ScriptParameter ) ]
If [ IsEmpty ( $id ) or Filter ( $id ; "0123456789" ) ≠ $id ]
	Exit Script [ Result: "no such task" ]
End If
Go to Layout [ "Activities" ]
Enter Find Mode
Set Field [ Activities::ID ; $id ]
Perform Find
If [ Get ( FoundCount ) = 0 ]
	Exit Script [ Result: "no such task" ]
End If
Set Field [ Activities::Done ; "Yes" ]
Set Field [ Activities::Outcome ; "Done" ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "done" ]` },
      { name: 'Go to record', text: `# Finds the ID field value on the current layout and shows that record.
Set Variable [ $id ; Value: Get ( ScriptParameter ) ]
If [ IsEmpty ( $id ) or Filter ( $id ; "0123456789" ) ≠ $id ]
	Exit Script [ Result: "not found" ]
End If
Set Variable [ $table ; Value: Get ( LayoutTableName ) ]
Enter Find Mode
Set Field By Name [ $table & "::ID" ; $id ]
Perform Find
If [ Get ( FoundCount ) = 0 ]
	Exit Script [ Result: "not found" ]
End If
Go to Record/Request/Page [ First ]
Exit Script [ Result: "ok" ]` },
      { name: 'Add onboarding task', text: `# Adds an onboarding task due in three days for the current deal.
If [ not IsEmpty ( Get ( ScriptParameter ) ) ]
	Exit Script [ Result: "no parameter needed" ]
End If
If [ IsEmpty ( Deals::ID ) ]
	Exit Script [ Result: "need a deal" ]
End If
Set Variable [ $account ; Value: Deals::Account ID ]
Set Variable [ $rep ; Value: Deals::Owner ID ]
Set Variable [ $deal ; Value: Deals::ID ]
Go to Layout [ "Activities" ]
New Record/Request
Set Field [ Activities::Account ID ; $account ]
Set Field [ Activities::Deal ID ; $deal ]
Set Field [ Activities::Rep ID ; $rep ]
Set Field [ Activities::Subject ; "Onboarding kickoff" ]
Set Field [ Activities::Type ; "Task" ]
Set Field [ Activities::Due ; Get ( CurrentDate ) + 3 ]
Commit Records/Requests [ With dialog: Off ]
Exit Script [ Result: "onboarding added" ]` },
    ],
    // LAYOUTS
    layouts: ['Reps', 'Accounts', 'Contacts', 'Deals', 'Activities', 'Email Log', 'Products', 'Deal Lines'].map((table) => ({ table })),
    // REPORTS
    reports: [],
    // PRIVILEGES
    privilegeSets: [
      { name: 'Rep', comment: 'Can view and change only records owned by the signed-in rep; cannot delete or change the design.',
        records: { view: true, create: true, edit: true, delete: false },
        tables: {
          Reps: { view: 'Login = Get ( AccountName )', edit: false, create: false, delete: false },
          Accounts: { view: 'Reps::Login = Get ( AccountName )', edit: 'Reps::Login = Get ( AccountName )', create: true, delete: false },
          Contacts: { view: 'Accounts::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', edit: 'Accounts::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', create: true, delete: false },
          Deals: { view: 'Reps::Login = Get ( AccountName )', edit: 'Reps::Login = Get ( AccountName )', create: true, delete: false },
          Activities: { view: 'Reps::Login = Get ( AccountName )', edit: 'Reps::Login = Get ( AccountName )', create: true, delete: false },
          'Email Log': { view: 'Accounts::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', edit: 'Accounts::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', create: true, delete: false },
          Products: { view: true, edit: false, create: false, delete: false },
          'Deal Lines': { view: 'Deals::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', edit: 'Deals::Owner ID = GetAsNumber ( ExecuteSQL ( "SELECT ID FROM Reps WHERE Login = ?" ; "" ; "" ; Get ( AccountName ) ) )', create: true, delete: false },
        } },
      { name: 'Manager', comment: 'Can view, create and edit all records without deleting or changing the design.', records: { view: true, create: true, edit: true, delete: false } },
      { name: 'Executive', comment: 'Can view records but cannot create, edit, delete or change the design.', records: { view: true, create: false, edit: false, delete: false } },
    ],
    // SAMPLE
    sample: showcaseSample(now),
    extras: 'crm-showcase',
  };
}

/** Saved in the file so `tabularius script-tests` checks the parameter guards offline. */
export function showcaseScriptTests(store: Store) {
  const id = (name: string) => store.schema.scripts.find((script) => script.name === name)!.id;
  return [
    { script: id('Advance stage'), name: 'requires a current deal', given: { layout: 'Deals' }, expect: { result: 'need a deal', error: 0 } },
    { script: id('Close deal'), name: 'rejects an invalid close parameter', given: { layout: 'Deals', parameter: 'Lost' }, expect: { result: 'say Won or Lost|reason', error: 0 } },
    { script: id('Log activity'), name: 'requires type and subject', given: { layout: 'Accounts', parameter: 'Call||note' }, expect: { result: 'need type|subject|notes', error: 0 } },
  ];
}
