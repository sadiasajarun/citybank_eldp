/** Individual development requests (FR 188): fictional demonstration data shared by the store and the TNA screens. */
export interface IdpRequest { id: string; personId: string; area: string; learning: string; status: string; submitted: string; note: string; related: boolean }
export const IDP_REQUESTS: IdpRequest[] = [
  { id: 'IDP-2026-0141', personId: 'e1', area: 'Credit Analysis', learning: 'Advanced risk assessment training', status: 'Pending division review', submitted: '3 Nov 2026', note: 'I review mid-corporate credit proposals and want to move from level 2 to level 4 this year.', related: true },
  { id: 'IDP-2026-0147', personId: 'e2', area: 'Client relationship risk', learning: 'Credit portfolio workshop', status: 'Needs review', submitted: '5 Nov 2026', note: 'Two of my clients are on the watch list. I need to read early-warning signals sooner.', related: true },
  { id: 'IDP-2026-0152', personId: 'n5', area: 'Financial modelling', learning: 'Risk analysis programme', status: 'Pending', submitted: '7 Nov 2026', note: 'I build cash-flow models for credit memos and want structured training.', related: true },
];
/** The employees behind a set of development requests. */
export const idpPeople = (ids: string[]) => IDP_REQUESTS.filter((r) => ids.includes(r.id)).map((r) => r.personId);
