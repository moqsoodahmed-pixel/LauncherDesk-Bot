// ─────────────────────────────────────────────────────────────
//  LauncherDesk — Declarative Flow Definitions (Phase 1)
//  Source of truth: "LauncherDesk AI Bot Flow — Phase 1
//  Developer Document FINAL (2)"
//
//  WHY DECLARATIVE:
//  8 categories x ~6 steps = ~50 questions. Hard-coding these as
//  switch cases is unmaintainable — the client will change wording
//  weekly. Everything lives here as data; flowEngine.js executes it.
//  To change a question, edit this file only. No engine changes.
//
//  WHATSAPP HARD LIMITS baked into these definitions:
//   - Reply buttons: max 3, title <= 20 chars
//   - List rows: max 10 TOTAL across all sections, title <= 24 chars,
//     description <= 72 chars
//   - No native multi-select (see input:'multi' for the workaround)
//
//  STEP SHAPE:
//   key        unique field name, stored in session.answers[key]
//   label      human label used on the summary card
//   prompt     the question text sent to the user
//   input      'list' | 'buttons' | 'text' | 'multi'
//   options    [{ id, title, description? }]  (list/buttons/multi)
//   required   false => user gets a Skip control
//   validate   'mobile' | 'email' | 'name' | 'city' | 'free'
//   skipIf     fn(answers) => true to skip this step entirely
//   branchTo   fn(value) => flowId, hands off to another flow
//   exitAction fn(value) => 'visit_website' to leave the flow and
//              perform a side action instead of advancing/branching
//   listButton CTA label on the list widget (<= 20 chars)
// ─────────────────────────────────────────────────────────────

// Reused across marketplace buyer/seller paths
const TOOL_CATEGORIES = [
  { id: 'crm',        title: 'CRM',                  description: 'Sales & customer pipelines' },
  { id: 'erp',        title: 'ERP',                  description: 'Run your whole operation' },
  { id: 'pm',         title: 'Project Management',   description: 'Plan, track & ship work' },
  { id: 'hr',         title: 'HR & Payroll',         description: 'Hiring, PF/ESI, salaries' },
  { id: 'inventory',  title: 'Inventory Management', description: 'Stock, warehouses, orders' },
  { id: 'wa_automation', title: 'WhatsApp Automation', description: 'Bots, broadcasts & flows' },
  { id: 'clm',        title: 'CLM',                  description: 'In collaboration with Doqfy' },
];

// ── Standard closing steps (name + mobile) ────────────────────
// Mobile is PRE-FILLED from the WhatsApp number and confirmed with
// a button instead of re-typed. The doc asks for a mobile number;
// asking a user to type the number they are already messaging from
// is the single biggest drop-off point in a WhatsApp flow. Tapping
// "Yes, use this" satisfies the requirement in one tap, and
// "Use another number" still gives the typed-entry path with the
// doc's 10-digit validation.
const STEP_NAME = {
  key: 'name',
  label: 'Name',
  prompt: "What's your name?",
  input: 'text',
  required: true,
  validate: 'name',
};

const STEP_MOBILE = {
  key: 'mobile',
  label: 'Mobile Number',
  // Doc §2–§9 wording, verbatim. The pre-fill confirmation below is a
  // UX adaptation, but the question the user reads is exactly the
  // doc's — there was no reason to reword it as well.
  prompt: "What's your mobile number?",
  input: 'mobile_confirm',
  required: true,
  validate: 'mobile',
};

