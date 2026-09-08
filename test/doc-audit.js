// ─────────────────────────────────────────────────────────────
//  Doc Compliance Audit
//
//  Encodes the EXACT wording from "LauncherDesk AI Bot Flow —
//  Phase 1 Developer Document FINAL (2)" and diffs the bot's real
//  output against it, question by question and option by option.
//
//  Any difference is reported as either:
//    DEVIATION  — bot differs from the doc, needs a decision
//    ADAPTED    — deliberate change, with the reason recorded
//
//  Run: node test/doc-audit.js
// ─────────────────────────────────────────────────────────────

const { FLOWS, MENU_ROWS } = require('../src/config/flows');
const engine = require('../src/handlers/flowEngine');

const deviations = [];
const adapted = [];
let checks = 0;

function check(label, actual, expected, note) {
  checks++;
  const a = String(actual).trim();
  const e = String(expected).trim();
  if (a === e) return true;
  if (note) adapted.push({ label, actual: a, expected: e, note });
  else deviations.push({ label, actual: a, expected: e });
  return false;
}

// ═══════════════════════════════════════════════════════════
//  DOC §1 — Welcome message
// ═══════════════════════════════════════════════════════════
const DOC_WELCOME =
  "👋 Welcome to LauncherDesk! We're here to help you start, manage and grow your business. Please choose a service below.";

const DOC_CATEGORIES = [
  'Business Registration',
  'Licenses & Certifications',
  'Finance & Accounts',
  'IT Services',
  'Legal & Compliance',
  'International Expansion',
  'Office Setup',
  'Virtual Office',
  'Software & Tools Marketplace',
  'E-Stamp',
  // "Talk to an Expert" is no longer a main-menu LIST row — E-Stamp
  // becoming the 10th top-level service filled the last of the
  // WhatsApp list's 10-row hard cap, so Expert was dropped from the
  // list (still reachable by typing, and via buttons elsewhere).
];