const FLOWS = {

  // ═══════════════════════════════════════════════════════════
  //  2. Business Registration
  // ═══════════════════════════════════════════════════════════
  biz_reg: {
    id: 'biz_reg',
    label: 'Business Registration',
    menu: { title: 'Business Registration', description: 'Pvt Ltd, LLP, OPC, NGO & more' },
    steps: [
      {
        key: 'entity_type',
        label: 'Registration Type',
        prompt: 'What would you like to register?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'pvt_ltd',     title: 'Private Limited Co.',   description: 'Most common for startups' },
          { id: 'llp',         title: 'LLP',                   description: 'Limited Liability Partnership' },
          { id: 'opc',         title: 'OPC',                   description: 'One Person Company' },
          { id: 'partnership', title: 'Partnership Firm',      description: 'Two or more partners' },
          { id: 'proprietor',  title: 'Proprietorship',        description: 'Single owner, simplest setup' },
          { id: 'ngo',         title: 'NGO / Trust',           description: 'Section 8, Trust or Society' },
          // Doc title "DPIIT / Startup India Recognition" is 33 chars.
          // Trimmed to fit the 24-char list limit; full wording moved
          // into the description so nothing is lost for the user.
          { id: 'dpiit',       title: 'DPIIT / Startup India', description: 'Startup India Recognition' },
          { id: 'not_sure',    title: 'Not Sure',              description: 'Help me decide' },
        ],
      },
      {
        key: 'business_stage',
        label: 'Stage',
        prompt: 'Is this a new business or already registered?',
        input: 'buttons',
        required: true,
        // Doc logic note: DPIIT recognition only applies to an
        // already-incorporated business, so this question is
        // meaningless on that path.
        skipIf: (a) => a.entity_type === 'dpiit',
        options: [
          { id: 'new',       title: 'New Business' },
          { id: 'existing',  title: 'Already Registered' },
        ],
      },
      {
        key: 'city',
        label: 'City',
        prompt: 'Which city will your business operate from?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      {
        key: 'addons',
        label: 'Additional Services',
        prompt: 'Would you also like assistance with any of these?',
        input: 'multi',
        listButton: 'Select Services',
        required: false,
        options: [
          { id: 'gst',        title: 'GST',             description: 'GST registration' },
          { id: 'msme',       title: 'MSME',            description: 'Udyam / MSME certificate' },
          { id: 'trademark',  title: 'Trademark',       description: 'Brand name protection' },
          { id: 'current_ac', title: 'Current Account', description: 'Business bank account' },
          { id: 'virtual_of', title: 'Virtual Office',  description: 'Registered office address' },
        ],
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  3. Licenses & Certifications
  // ═══════════════════════════════════════════════════════════
  licenses: {
    id: 'licenses',
    label: 'Licenses & Certifications',
    menu: { title: 'Licenses & Certs', description: 'GST, MSME, FSSAI, ISO & more' },
    steps: [
      {
        key: 'license_type',
        label: 'Service',
        prompt: 'Which service do you need?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        options: [
          { id: 'gst',     title: 'GST',           description: 'Goods & Services Tax' },
          { id: 'msme',    title: 'MSME',          description: 'Udyam registration' },
          { id: 'fssai',   title: 'FSSAI',         description: 'Food business license' },
          { id: 'iso',     title: 'ISO',           description: 'ISO certification' },
          { id: 'iec',     title: 'IEC',           description: 'Import Export Code' },
          { id: 'shop',    title: 'Shop License',  description: 'Shops & Establishment' },
          { id: 'trade',   title: 'Trade License', description: 'Municipal trade license' },
          { id: 'other',   title: 'Other',         description: 'Something else' },
        ],
      },
      {
        key: 'request_type',
        label: 'Request Type',
        prompt: 'Is this a new registration, renewal, or modification?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'new',          title: 'New Registration' },
          { id: 'renewal',      title: 'Renewal' },
          { id: 'modification', title: 'Modification' },
        ],
      },
      {
        key: 'city',
        label: 'City',
        prompt: 'Which city is your business based in?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      {
        key: 'business_name',
        label: 'Business Name',
        prompt: "What's your business name?",
        input: 'text',
        required: false,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  4. Finance & Accounts
  // ═══════════════════════════════════════════════════════════
  finance: {
    id: 'finance',
    label: 'Finance & Accounts',
    menu: { title: 'Finance & Accounts', description: 'Bookkeeping, GST filing, Payroll' },
    steps: [
      {
        key: 'finance_service',
        label: 'Service',
        prompt: 'Which service do you need?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        options: [
          { id: 'gst_filing',  title: 'GST Filing',        description: 'Monthly / quarterly returns' },
          { id: 'itr',         title: 'Income Tax Return',  description: 'ITR filing' },
          { id: 'bookkeeping', title: 'Bookkeeping',        description: 'Day-to-day accounting' },
          { id: 'payroll',     title: 'Payroll',            description: 'Salary & compliance' },
          { id: 'audit',       title: 'Audit',              description: 'Statutory & internal audit' },
          { id: 'cfo',         title: 'CFO Services',       description: 'Virtual CFO advisory' },
        ],
      },
      {
        key: 'business_type',
        label: 'Business Type',
        prompt: "What's your business type?",
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'individual', title: 'Individual',  description: 'Salaried or personal' },
          { id: 'proprietor', title: 'Proprietor',  description: 'Sole proprietorship' },
          { id: 'company',    title: 'Company',     description: 'Pvt Ltd / Ltd' },
          { id: 'llp',        title: 'LLP',         description: 'Limited Liability Partnership' },
        ],
      },
      {
        key: 'city',
        label: 'City',
        prompt: 'Which city are you in?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  5. IT Services
  // ═══════════════════════════════════════════════════════════
  it_services: {
    id: 'it_services',
    label: 'IT Services',
    menu: { title: 'IT Services', description: 'Website, Ecommerce, ERP, Cloud' },
    steps: [
      {
        key: 'it_need',
        label: 'Requirement',
        prompt: 'What do you need?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        // 9 options + Back = exactly 10 rows, the WhatsApp maximum.
        // The engine drops the "Start Over" row here automatically;
        // typing RESTART still works.
        options: [
          { id: 'website',    title: 'Website',            description: 'Business or portfolio site' },
          { id: 'ecommerce',  title: 'Ecommerce Website',  description: 'Online store' },
          { id: 'mobile_app', title: 'Mobile App',         description: 'Android / iOS' },
          { id: 'erp',        title: 'ERP',                description: 'Enterprise resource planning' },
          { id: 'crm',        title: 'CRM',                description: 'Customer management' },
          { id: 'clm',        title: 'Smart CLM',          description: 'Contract lifecycle' },
          { id: 'digital_mkt',title: 'Digital Marketing',  description: 'Ads, social, content' },
          { id: 'seo',        title: 'SEO',                description: 'Search rankings' },
          { id: 'hosting',    title: 'Cloud Hosting',      description: 'Servers & hosting' },
        ],
      },
      {
        key: 'has_business',
        label: 'Registered Business',
        prompt: 'Do you already have a registered business?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'yes', title: 'Yes' },
          { id: 'no',  title: 'No' },
        ],
      },
      {
        key: 'business_name',
        label: 'Business Name',
        prompt: "What's your business name?",
        input: 'text',
        required: false,
        validate: 'free',
        // Pointless to ask if they just said they have no business.
        skipIf: (a) => a.has_business === 'no',
      },
      {
        key: 'city',
        label: 'City',
        prompt: 'Which city are you in?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  6. Legal & Compliance
  // ═══════════════════════════════════════════════════════════
  legal: {
    id: 'legal',
    label: 'Legal & Compliance',
    menu: { title: 'Legal & Compliance', description: 'Trademark, ROC, Labour Law' },
    steps: [
      {
        key: 'legal_service',
        label: 'Service',
        prompt: 'Which service do you need?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        options: [
          { id: 'trademark',   title: 'Trademark',           description: 'Brand registration' },
          { id: 'roc',         title: 'ROC Filing',          description: 'Registrar of Companies' },
          { id: 'labour',      title: 'Labour Compliance',   description: 'PF, ESI, labour laws' },
          { id: 'annual',      title: 'Company Annual Filing', description: 'Yearly ROC compliance' },
          { id: 'agreement',   title: 'Agreement Drafting',  description: 'Contracts & agreements' },
          { id: 'notice',      title: 'Legal Notice',        description: 'Send or reply to notice' },
          { id: 'review',      title: 'Contract Review',     description: 'Review existing contract' },
        ],
      },
      {
        key: 'matter_status',
        label: 'Status',
        prompt: 'Is this a new requirement or an existing / ongoing case?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'new',      title: 'New' },
          { id: 'existing', title: 'Existing' },
        ],
      },
      {
        key: 'business_name',
        label: 'Business Name',
        prompt: "What's your business name?",
        input: 'text',
        required: true,
        validate: 'free',
      },
      {
        key: 'city',
        label: 'City',
        prompt: 'Which city are you in?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  7. International Expansion
  // ═══════════════════════════════════════════════════════════
  intl: {
    id: 'intl',
    label: 'International Expansion',
    menu: { title: 'Intl Expansion', description: 'Overseas setup, IEC, Tax advisory' },
    steps: [
      {
        key: 'country',
        label: 'Country',
        prompt: 'Which country are you expanding to?',
        input: 'list',
        listButton: 'Choose Country',
        required: true,
        options: [
          { id: 'uae',       title: 'UAE',          description: 'Dubai, Abu Dhabi & more' },
          { id: 'saudi',     title: 'Saudi Arabia', description: 'KSA' },
          { id: 'qatar',     title: 'Qatar',        description: 'Doha' },
          { id: 'oman',      title: 'Oman',         description: 'Muscat' },
          { id: 'usa',       title: 'USA',          description: 'United States' },
          { id: 'uk',        title: 'UK',           description: 'United Kingdom' },
          { id: 'singapore', title: 'Singapore',    description: 'Singapore' },
          { id: 'other',     title: 'Other',        description: 'Another country' },
        ],
      },
      {
        key: 'intl_need',
        label: 'Requirement',
        prompt: 'What do you need help with?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        options: [
          { id: 'setup',     title: 'Company Setup',  description: 'Incorporate overseas' },
          { id: 'visa',      title: 'Business Visa',  description: 'Visa & residency' },
          { id: 'bank',      title: 'Bank Account',   description: 'Overseas banking' },
          { id: 'vat',       title: 'VAT',            description: 'VAT registration & filing' },
          { id: 'importexp', title: 'Import Export',  description: 'Trade compliance' },
          { id: 'tax',       title: 'Tax Advice',     description: 'Cross-border taxation' },
        ],
      },
      {
        key: 'business_name',
        label: 'Business Name',
        prompt: "What's your business name?",
        input: 'text',
        required: false,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  8. Office Setup — split step
  //  Mirrors the Marketplace split (§9): each branch counts its own
  //  step cap independently, so the split is its own one-step flow
  //  that hands off to a dedicated hidden flow per option.
  // ═══════════════════════════════════════════════════════════
  office: {
    id: 'office',
    label: 'Office Setup',
    menu: { title: 'Office Setup', description: 'Furniture, private office & co-working' },
    steps: [
      {
        key: 'office_need',
        label: 'Requirement',
        prompt: 'What do you need?',
        input: 'list',
        listButton: 'Choose Service',
        required: true,
        options: [
          { id: 'furniture_setup', title: 'Office Furniture & Setup', description: 'Custom furniture manufactured & installed' },
          { id: 'private_office',  title: 'Private Office Space',     description: 'Rent a furnished private office in Bangalore' },
          { id: 'coworking',       title: 'Co-working Space',         description: 'Hot desks, cabins & meeting rooms' },
        ],
        // Hands control to a fresh flow — step counter resets to 1,
        // same mechanism as the Marketplace split.
        branchTo: (value) => ({
          furniture_setup: 'office_furniture',
          private_office:  'office_private',
          coworking:       'office_coworking',
        }[value]),
      },
    ],
  },

  // ── 8A. Office Furniture & Setup ─────────────────────────────
  office_furniture: {
    id: 'office_furniture',
    label: 'Office Setup — Furniture & Setup',
    hidden: true,              // not shown in the main menu
    steps: [
      {
        key: 'setup_type',
        label: 'Setup Type',
        prompt: 'What type of office setup do you need?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'small_office',   title: 'Small Office',           description: 'Up to 5 people' },
          { id: 'startup_team',   title: 'Startup / Team Office',  description: 'Growing team setup' },
          { id: 'corporate',      title: 'Corporate Office',       description: 'Full corporate fit-out' },
          { id: 'other',          title: 'Other',                  description: 'Something else' },
        ],
      },
      {
        key: 'area',
        label: 'Area',
        prompt: 'Which area of Bangalore is the office located in?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      {
        key: 'workstations',
        label: 'Workstations',
        prompt: 'How many workstations do you need?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 8B. Private Office Space ─────────────────────────────────
  office_private: {
    id: 'office_private',
    label: 'Office Setup — Private Office',
    hidden: true,
    steps: [
      {
        key: 'space_type',
        label: 'Space Type',
        prompt: 'What are you looking for?',
        input: 'list',
        listButton: 'Choose Option',
        required: true,
        options: [
          // "Single Seat / Small Office" is 26 chars — over the 24-char
          // list row limit, so the slash's surrounding spaces are
          // dropped to fit without shortening either word.
          { id: 'single_small',  title: 'Single Seat/Small Office', description: 'Solo or small team' },
          { id: 'team_office',   title: 'Team Office',              description: 'Dedicated team space' },
          { id: 'larger_office', title: 'Larger Private Office',     description: 'Bigger dedicated space' },
          { id: 'not_sure',      title: 'Not Sure',                 description: 'Advise me' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration',
        prompt: 'What is your preferred office duration?',
        input: 'list',
        listButton: 'Choose Duration',
        required: true,
        options: [
          { id: 'monthly',    title: 'Monthly' },
          { id: '3_months',   title: '3 Months' },
          { id: '6_months',   title: '6 Months' },
          { id: '12_months',  title: '12 Months' },
          { id: 'not_sure',   title: 'Not Sure' },
        ],
      },
      {
        key: 'location',
        label: 'Location',
        prompt: "What's your preferred location in Bangalore?",
        input: 'text',
        required: true,
        validate: 'city',
      },
      {
        key: 'people_count',
        label: 'People',
        prompt: 'How many people will use the office?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 8C. Co-working Space ─────────────────────────────────────
  office_coworking: {
    id: 'office_coworking',
    label: 'Office Setup — Co-working',
    hidden: true,
    steps: [
      {
        key: 'space_need',
        label: 'Requirement',
        prompt: 'What do you need?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'hot_desk',       title: 'Hot Desk' },
          { id: 'dedicated_desk', title: 'Dedicated Desk' },
          { id: 'cabin',          title: 'Cabin' },
          { id: 'meeting_room',   title: 'Meeting Room' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration',
        prompt: 'How long do you need it?',
        input: 'list',
        listButton: 'Choose Duration',
        required: true,
        options: [
          { id: 'daily',     title: 'Daily' },
          { id: 'monthly',   title: 'Monthly' },
          { id: '3_months',  title: '3 Months' },
          { id: '6_months',  title: '6 Months' },
          { id: 'not_sure',  title: 'Not Sure' },
        ],
      },
      {
        key: 'location',
        label: 'Location',
        prompt: 'Preferred location in Bangalore?',
        input: 'text',
        required: true,
        validate: 'city',
      },
      {
        key: 'people_count',
        label: 'People',
        prompt: 'Number of people?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  9. Virtual Office — split step
  //  Its own service (site nav lists it separately from Office
  //  Setup, doc §8) — same split mechanism as Office Setup/
  //  Marketplace: one-step router that hands off to a dedicated
  //  hidden flow per option, each counting its own 6-step cap.
  // ═══════════════════════════════════════════════════════════
  virtual_office: {
    id: 'virtual_office',
    label: 'Virtual Office',
    menu: { title: 'Virtual Office', description: 'Business address, mail & office access' },
    steps: [
      {
        key: 'vo_need',
        label: 'Requirement',
        prompt: 'What do you need?',
        input: 'list',
        listButton: 'Choose Option',
        required: true,
        options: [
          { id: 'business_address', title: 'Business Address',        description: 'Professional business address' },
          { id: 'mail_handling',    title: 'Mail Handling',           description: 'Receive and manage business mail' },
          { id: 'meeting_access',   title: 'Meeting / Office Access', description: 'Use office facilities when required' },
          { id: 'not_sure',         title: 'Not Sure',                description: 'Help me choose' },
        ],
        branchTo: (value) => ({
          business_address: 'vo_business_address',
          mail_handling:    'vo_mail_handling',
          meeting_access:   'vo_meeting_access',
          not_sure:         'vo_not_sure',
        }[value]),
      },
    ],
  },

  // ── 9A. Business Address ─────────────────────────────────────
  vo_business_address: {
    id: 'vo_business_address',
    label: 'Virtual Office — Business Address',
    hidden: true,
    steps: [
      {
        key: 'address_use',
        label: 'Address Use',
        prompt: 'What will you use the address for?',
        input: 'list',
        listButton: 'Choose Use',
        required: true,
        options: [
          { id: 'company_registration',   title: 'Company Registration' },
          { id: 'gst_registration',       title: 'GST Registration' },
          { id: 'business_correspondence', title: 'Business Correspondence' },
          { id: 'general_use',            title: 'General Business Use' },
          { id: 'not_sure',               title: 'Not Sure' },
        ],
      },
      {
        key: 'bangalore_required',
        label: 'Bangalore Required',
        prompt: 'Do you need the virtual office in Bangalore?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'yes', title: 'Yes' },
          { id: 'no',  title: 'No' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration',
        prompt: 'How long do you need the virtual office?',
        input: 'list',
        listButton: 'Choose Duration',
        required: true,
        options: [
          { id: 'monthly',   title: 'Monthly' },
          { id: '3_months',  title: '3 Months' },
          { id: '6_months',  title: '6 Months' },
          { id: '12_months', title: '12 Months' },
          { id: 'not_sure',  title: 'Not Sure' },
        ],
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 9B. Mail Handling ────────────────────────────────────────
  vo_mail_handling: {
    id: 'vo_mail_handling',
    label: 'Virtual Office — Mail Handling',
    hidden: true,
    steps: [
      {
        key: 'mail_service',
        label: 'Mail Service',
        prompt: 'What type of mail service do you need?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'mail_receiving', title: 'Mail Receiving' },
          // "Mail Receiving + Forwarding" is 27 chars — over the
          // 20-char BUTTON limit. Shortened; meaning unchanged.
          { id: 'receiving_forwarding', title: 'Receive + Forward' },
        ],
      },
      {
        key: 'duration',
        label: 'Duration',
        prompt: 'How long do you need the service?',
        input: 'list',
        listButton: 'Choose Duration',
        required: true,
        options: [
          { id: 'monthly',   title: 'Monthly' },
          { id: '3_months',  title: '3 Months' },
          { id: '6_months',  title: '6 Months' },
          { id: '12_months', title: '12 Months' },
          { id: 'not_sure',  title: 'Not Sure' },
        ],
      },
      {
        key: 'location',
        label: 'Location',
        prompt: "What's your preferred location?",
        input: 'text',
        required: true,
        validate: 'city',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 9C. Meeting / Office Access ──────────────────────────────
  vo_meeting_access: {
    id: 'vo_meeting_access',
    label: 'Virtual Office — Meeting/Office Access',
    hidden: true,
    steps: [
      {
        key: 'access_need',
        label: 'Requirement',
        prompt: 'What do you need?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'meeting_room',    title: 'Meeting Room' },
          { id: 'day_office',      title: 'Day Office' },
          { id: 'private_access',  title: 'Private Office Access' },
          { id: 'not_sure',        title: 'Not Sure' },
        ],
      },
      {
        key: 'access_frequency',
        label: 'Frequency',
        prompt: 'How often do you need access?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'occasionally', title: 'Occasionally' },
          { id: 'regularly',    title: 'Regularly' },
        ],
      },
      {
        key: 'location',
        label: 'Location',
        prompt: "What's your preferred location?",
        input: 'text',
        required: true,
        validate: 'city',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 9D. Not Sure ──────────────────────────────────────────────
  // No reusable "Not Sure"-assist path existed elsewhere in the
  // project, so this is the smallest compatible flow: the assist
  // line rides along in the first question's prompt bubble rather
  // than inventing a new message-send mechanism.
  vo_not_sure: {
    id: 'vo_not_sure',
    label: 'Virtual Office — Not Sure',
    hidden: true,
    steps: [
      {
        key: 'requirement',
        label: 'Requirement',
        prompt: "Sure, we can help you choose the right Virtual Office option.\n\nWhat's your requirement?",
        input: 'text',
        required: true,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  10. Software & Tools Marketplace — split step
  //  Doc: each branch counts its own 6-step cap independently,
  //  so the split is its own one-step flow that branches out.
  // ═══════════════════════════════════════════════════════════
  marketplace: {
    id: 'marketplace',
    label: 'Software & Tools Marketplace',
    menu: { title: 'Software Marketplace', description: 'Find tools or list your software' },
    steps: [
      {
        key: 'listing_type',
        label: 'Listing Type',
        prompt: 'Are you looking for the right tool, or would you like to list your software?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'buyer',  title: 'Find the Right Tool' },
          { id: 'seller', title: 'List My Software' },
        ],
        // Hands control to a fresh flow — step counter resets to 1,
        // which is what the doc's "counts separately" note requires.
        branchTo: (value) => (value === 'seller' ? 'mp_seller' : 'mp_buyer'),
      },
    ],
  },

  // ── 9A. Buyer path ───────────────────────────────────────────
  mp_buyer: {
    id: 'mp_buyer',
    label: 'Marketplace — Find a Tool',
    hidden: true,                 // not shown in the main menu
    queue: 'marketplace_buyer',
    steps: [
      {
        key: 'tool_category',
        label: 'Tool Category',
        prompt: 'What kind of software are you looking for?',
        input: 'list',
        listButton: 'Choose Category',
        required: true,
        options: [
          ...TOOL_CATEGORIES,
          { id: 'browse_all', title: 'Browse all software', description: 'Explore all available software' },
        ],
        // "Browse all software" is navigation, not a lead category — it
        // sends the website link and leaves the flow instead of asking
        // Business Type / Budget / Name / Mobile.
        exitAction: (value) => (value === 'browse_all' ? 'visit_website' : null),
      },
      {
        key: 'business_type',
        label: 'Business Type',
        prompt: "What's your business type?",
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'startup',    title: 'Startup',    description: 'Early stage company' },
          { id: 'sme',        title: 'SME',        description: 'Small / medium business' },
          { id: 'freelancer', title: 'Freelancer', description: 'Independent professional' },
          { id: 'enterprise', title: 'Enterprise', description: 'Large organisation' },
        ],
      },
      {
        key: 'budget',
        label: 'Budget Range',
        prompt: "What's your budget range?",
        input: 'list',
        listButton: 'Choose Budget',
        required: true,
        options: [
          { id: 'under_5k',  title: 'Under \u20B95,000/mo',   description: 'Entry level' },
          { id: '5k_20k',    title: '\u20B95,000-\u20B920,000/mo', description: 'Mid range' },
          { id: 'above_20k', title: '\u20B920,000+/mo',       description: 'Premium tier' },
          { id: 'not_sure',  title: 'Not Sure',            description: 'Advise me' },
        ],
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 9B. Seller path ──────────────────────────────────────────
  mp_seller: {
    id: 'mp_seller',
    label: 'Marketplace — List Software',
    hidden: true,
    queue: 'marketplace_listings',
    steps: [
      {
        key: 'product_category',
        label: 'Product Category',
        prompt: 'What type of product do you offer?',
        input: 'list',
        listButton: 'Choose Category',
        required: true,
        options: [
          ...TOOL_CATEGORIES,
          { id: 'other', title: 'Other', description: 'Something else' },
        ],
      },
      {
        key: 'product_name',
        label: 'Product / Company',
        prompt: "What's your company / product name?",
        input: 'text',
        required: true,
        validate: 'free',
      },
      {
        key: 'pricing_plan',
        label: 'Pricing Plan',
        prompt: "Do you have a pricing plan you'd like listed?",
        input: 'buttons',
        required: true,
        options: [
          { id: 'free_plan', title: 'Free Plan Available' },
          { id: 'paid_only', title: 'Paid Only' },
          { id: 'custom',    title: 'Custom / On Request' },
        ],
      },
      STEP_NAME,
      {
        key: 'work_email',
        label: 'Work Email',
        prompt: "What's your work email?",
        input: 'text',
        required: true,
        validate: 'email',
      },
      STEP_MOBILE,
    ],
  },

  // ═══════════════════════════════════════════════════════════
  //  11. E-Stamp — split step
  //  Its own top-level service (launcherdesk.com/estamp) — same
  //  split mechanism as Office Setup/Virtual Office/Marketplace:
  //  one-step router that hands off to a dedicated hidden flow
  //  per option, each counting its own 6-step cap.
  // ═══════════════════════════════════════════════════════════
  estamp: {
    id: 'estamp',
    label: 'E-Stamp',
    menu: { title: 'E-Stamp', description: 'E-stamps for agreements & documents' },
    steps: [
      {
        key: 'estamp_need',
        label: 'Requirement',
        prompt: 'What type of E-Stamp service do you need?',
        input: 'list',
        listButton: 'Choose Option',
        required: true,
        options: [
          { id: 'new_estamp',  title: 'New E-Stamp',            description: 'Purchase a fresh e-stamp' },
          { id: 'agreement',   title: 'E-Stamp for Agreement',  description: 'Stamp duty for agreements' },
          // "E-Stamp for Business / Commercial Document" is 42 chars —
          // over the 24-char list row limit. Full wording kept below.
          { id: 'business_doc', title: 'Business/Commercial Doc', description: 'Partnership, vendor, employment & commercial documents' },
          { id: 'not_sure',    title: 'Not Sure',               description: 'Help me choose' },
        ],
        branchTo: (value) => ({
          new_estamp:   'estamp_new',
          agreement:    'estamp_agreement',
          business_doc: 'estamp_business',
          not_sure:     'estamp_not_sure',
        }[value]),
      },
    ],
  },

  // ── 11A. New E-Stamp ──────────────────────────────────────────
  estamp_new: {
    id: 'estamp_new',
    label: 'E-Stamp — New E-Stamp',
    hidden: true,
    steps: [
      {
        key: 'document_type',
        label: 'Document Type',
        prompt: 'What type of document is it?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'agreement',   title: 'Agreement' },
          { id: 'rent_lease',  title: 'Rent / Lease Agreement' },
          { id: 'affidavit',   title: 'Affidavit' },
          { id: 'declaration', title: 'Declaration' },
          { id: 'other',       title: 'Other' },
        ],
      },
      {
        key: 'state',
        label: 'State',
        prompt: 'Which state is the document for?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      {
        key: 'know_stamp_value',
        label: 'Know Stamp Value',
        prompt: 'Do you know the required stamp value?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'yes', title: 'Yes' },
          { id: 'no',  title: 'No' },
        ],
      },
      {
        key: 'stamp_value',
        label: 'Stamp Value',
        prompt: 'What is the stamp value?',
        input: 'text',
        required: true,
        validate: 'free',
        // Only asked when the user said they know it.
        skipIf: (a) => a.know_stamp_value !== 'yes',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 11B. E-Stamp for Agreement ────────────────────────────────
  estamp_agreement: {
    id: 'estamp_agreement',
    label: 'E-Stamp — Agreement',
    hidden: true,
    steps: [
      {
        key: 'agreement_type',
        label: 'Agreement Type',
        prompt: 'What type of agreement?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          { id: 'rental_lease',      title: 'Rental / Lease Agreement' },
          // "Vendor / Service Agreement" is 26 chars — over the
          // 24-char limit. Spaces around the slash dropped to fit.
          { id: 'vendor_service',    title: 'Vendor/Service Agreement' },
          { id: 'employment',       title: 'Employment Agreement' },
          { id: 'business_agreement', title: 'Business Agreement' },
          { id: 'other',             title: 'Other' },
        ],
      },
      {
        key: 'state',
        label: 'State',
        prompt: 'Which state is the agreement for?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      {
        key: 'know_stamp_value',
        label: 'Know Stamp Value',
        prompt: 'Do you know the required stamp value?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'yes', title: 'Yes' },
          { id: 'no',  title: 'No' },
        ],
      },
      {
        key: 'stamp_value',
        label: 'Stamp Value',
        prompt: 'What is the stamp value?',
        input: 'text',
        required: true,
        validate: 'free',
        skipIf: (a) => a.know_stamp_value !== 'yes',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 11C. E-Stamp for Business / Commercial Document ──────────
  estamp_business: {
    id: 'estamp_business',
    label: 'E-Stamp — Business/Commercial Doc',
    hidden: true,
    steps: [
      {
        key: 'document_type',
        label: 'Document Type',
        prompt: 'What type of document is it?',
        input: 'list',
        listButton: 'Choose Type',
        required: true,
        options: [
          // "Partnership / Business Agreement" is 33 chars — over the
          // 24-char limit. Full wording kept in the row description.
          { id: 'partnership_business', title: 'Partnership Agreement', description: 'Partnership or business agreement' },
          { id: 'vendor',               title: 'Vendor Agreement' },
          { id: 'employment_doc',       title: 'Employment Document' },
          { id: 'commercial_contract',  title: 'Commercial Contract' },
          { id: 'other',                title: 'Other' },
        ],
      },
      {
        key: 'state',
        label: 'State',
        prompt: 'Which state is the document for?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      {
        key: 'know_stamp_value',
        label: 'Know Stamp Value',
        prompt: 'Do you know the required stamp value?',
        input: 'buttons',
        required: true,
        options: [
          { id: 'yes', title: 'Yes' },
          { id: 'no',  title: 'No' },
        ],
      },
      {
        key: 'stamp_value',
        label: 'Stamp Value',
        prompt: 'What is the stamp value?',
        input: 'text',
        required: true,
        validate: 'free',
        skipIf: (a) => a.know_stamp_value !== 'yes',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },

  // ── 11D. Not Sure ─────────────────────────────────────────────
  // No reusable "Not Sure"-assist path existed elsewhere in the
  // project (same conclusion reached for Virtual Office's Not Sure
  // branch), so this is the smallest compatible flow: the assist
  // line rides along in the first question's prompt bubble rather
  // than inventing a new message-send mechanism.
  estamp_not_sure: {
    id: 'estamp_not_sure',
    label: 'E-Stamp — Not Sure',
    hidden: true,
    steps: [
      {
        key: 'requirement',
        label: 'Requirement',
        prompt: 'Sure, we can help you choose the right E-Stamp option.\n\nWhat do you need an E-Stamp for?',
        input: 'text',
        required: true,
        validate: 'free',
      },
      STEP_NAME,
      STEP_MOBILE,
    ],
  },
};

// ── Main menu rows (Doc §1) ───────────────────────────────────
// 10 categories = 10 rows — the WhatsApp list hard cap, so there is
// no room left for a "Talk to an Expert" row now that E-Stamp is a
// 10th top-level service. Dropped from the list only (per explicit
// product decision) — it stays fully reachable: typing "Talk to an
// Expert" still routes there (flowEngine.detectServiceIntent /
// stateMachine.handleMenu), and it already appears as a button on
// the stuck-offer and expert-handoff messages elsewhere in the bot.
const MENU_ROWS = [
  ...Object.values(FLOWS)
    .filter((f) => !f.hidden)
    .map((f) => ({ id: f.id, title: f.menu.title, description: f.menu.description })),
];

module.exports = { FLOWS, MENU_ROWS, TOOL_CATEGORIES };