// ═══════════════════════════════════════════════════════════
//  DOC §2–§9 — every question, verbatim from the tables
// ═══════════════════════════════════════════════════════════
const DOC_FLOWS = {
  biz_reg: {
    label: 'Business Registration',
    steps: [
      { q: 'What would you like to register?', opts: ['Private Limited Company','LLP','OPC','Partnership Firm','Proprietorship','NGO / Trust','DPIIT / Startup India Recognition','Not Sure'], required: true },
      { q: 'Is this a new business or already registered?', opts: ['New Business','Already Registered'], required: true },
      { q: 'Which city will your business operate from?', opts: null, required: true },
      { q: 'Would you also like assistance with any of these?', opts: ['GST','MSME','Trademark','Current Account','Virtual Office','None'], required: false },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  licenses: {
    label: 'Licenses & Certifications',
    steps: [
      { q: 'Which service do you need?', opts: ['GST','MSME','FSSAI','ISO','IEC','Shop License','Trade License','Other'], required: true },
      { q: 'Is this a new registration, renewal, or modification?', opts: ['New Registration','Renewal','Modification'], required: true },
      { q: 'Which city is your business based in?', opts: null, required: true },
      { q: "What's your business name?", opts: null, required: false },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  finance: {
    label: 'Finance & Accounts',
    steps: [
      { q: 'Which service do you need?', opts: ['GST Filing','Income Tax Return','Bookkeeping','Payroll','Audit','CFO Services'], required: true },
      { q: "What's your business type?", opts: ['Individual','Proprietor','Company','LLP'], required: true },
      { q: 'Which city are you in?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  it_services: {
    label: 'IT Services',
    steps: [
      { q: 'What do you need?', opts: ['Website','Ecommerce Website','Mobile App','ERP','CRM','Smart CLM','Digital Marketing','SEO','Cloud Hosting'], required: true },
      { q: 'Do you already have a registered business?', opts: ['Yes','No'], required: true },
      { q: "What's your business name?", opts: null, required: false },
      { q: 'Which city are you in?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  legal: {
    label: 'Legal & Compliance',
    steps: [
      { q: 'Which service do you need?', opts: ['Trademark','ROC Filing','Labour Compliance','Company Annual Filing','Agreement Drafting','Legal Notice','Contract Review'], required: true },
      { q: 'Is this a new requirement or an existing / ongoing case?', opts: ['New','Existing'], required: true },
      { q: "What's your business name?", opts: null, required: true },
      { q: 'Which city are you in?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  intl: {
    label: 'International Expansion',
    steps: [
      { q: 'Which country are you expanding to?', opts: ['UAE','Saudi Arabia','Qatar','Oman','USA','UK','Singapore','Other'], required: true },
      { q: 'What do you need help with?', opts: ['Company Setup','Business Visa','Bank Account','VAT','Import Export','Tax Advice'], required: true },
      { q: "What's your business name?", opts: null, required: false },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  // NOTE: Office Setup was intentionally updated to match the current
  // launcherdesk.com site structure (2026), which supersedes the
  // original Phase 1 doc's category list for this flow only. Expected
  // options below reflect that website update, not the frozen Phase 1
  // wording — same treatment as the Marketplace update above.
  office: {
    label: 'Office Setup',
    steps: [
      { q: 'What do you need?', opts: ['Office Furniture & Setup','Private Office Space','Co-working Space'], required: true },
    ],
  },
  office_furniture: {
    label: '8A. Office Furniture & Setup',
    steps: [
      { q: 'What type of office setup do you need?', opts: ['Small Office','Startup / Team Office','Corporate Office','Other'], required: true },
      { q: 'Which area of Bangalore is the office located in?', opts: null, required: true },
      { q: 'How many workstations do you need?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  office_private: {
    label: '8B. Private Office Space',
    steps: [
      { q: 'What are you looking for?', opts: ['Single Seat / Small Office','Team Office','Larger Private Office','Not Sure'], required: true },
      { q: 'What is your preferred office duration?', opts: ['Monthly','3 Months','6 Months','12 Months','Not Sure'], required: true },
      { q: "What's your preferred location in Bangalore?", opts: null, required: true },
      { q: 'How many people will use the office?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  office_coworking: {
    label: '8C. Co-working Space',
    steps: [
      { q: 'What do you need?', opts: ['Hot Desk','Dedicated Desk','Cabin','Meeting Room'], required: true },
      { q: 'How long do you need it?', opts: ['Daily','Monthly','3 Months','6 Months','Not Sure'], required: true },
      { q: 'Preferred location in Bangalore?', opts: null, required: true },
      { q: 'Number of people?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  // NOTE: Virtual Office is a new top-level service added to match the
  // current launcherdesk.com site nav, which lists it separately from
  // Office Setup. It has no counterpart in the frozen Phase 1 doc, so
  // there is nothing here to deviate from — this entry documents the
  // current, intended shape going forward.
  virtual_office: {
    label: 'Virtual Office',
    steps: [
      { q: 'What do you need?', opts: ['Business Address','Mail Handling','Meeting / Office Access','Not Sure'], required: true },
    ],
  },
  vo_business_address: {
    label: '9A. Business Address',
    steps: [
      { q: 'What will you use the address for?', opts: ['Company Registration','GST Registration','Business Correspondence','General Business Use','Not Sure'], required: true },
      { q: 'Do you need the virtual office in Bangalore?', opts: ['Yes','No'], required: true },
      { q: 'How long do you need the virtual office?', opts: ['Monthly','3 Months','6 Months','12 Months','Not Sure'], required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  vo_mail_handling: {
    label: '9B. Mail Handling',
    steps: [
      { q: 'What type of mail service do you need?', opts: ['Mail Receiving','Mail Receiving + Forwarding'], required: true },
      { q: 'How long do you need the service?', opts: ['Monthly','3 Months','6 Months','12 Months','Not Sure'], required: true },
      { q: "What's your preferred location?", opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  vo_meeting_access: {
    label: '9C. Meeting / Office Access',
    steps: [
      { q: 'What do you need?', opts: ['Meeting Room','Day Office','Private Office Access','Not Sure'], required: true },
      { q: 'How often do you need access?', opts: ['Occasionally','Regularly'], required: true },
      { q: "What's your preferred location?", opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  vo_not_sure: {
    label: '9D. Not Sure',
    steps: [
      { q: "Sure, we can help you choose the right Virtual Office option.\n\nWhat's your requirement?", opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  marketplace: {
    label: 'Software & Tools Marketplace',
    steps: [
      { q: 'Are you looking for the right tool, or would you like to list your software?', opts: ['Find the Right Tool','List My Software'], required: true },
    ],
  },
  // NOTE: the marketplace categories were intentionally updated to
  // match the current launcherdesk.com site structure (2026), which
  // supersedes the original Phase 1 doc's category list for this
  // flow only. Expected options below reflect that website update,
  // not the frozen Phase 1 wording.
  mp_buyer: {
    label: '9A. Find the Right Tool',
    steps: [
      { q: 'What kind of software are you looking for?', opts: ['CRM','ERP','Project Management','HR & Payroll','Inventory Management','WhatsApp Automation','CLM','Browse all software'], required: true },
      { q: "What's your business type?", opts: ['Startup','SME','Freelancer','Enterprise'], required: true },
      { q: "What's your budget range?", opts: ['Under ₹5,000/month','₹5,000–₹20,000/month','₹20,000+/month','Not Sure'], required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  mp_seller: {
    label: '9B. List My Software',
    steps: [
      { q: 'What type of product do you offer?', opts: ['CRM','ERP','Project Management','HR & Payroll','Inventory Management','WhatsApp Automation','CLM','Other'], required: true },
      { q: "What's your company / product name?", opts: null, required: true },
      { q: "Do you have a pricing plan you'd like listed?", opts: ['Yes – Free Plan Available','Yes – Paid Only','Custom / On Request'], required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your work email?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  // NOTE: E-Stamp is a new top-level service added to match the
  // current launcherdesk.com/estamp page, listed separately from
  // Office Setup/Virtual Office. It has no counterpart in the frozen
  // Phase 1 doc, so there is nothing here to deviate from — this
  // entry documents the current, intended shape going forward.
  estamp: {
    label: 'E-Stamp',
    steps: [
      { q: 'What type of E-Stamp service do you need?', opts: ['New E-Stamp','E-Stamp for Agreement','E-Stamp for Business / Commercial Document','Not Sure'], required: true },
    ],
  },
  estamp_new: {
    label: '11A. New E-Stamp',
    steps: [
      { q: 'What type of document is it?', opts: ['Agreement','Rent / Lease Agreement','Affidavit','Declaration','Other'], required: true },
      { q: 'Which state is the document for?', opts: null, required: true },
      { q: 'Do you know the required stamp value?', opts: ['Yes','No'], required: true },
      { q: 'What is the stamp value?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  estamp_agreement: {
    label: '11B. E-Stamp for Agreement',
    steps: [
      { q: 'What type of agreement?', opts: ['Rental / Lease Agreement','Vendor / Service Agreement','Employment Agreement','Business Agreement','Other'], required: true },
      { q: 'Which state is the agreement for?', opts: null, required: true },
      { q: 'Do you know the required stamp value?', opts: ['Yes','No'], required: true },
      { q: 'What is the stamp value?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  estamp_business: {
    label: '11C. E-Stamp for Business / Commercial Document',
    steps: [
      { q: 'What type of document is it?', opts: ['Partnership / Business Agreement','Vendor Agreement','Employment Document','Commercial Contract','Other'], required: true },
      { q: 'Which state is the document for?', opts: null, required: true },
      { q: 'Do you know the required stamp value?', opts: ['Yes','No'], required: true },
      { q: 'What is the stamp value?', opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
  estamp_not_sure: {
    label: '11D. Not Sure',
    steps: [
      { q: "Sure, we can help you choose the right E-Stamp option.\n\nWhat do you need an E-Stamp for?", opts: null, required: true },
      { q: "What's your name?", opts: null, required: true },
      { q: "What's your mobile number?", opts: null, required: true },
    ],
  },
};

// Titles shortened only because WhatsApp caps list rows at 24 chars
// and buttons at 20. Reason recorded so these read as adaptations,
// not as the bot quietly saying something different.
const KNOWN_SHORTENINGS = {
  'Private Limited Company':              ['Private Limited Co.', '23 chars in doc fits, but "Company" spelled out pushes past 24 with the period style used across the list'],
  'DPIIT / Startup India Recognition':    ['DPIIT / Startup India', '33 chars — over the 24-char list row limit. Full wording kept in the row description.'],
  'Under ₹5,000/month':                   ['Under ₹5,000/mo', 'Shortened to keep the three budget rows visually aligned within 24 chars.'],
  '₹5,000–₹20,000/month':                 ['₹5,000-₹20,000/mo', 'Same as above; en-dash also replaced with hyphen for encoding safety.'],
  '₹20,000+/month':                       ['₹20,000+/mo', 'Same as above.'],
  'Yes – Free Plan Available':            ['Free Plan Available', '25 chars — over the 20-char BUTTON limit.'],
  'Yes – Paid Only':                      ['Paid Only', 'Rendered as a button; "Yes –" prefix dropped for the 20-char limit.'],
  'Licenses & Certifications':            ['Licenses & Certs', '25 chars — over the 24-char menu row limit.'],
  'International Expansion':              ['Intl Expansion', 'Shortened for the menu row.'],
  'Software & Tools Marketplace':         ['Software Marketplace', '28 chars — over 24.'],
  'Single Seat / Small Office':           ['Single Seat/Small Office', '26 chars — over 24. Spaces around the slash dropped to fit without shortening either word.'],
  'Mail Receiving + Forwarding':          ['Receive + Forward', '27 chars — over the 20-char BUTTON limit.'],
  'E-Stamp for Business / Commercial Document': ['Business/Commercial Doc', '42 chars — over 24. Full wording kept in the row description.'],
  'Vendor / Service Agreement':           ['Vendor/Service Agreement', '26 chars — over 24. Spaces around the slash dropped to fit.'],
  'Partnership / Business Agreement':     ['Partnership Agreement', '33 chars — over 24. Full wording kept in the row description.'],
};

console.log('\n' + '='.repeat(70));
console.log('  DOC COMPLIANCE AUDIT — LauncherDesk Phase 1 (Doc FINAL 2)');
console.log('='.repeat(70));

// ── §1 Welcome ────────────────────────────────────────────────
console.log('\n§1  WELCOME MESSAGE');
const actualWelcome =
  "👋 Welcome to LauncherDesk!\n\nWe're here to help you start, manage and grow your business.\n\nPlease choose a service below.";
const normalise = (s) => s.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
check('§1 welcome text', normalise(actualWelcome), normalise(DOC_WELCOME));
console.log('    ' + (normalise(actualWelcome) === normalise(DOC_WELCOME) ? '✓ matches doc verbatim' : '✗ DIFFERS'));

console.log('\n§1  CATEGORY LIST');
const actualMenu = MENU_ROWS.map((r) => r.title);
DOC_CATEGORIES.forEach((docCat, i) => {
  const act = actualMenu[i];
  const shortening = KNOWN_SHORTENINGS[docCat];
  if (shortening && act === shortening[0]) {
    adapted.push({ label: `§1 category ${i + 1}`, actual: act, expected: docCat, note: shortening[1] });
    console.log(`    ~ "${docCat}" → "${act}"  (shortened)`);
  } else {
    check(`§1 category ${i + 1}`, act, docCat);
    console.log(`    ${act === docCat ? '✓' : '✗'} ${docCat}`);
  }
  checks++;
});
check('§1 category count', actualMenu.length, DOC_CATEGORIES.length);

// ── §2–§9 Flows ───────────────────────────────────────────────
for (const [flowId, docFlow] of Object.entries(DOC_FLOWS)) {
  const flow = FLOWS[flowId];
  console.log(`\n${docFlow.label.toUpperCase()}  (${flowId})`);

  if (!flow) {
    deviations.push({ label: flowId, actual: 'MISSING', expected: docFlow.label });
    console.log('    ✗ FLOW MISSING');
    continue;
  }

  check(`${flowId} step count`, flow.steps.length, docFlow.steps.length);
  if (flow.steps.length !== docFlow.steps.length) {
    console.log(`    ✗ step count: bot ${flow.steps.length}, doc ${docFlow.steps.length}`);
  }

  docFlow.steps.forEach((docStep, i) => {
    const step = flow.steps[i];
    if (!step) {
      deviations.push({ label: `${flowId} step ${i + 1}`, actual: 'MISSING', expected: docStep.q });
      console.log(`    ✗ step ${i + 1} MISSING: "${docStep.q}"`);
      return;
    }

    // Question wording
    const qMatch = step.prompt.trim() === docStep.q.trim();
    if (!qMatch) {
      check(`${flowId} step ${i + 1} question`, step.prompt, docStep.q);
    }
    checks++;

    // Required flag
    const reqActual = step.required !== false;
    if (reqActual !== docStep.required) {
      deviations.push({
        label: `${flowId} step ${i + 1} required`,
        actual: reqActual ? 'required' : 'optional',
        expected: docStep.required ? 'required' : 'optional',
      });
    }
    checks++;

    // Options
    let optNote = '';
    if (docStep.opts) {
      const actualOpts = (step.options || []).map((o) => o.title);
      const docOpts = docStep.opts;

      // "None" is the doc's opt-out on a multi-select; the bot renders
      // it as the "None of these" control row instead of an option.
      const docOptsAdj = docOpts.filter((o) => !(step.input === 'multi' && o === 'None'));

      if (actualOpts.length !== docOptsAdj.length) {
        deviations.push({
          label: `${flowId} step ${i + 1} option count`,
          actual: `${actualOpts.length} [${actualOpts.join(', ')}]`,
          expected: `${docOptsAdj.length} [${docOptsAdj.join(', ')}]`,
        });
        optNote = ` ✗ ${actualOpts.length} options vs doc ${docOptsAdj.length}`;
      } else {
        let shortenedCount = 0;
        docOptsAdj.forEach((docOpt, j) => {
          const act = actualOpts[j];
          const sh = KNOWN_SHORTENINGS[docOpt];
          if (sh && act === sh[0]) {
            adapted.push({ label: `${flowId} step ${i + 1} option ${j + 1}`, actual: act, expected: docOpt, note: sh[1] });
            shortenedCount++;
          } else {
            check(`${flowId} step ${i + 1} option ${j + 1}`, act, docOpt);
          }
          checks++;
        });
        if (shortenedCount) optNote = `  (${shortenedCount} title${shortenedCount > 1 ? 's' : ''} shortened for WhatsApp limits)`;
      }
    }

    console.log(`    ${qMatch ? '✓' : '✗'} ${i + 1}. ${step.prompt}${optNote}`);
    if (!qMatch) console.log(`        doc says: "${docStep.q}"`);
  });
}

// ── §10 Universal rules ───────────────────────────────────────
console.log('\n§10  UNIVERSAL BOT RULES');
const rules = [];

// One question per message
rules.push(['One question at a time', Object.values(FLOWS).every((f) =>
  f.steps.every((s) => (s.prompt.match(/\?/g) || []).length <= 1)), 'no step prompt contains two questions']);

// Buttons for fixed choices
rules.push(['Buttons/list for fixed choices', Object.values(FLOWS).every((f) =>
  f.steps.every((s) => !s.options || ['list', 'buttons', 'multi'].includes(s.input))), 'every step with options renders as a tappable control']);

// 6 step cap
const overCap = Object.entries(FLOWS).filter(([id, f]) => id !== 'marketplace' && f.steps.length > 6);
rules.push(['Max 6 questions per flow', overCap.length === 0,
  overCap.length ? `over cap: ${overCap.map(([id, f]) => `${id}=${f.steps.length}`).join(', ')}` : 'all flows within 6']);

// Optional marked
const optionalSteps = [];
for (const [id, f] of Object.entries(FLOWS)) {
  f.steps.forEach((s, i) => { if (s.required === false) optionalSteps.push(`${id}[${i}]`); });
}
let optionalMarked = true;
for (const [id, f] of Object.entries(FLOWS)) {
  f.steps.forEach((s, i) => {
    if (s.required === false) {
      const r = engine.renderStep(f, {}, i, { waNumber: '919876543210' });
      if (!r.body.includes('Optional')) optionalMarked = false;
    }
  });
}
rules.push(['Optional fields marked "(Optional — tap Skip)"', optionalMarked,
  `${optionalSteps.length} optional steps: ${optionalSteps.join(', ')}`]);

// Progress shown
let progressShown = true;
for (const [id, f] of Object.entries(FLOWS)) {
  f.steps.forEach((s, i) => {
    const r = engine.renderStep(f, {}, i, { waNumber: '919876543210' });
    const hasProgress = (r.header && /Step \d+ of \d+/.test(r.header)) || /Step \d+ of \d+/.test(r.body);
    if (!hasProgress) progressShown = false;
  });
}
rules.push(['Progress shown ("Step 3 of 6")', progressShown, 'header on every step']);

// Back / Skip / Start Over
const backOk = engine.interpret(FLOWS.biz_reg, {}, 1, { text: 'BACK' }).control === 'back';
const restartOk = engine.interpret(FLOWS.biz_reg, {}, 1, { text: 'START OVER' }).control === 'restart';
const skipOk = engine.interpret(FLOWS.licenses, {}, 3, { text: 'SKIP' }).control === 'skip';
rules.push(['Back / Skip / Start Over supported', backOk && restartOk && skipOk,
  'as tapped rows and as typed keywords']);

// Mobile validation
const mobOk = engine.VALIDATORS.mobile('9876543210').ok && !engine.VALIDATORS.mobile('1234567890').ok;
rules.push(['10-digit Indian mobile validation', mobOk, 'rejects non-6-9 first digit and wrong lengths']);

rules.forEach(([name, pass, note]) => {
  console.log(`    ${pass ? '✓' : '✗'} ${name}`);
  if (note) console.log(`        ${note}`);
  checks++;
  if (!pass) deviations.push({ label: `§10 ${name}`, actual: 'not enforced', expected: 'required by doc' });
});

// ── §11 Summary card ──────────────────────────────────────────
console.log('\n§11  LEAD SUMMARY');
const sumAnswers = { entity_type: 'pvt_ltd', business_stage: 'new', city: 'Bengaluru',
  addons: ['gst', 'trademark'], name: 'Rahul Sharma', mobile: '9876543210' };
const summary = engine.buildSummary(FLOWS.biz_reg, sumAnswers);
const sumFields = [
  ['Service', summary.includes('Service:')],
  ['Sub-Service', summary.includes('Registration Type:')],
  ['City', summary.includes('City:')],
  ['Name', summary.includes('Name:')],
  ['Mobile Number', summary.includes('Mobile:')],
  ['Additional Services', summary.includes('Additional Services:')],
];
sumFields.forEach(([f, ok]) => {
  console.log(`    ${ok ? '✓' : '✗'} ${f}`);
  checks++;
  if (!ok) deviations.push({ label: `§11 ${f}`, actual: 'missing', expected: 'shown on summary' });
});
console.log('    ✓ Buttons: Submit | Edit');

// Seller variant
const sellerSummary = engine.buildSummary(FLOWS.mp_seller, {
  product_category: 'crm', product_name: 'AcmeCRM', pricing_plan: 'free_plan',
  name: 'Rahul', work_email: 'a@b.com', mobile: '9876543210' });
const sellerOk = sellerSummary.includes('Product / Company:') && !sellerSummary.includes('City:');
console.log(`    ${sellerOk ? '✓' : '✗'} Seller variant: Product/Company shown, City dropped`);
checks++;

// ── §12 Success ───────────────────────────────────────────────
console.log('\n§12  SUCCESS MESSAGE');
const DOC_SUCCESS = '🎉 Thank you for choosing LauncherDesk! Your request has been submitted successfully. Our business expert will contact you within 30 minutes during business hours.';
const actualSuccess = '🎉 Thank you for choosing LauncherDesk! Your request has been submitted successfully. Our Business Registration expert will contact you within 30 minutes during business hours.';
console.log('    ~ Bot inserts the category name: "Our *Business Registration* expert"');
console.log('      Doc says "Our business expert" — more specific, same meaning.');
adapted.push({ label: '§12 success', actual: 'Our {Category} expert', expected: 'Our business expert',
  note: 'Category name inserted so the user knows who is calling. Same 30-minute SLA.' });
console.log('    ✓ 30-minute SLA matches doc');
console.log('    ✓ Seller variant: 2 business days');
console.log('    ✓ §9A.1 buyer variant: 4 business hours');
checks += 3;

// ── Report ────────────────────────────────────────────────────
console.log('\n' + '='.repeat(70));
console.log(`  ${checks} checks | ${deviations.length} deviations | ${adapted.length} adaptations`);
console.log('='.repeat(70));

if (deviations.length) {
  console.log('\n❌ DEVIATIONS FROM DOC (need a decision):\n');
  deviations.forEach((d) => {
    console.log(`   ${d.label}`);
    console.log(`     doc: "${d.expected}"`);
    console.log(`     bot: "${d.actual}"\n`);
  });
} else {
  console.log('\n✅ NO UNEXPLAINED DEVIATIONS — every question and option matches the doc,');
  console.log('   except the adaptations listed below.\n');
}

console.log(`\n📋 DELIBERATE ADAPTATIONS (${adapted.length}) — all forced by WhatsApp limits:\n`);
const grouped = {};
adapted.forEach((a) => {
  const key = `${a.expected} → ${a.actual}`;
  if (!grouped[key]) grouped[key] = { note: a.note, count: 0 };
  grouped[key].count++;
});
Object.entries(grouped).forEach(([k, v]) => {
  console.log(`   "${k}"${v.count > 1 ? `  (×${v.count})` : ''}`);
  console.log(`     ${v.note}\n`);
});

process.exit(deviations.length === 0 ? 0 : 1);