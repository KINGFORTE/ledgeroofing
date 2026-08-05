import medburyHospitalImage from '../../project media for web - Copy/Medbury Hospital/images/IMG_7536.JPEG';
import nauticaBeachRoofImage from '../../project media for web - Copy/Nautica Beach/images/IMG_5883.JPEG';
import nauticaBeachTeamImage from '../../project media for web - Copy/Nautica Beach/images/IMG_5189.JPEG';
import lutosCapitalBankImage from '../../project media for web - Copy/Lutos Capital Bank/images/IMG_8601.JPEG';

const IMG = (name) => `/images/${name}`;

const img = {
  logo: IMG('logo.png'),
  heroRoof: IMG('img1.jpg'),
  contractor: medburyHospitalImage,
  roofInstall: nauticaBeachRoofImage,
  patternHouse: nauticaBeachTeamImage,
  ctaBanner: IMG('img7.jpg'),
  residential: IMG('11.jpg'),
  commercial: lutosCapitalBankImage,
  repair: IMG('img8.jpg'),
  replacement: IMG('10.jpg'),
  emergency: IMG('5fe72956-0dd4-4664-ab6b-30835e52fe55.jpg'),
  gutter: IMG('9.jpg'),
  metalRoof: IMG('img5.jpg'),
  asphaltRoof: IMG('img6.jpg'),
  flatRoof: IMG('8.jpg'),
  commercialRoof: IMG('DSC_1685%20-%20Copy.jpg'),
  luxuryHome: IMG('IMG_4417.jpg'),
  testimonial1: IMG('testimonial1.jpg'),
  testimonial2: IMG('5fe72956-0dd4-4664-ab6b-30835e52fe55.jpg'),
  testimonial3: IMG('DSC_1668.jpg'),
  testimonial4: IMG('DSC_1685%20-%20Copy.jpg'),
  testimonial5: IMG('IMG_4417.jpg'),
  testimonial6: IMG('abt-banner.jpg'),
};

const {
  logo,
  heroRoof,
  contractor,
  roofInstall,
  patternHouse,
  ctaBanner,
  residential,
  commercial,
  repair,
  replacement,
  emergency,
  gutter,
  metalRoof,
  asphaltRoof,
  flatRoof,
  commercialRoof,
  luxuryHome,
  testimonial1,
  testimonial2,
  testimonial3,
  testimonial4,
  testimonial5,
  testimonial6,
} = img;

export const COMPANY = {
  name: 'Ledge Roofing',
  tagline: 'Building strong roofs. Protecting homes. Creating peace of mind.',
  phone: '0703 658 8568',
  phoneHref: 'https://wa.me/2347036588568?text=Hello%20Ledge%20Roofing%2C%20I%20would%20like%20to%20make%20an%20enquiry.',
  email: 'ledgeroofing@yahoo.com',
  address: '221 Ikorodu Road, Ilupeju, Lagos, Nigeria',
  hours: 'Mon – Sat: 7:00 AM – 7:00 PM',
  hoursSunday: 'Sunday: Emergency calls only',
  founded: 2013,
  social: {
    facebook: 'https://facebook.com/ledgeroofing',
    instagram: 'https://instagram.com/ledgeroofing',
    twitter: 'https://twitter.com/ledgeroofing',
    linkedin: 'https://linkedin.com/company/ledgeroofing',
  },
};

export const NAV_LINKS = [
  { id: 'home', label: 'Home', href: '/' },
  { id: 'about', label: 'About', href: '/about' },
  { id: 'leadership', label: 'Leadership', href: '/leadership' },
  { id: 'services', label: 'Services', href: '/services' },
  { id: 'projects', label: 'Projects', href: '/projects' },
  { id: 'testimonials', label: 'Testimonials', href: '/testimonials' },
  { id: 'blog', label: 'Blog', href: '/blog' },
  { id: 'contact', label: 'Contact', href: '/contact' },
];

export const HERO_IMAGES = { heroRoof };

export const LOGO = logo;

export const ABOUT_IMAGES = { contractor, roofInstall, patternHouse };

export const BACKGROUNDS = { ctaBanner };

export const ABOUT_STATS = [
  { value: 13, suffix: '+', label: 'Years', note: 'Of craftsmanship' },
  { value: 2500, suffix: '+', label: 'Projects', note: 'Completed' },
  { value: 800, suffix: '+', label: 'Happy Customers', note: 'And counting' },
  { value: 98, suffix: '%', label: 'Satisfaction', note: 'Rate guaranteed' },
];

export const SERVICES = [
  {
    id: 'residential',
    icon: 'home',
    title: 'Residential Roofing',
    image: residential,
    description:
      'Beautiful, durable roofing systems designed for your home — from standing-seam metal to premium shingles.',
  },
  {
    id: 'commercial',
    icon: 'building',
    title: 'Commercial Roofing',
    image: commercial,
    description:
      'Large-scale roofing built to protect your business with low-maintenance materials and expert installation.',
  },
  {
    id: 'repair',
    icon: 'hammer',
    title: 'Roof Repair',
    image: repair,
    description:
      'Fast, precise repairs that stop leaks, replace damaged shingles and restore your roof’s integrity.',
  },
  {
    id: 'replacement',
    icon: 'layers',
    title: 'Roof Replacement',
    image: replacement,
    description:
      'Complete tear-off and replacement using premium materials, engineered for decades of performance.',
  },
  {
    id: 'emergency',
    icon: 'zap',
    title: 'Emergency Roofing',
    image: emergency,
    description:
      '24/7 storm damage response with temporary protection and full restoration when you need it most.',
  },
  {
    id: 'gutter',
    icon: 'droplets',
    title: 'Steel Trusses',
    image: gutter,
    description:
      'Seamless gutter systems that channel water away from your foundation and keep your roof healthy.',
  },
];

export const SERVICE_DETAILS = {
  residential: {
    title: 'Residential Roofing',
    text: 'Your roof is your home’s first line of defense — and its single most visible investment. We design and install roofing systems that balance curb appeal with decades of protection, from architectural shingles to premium standing-seam metal.',
    features: [
      'Architectural & luxury shingle systems',
      'Standing-seam and metal profiles',
      'Full-service design consultation',
      'Ventilation & attic optimization',
      'Skylight, chimney & valley flashing',
    ],
  },
  commercial: {
    title: 'Commercial Roofing',
    text: 'Downtime is expensive. Our commercial team installs low-maintenance, energy-efficient systems built for warehouses, offices, retail and multi-family properties — with minimal disruption to your business.',
    features: [
      'TPO, PVC & EPDM membrane systems',
      'Built-up and modified bitumen roofing',
      'Cool roof & energy rebate programs',
      'Preventive maintenance plans',
      'Nationwide manufacturer warranties',
    ],
  },
  repair: {
    title: 'Roof Repair',
    text: 'Small leaks become big problems fast. Our repair crews diagnose the root cause, not just the symptom, and deliver durable, code-compliant repairs that protect your structure and your budget.',
    features: [
      'Leak detection & moisture scanning',
      'Shingle, tile & metal panel repair',
      'Flashing & penetration resealing',
      'Storm and hail damage restoration',
      'Insurance documentation support',
    ],
  },
  replacement: {
    title: 'Roof Replacement',
    text: 'When repair is no longer the right answer, we deliver a complete tear-off and replacement engineered to outlast the warranty. Every system is installed to manufacturer specs by certified crews.',
    features: [
      'Complete tear-off & deck inspection',
      'Premium material selection',
      'Ice & water shield protection',
      'Synthetic underlayment',
      'Debris removal & magnet sweep',
    ],
  },
  emergency: {
    title: 'Emergency Roofing',
    text: 'Storms don’t wait, and neither do we. Our 24/7 emergency division responds around the clock with temporary protection and rapid restoration to get your home or business secure fast.',
    features: [
      '24/7 response — 365 days a year',
      'Emergency tarp & temporary covers',
      'Storm damage triage & inspection',
      'Direct insurance claim assistance',
      'Priority restoration scheduling',
    ],
  },
  gutter: {
    title: 'Steel Trusses',
    text: 'Seamless gutters quietly protect your roof, siding and foundation. We fabricate custom systems on-site that drain efficiently and blend seamlessly with your home’s architecture.',
    features: [
      'Custom seamless gutter fabrication',
      'Leaf-guard & gutter screen options',
      'Downspout & drainage routing',
      'Gutter heating systems',
      'Soffit, fascia & trim replacement',
    ],
  },
};

export const WHY_CHOOSE_US = [
  {
    icon: 'shield',
    title: 'Licensed Professionals',
    text: 'Certified, background-checked crews with years of hands-on roofing expertise.',
  },
  {
    icon: 'gem',
    title: 'Premium Materials',
    text: 'Top-tier products from leading manufacturers, backed by real warranties.',
  },
  {
    icon: 'badge',
    title: 'Affordable Pricing',
    text: 'Transparent, competitive quotes with zero hidden costs — ever.',
  },
  {
    icon: 'file',
    title: 'Warranty Included',
    text: 'Workmanship warranties on every single project we complete.',
  },
  {
    icon: 'timer',
    title: 'Fast Turnaround',
    text: 'Efficient scheduling that respects your time and your timeline.',
  },
  {
    icon: 'headset',
    title: '24/7 Emergency Support',
    text: 'Round-the-clock response for leaks, storm damage and urgent repairs.',
  },
];

export const PROJECTS = [
  {
    id: 'metal-roof',
    title: 'Modern Metal Roof',
    category: 'Metal Roofing',
    image: metalRoof,
    meta: 'Residential • 2,400 sq ft',
  },
  {
    id: 'asphalt-roof',
    title: 'Asphalt Shingle Replacement',
    category: 'Asphalt Roofing',
    image: asphaltRoof,
    meta: 'Residential • 3,100 sq ft',
  },
  {
    id: 'flat-roof',
    title: 'Flat Roof Restoration',
    category: 'Flat Roofing',
    image: flatRoof,
    meta: 'Commercial • 8,500 sq ft',
  },
  {
    id: 'commercial-roof',
    title: 'Commercial Low-Slope System',
    category: 'Commercial Roofing',
    image: commercialRoof,
    meta: 'Office • 12,000 sq ft',
  },
  {
    id: 'luxury-home',
    title: 'Luxury Residential Estate',
    category: 'Luxury Homes',
    image: luxuryHome,
    meta: 'Residential • 5,200 sq ft',
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    location: 'Maple Grove',
    role: 'Homeowner',
    image: testimonial1,
    rating: 5,
    review:
      'From the estimate to the final cleanup, Ledge Roofing was flawless. Our new metal roof looks incredible and the crew treated our home like their own.',
  },
  {
    id: 2,
    name: 'Rachel Adams',
    location: 'Harbor View',
    role: 'Homeowner',
    image: testimonial2,
    rating: 5,
    review:
      'They replaced our entire roof in three days — ahead of schedule. Transparent pricing and zero surprises. I have already recommended them to four neighbors.',
  },
  {
    id: 3,
    name: 'Daniel Reyes',
    location: 'Cedar Hills',
    role: 'Property Manager',
    image: testimonial3,
    rating: 5,
    review:
      'We manage 40+ commercial units and Ledge is now our only roofing contractor. Reliable scheduling, premium materials and honest communication every time.',
  },
  {
    id: 4,
    name: 'Emily Carter',
    location: 'Oakwood',
    role: 'Homeowner',
    image: testimonial4,
    rating: 5,
    review:
      'After a storm damaged our shingles, Ledge responded within hours with an emergency tarp. Their repair was thorough and the 24/7 support is real.',
  },
  {
    id: 5,
    name: 'Marcus Bennett',
    location: 'Lakeview',
    role: 'Homeowner',
    image: testimonial5,
    rating: 5,
    review:
      'Their crew installed our standing-seam metal roof in just two days. The craftsmanship is outstanding and the cleanup was impeccable.',
  },
  {
    id: 6,
    name: 'Olivia Nguyen',
    location: 'Rosewood',
    role: 'Homeowner',
    image: testimonial6,
    rating: 5,
    review:
      'The estimate process was refreshingly transparent — detailed line items, no pressure, no upselling. Our new roof is gorgeous.',
  },
];

export const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Book Inspection',
    text: 'Schedule a free, no-obligation roof inspection at a time that suits you.',
  },
  {
    step: '02',
    title: 'Receive Free Quote',
    text: 'Get a transparent, detailed quote with premium material options.',
  },
  {
    step: '03',
    title: 'Roof Installation',
    text: 'Our certified crew installs your roof with precision and clean-up.',
  },
  {
    step: '04',
    title: 'Project Completed',
    text: 'Final walkthrough, warranty paperwork and a roof built to last.',
  },
];

export const MISSION = {
  title: 'Our Mission',
  text: 'To protect families and businesses with roofing systems of uncompromising quality — installed by certified craftsmen who treat every roof like their own. We exist to deliver peace of mind, one honest project at a time.',
};

export const VISION = {
  title: 'Our Vision',
  text: 'To be the most trusted roofing company in every community we serve — recognized not just for beautiful roofs, but for the way we show up: accountable, transparent and relentlessly committed to doing things right.',
};

export const CORE_VALUES = [
  { icon: 'shield', title: 'Integrity First', text: 'We do what we say. Transparent quotes, honest recommendations and no pressure — ever.' },
  { icon: 'gem', title: 'True Craftsmanship', text: 'Every seam, nail and flashing is placed with care by crews who take pride in their work.' },
  { icon: 'badge', title: 'Accountability', text: 'We own the outcome. If something isn’t right, we make it right — fast.' },
  { icon: 'home', title: 'Customer Obsession', text: 'Your roof protects your family’s biggest investment. We treat it that seriously.' },
  { icon: 'timer', title: 'Safety Always', text: 'OSHA-certified crews, clean job sites and a culture where safety comes first.' },
  { icon: 'headset', title: 'Community', text: 'We are neighbors, volunteers and local employers who give back where we work.' },
];

export const COMPANY_TIMELINE = [
  { year: '2013', title: 'A One-Truck Start', text: 'Oluyemisi Omolola founded Ledge Roofing with a single truck, a ladder and a promise: never cut corners.' },
  { year: '2015', title: 'First Commercial Contract', text: 'We landed our first multi-family commercial project, launching a new division built on reliability.' },
  { year: '2017', title: 'Fully Certified Crews', text: 'Every crew member earned manufacturer and OSHA certifications — a standard most roofers skip.' },
  { year: '2020', title: '2,500th Roof Completed', text: 'Crossed a landmark milestone of installed roofs across residential and commercial markets.' },
  { year: '2023', title: '24/7 Emergency Division', text: 'Launched a round-the-clock storm response team so no family waits for protection.' },
  { year: '2026', title: 'Regional Leader', text: 'Now a multi-crew, fully licensed roofing leader serving ten communities with a 98% satisfaction rate.' },
];

export const CERTIFICATIONS = [
  'GAF Master Elite® Contractor',
  'CertainTeed SELECT ShingleMaster™',
  'Owens Corning Preferred Contractor',
  'National Roofing Contractors Association',
  'OSHA 10 & 30 Certified Crews',
  'EPA Lead-Safe Certified Firm',
  'Licensed & Fully Insured',
  'Haag Engineering Accredited Inspectors',
];

export const AWARDS = [
  { year: '2025', title: 'Best Roofer of Lagos', org: 'Home Builders Association' },
  { year: '2024', title: 'GAF President’s Club Award', org: 'GAF Excellence Program' },
  { year: '2023', title: 'Top 10 Commercial Roofers', org: 'Regional Contracting Review' },
  { year: '2022', title: 'Customer Service Excellence', org: 'Local Chamber of Commerce' },
];

export const EXECUTIVES = [
  {
    slug: 'oluyemisi-omolola',
    name: 'Oluyemisi Omolola',
    role: 'Managing Director',
    image: '/images/1.png',
    shortBio:
      'Provides strategic leadership and oversees the company\'s operations, growth, and commitment to delivering high-quality construction projects.',
    bio: [
      'As Managing Director, Oluyemisi Omolola sets the strategic direction for Ledge Roofing, guiding the company\'s operations and growth with a steady hand and an uncompromising standard for quality. Her leadership ensures every project reflects the company\'s promise of protection, precision and pride.',
      'Oluyemisi brings deep experience in construction leadership, from business strategy and financial stewardship to building the partnerships and teams that turn ambitious projects into completed roofs. She believes strong leadership is measured not in plans, but in results delivered on time and to standard.',
      'Under her direction, Ledge Roofing continues to expand its footprint while never losing the craft-first culture that defines every crew, every estimate and every finished project.',
    ],
    responsibilities: [
      'Sets the company’s strategic vision and growth roadmap',
      'Oversees operations, finance and company culture',
      'Builds and leads industry and client partnerships',
      'Champions quality standards on every project',
    ],
    yearsExperience: 18,
    certifications: [
      'Project Management Professional (PMP)',
      'GAF Master Elite® Contractor',
      'OSHA 30 Certified',
      'Construction Management Certified (CMC)',
    ],
    achievements: [
      'Grew Ledge Roofing into a multi-crew regional leader',
      'Drove 98% customer satisfaction across all projects',
      'Expanded service coverage to ten communities',
      'Built a leadership bench of certified specialists',
    ],
    philosophy:
      'A great company is built one promise at a time. If we lead with honesty, plan with care and finish with craftsmanship, the work speaks for itself.',
    majorProjects: [
      'Regional expansion across ten service communities',
      'Corporate office 12,000 sq ft low-slope re-roof',
      'Multi-family portfolio of 40+ commercial units',
    ],
    personalMessage:
      'Thank you for trusting Ledge Roofing with what matters most. My team and I are committed to doing the job right — and standing behind every roof we build.',
    education: 'M.B.A. Business Administration — Metropolitan University',
    linkedin: 'https://www.linkedin.com/company/ledgeroofing',
    email: 'oluyemisi.omolola@ledgeroofing.com',
  },
  {
    slug: 'okelarin-opeyemi',
    name: 'Okelarin Opeyemi',
    role: 'Manager, Sales & Contract',
    image: '/images/2.png',
    shortBio:
      'Leads client engagement, contract administration, and business development while ensuring successful project agreements.',
    bio: [
      'As Manager of Sales & Contract, Okelarin Opeyemi is the first point of contact for every Ledge Roofing client — the person who turns questions into quotes and conversations into trusted partnerships. He leads client engagement with transparency and care, ensuring every homeowner and business understands exactly what their project involves.',
      'Okelarin oversees contract administration and business development, building the agreements that protect both the client and the company. His attention to detail means pricing is honest, scope is clear and every contract is delivered without surprises.',
      'A natural relationship-builder, he works closely with the project team to ensure what is promised on paper is exactly what is delivered on the roof.',
    ],
    responsibilities: [
      'Leads client engagement and consultations',
      'Owns contract preparation and administration',
      'Drives business development and new partnerships',
      'Ensures clear, transparent project agreements',
    ],
    yearsExperience: 12,
    certifications: [
      'Certified Construction Contract Administrator',
      'Project Management Professional (PMP)',
      'Professional Sales Certification',
      'OSHA 10 Certified',
    ],
    achievements: [
      'Closed 500+ residential and commercial agreements',
      'Built the company’s referral program driving 30% of new business',
      'Reduced contract turnaround time by 50%',
      'Maintained a 98% client satisfaction rating',
    ],
    philosophy:
      'A contract is a promise written down. I make sure every promise is clear, fair and something we can deliver on — every time.',
    majorProjects: [
      'Corporate office 12,000 sq ft re-roof agreement',
      'Regional retail chain maintenance program (10 locations)',
      'Multi-family portfolio contract for 40+ units',
    ],
    personalMessage:
      'From the first call to the final signature, my job is to make sure you feel informed, confident and well taken care of. Let’s build something that lasts.',
    education: 'B.Sc. Business Administration — University of the Valley',
    linkedin: 'https://www.linkedin.com/company/ledgeroofing',
    email: 'okelarin.opeyemi@ledgeroofing.com',
  },
  {
    slug: 'attai-ebiojo',
    name: 'Attai Ebiojo',
    role: 'Project Manager',
    image: '/images/3.png',
    shortBio:
      'Coordinates project planning, execution, and delivery, ensuring projects are completed on time, within budget, and to the highest standards.',
    bio: [
      'As Project Manager, Attai Ebiojo is the glue between the office and the job site. He coordinates planning, scheduling and execution so that every Ledge Roofing project runs on time, on budget and to the highest standard — from the first blueprint to the final walkthrough.',
      'Attai began his career on the tools, learning construction from the ground up. That hands-on background gives him a sharp eye for what a project needs and the respect of the crews who build it.',
      'He manages material logistics, coordinates crews and keeps clients informed at every stage. When a project is delivered early and flawless, it is usually because Attai planned for it weeks before the first nail was set.',
    ],
    responsibilities: [
      'Plans and schedules all project phases',
      'Coordinates crews, materials and subcontractors',
      'Tracks budgets, timelines and progress against milestones',
      'Owns project handover and client walkthroughs',
    ],
    yearsExperience: 14,
    certifications: [
      'Project Management Professional (PMP)',
      'OSHA 30 Certified',
      'Certified Construction Manager (CCM)',
      'Lean Construction Practitioner',
    ],
    achievements: [
      'Delivered 400+ projects on time and on budget',
      'Cut average project turnaround by 30%',
      'Zero cost overruns across three consecutive years',
      'Built the 47-point project handover checklist',
    ],
    philosophy:
      'A project well planned is a project half built. My job is to make sure every detail is ready before the crew arrives.',
    majorProjects: [
      'Corporate office 12,000 sq ft low-slope re-roof, delivered 2 days early',
      'Luxury estate standing-seam metal roof (5,200 sq ft)',
      'Historic district tile & shingle restoration',
    ],
    personalMessage:
      'You’ll know what is happening on your project before it happens. That is my promise — clear communication, careful planning and a roof built right.',
    education: 'B.Sc. Civil Engineering — National Technical University',
    linkedin: 'https://www.linkedin.com/company/ledgeroofing',
    email: 'attai.ebiojo@ledgeroofing.com',
  },
  {
    slug: 'adams-oluwaseun',
    name: 'Adams Oluwaseun',
    role: 'Head of Construction',
    image: '/images/4.png',
    shortBio:
      'Supervises construction operations, site execution, and quality control to ensure excellence across all projects.',
    bio: [
      'As Head of Construction, Adams Oluwaseun supervises every stage of site execution and quality control across Ledge Roofing’s projects. He is the person who makes sure every nail, flashing detail and finished edge meets the Ledge standard — and he still starts most mornings on a rooftop.',
      'Adams came up through the ranks as an apprentice, then crew leader, then field supervisor. That trajectory gives him an unrivalled eye for the details most customers never see but benefit from for decades.',
      'He leads the field supervisors, runs final-inspection walkthroughs and personally handles the trickiest installations. If there is a job nobody else can figure out, it ends up on Adams’s board.',
    ],
    responsibilities: [
      'Supervises all construction and site execution',
      'Owns quality control and final-inspection standards',
      'Manages crew training and certification programs',
      'Leads complex and specialty installations',
    ],
    yearsExperience: 16,
    certifications: [
      'GAF Master Elite® Certified Installer',
      'OSHA 30 Certified',
      'CertainTeed Installation Certified',
      'Haag Engineering Certified Inspector',
    ],
    achievements: [
      'Supervised 1,500+ installations to completion',
      'Built the quality checklist now used company-wide',
      'Zero callbacks across all luxury estate projects',
      'Trained and certified 50+ roofing professionals',
    ],
    philosophy:
      'Quality is not an inspection at the end. It’s a habit on every nail. I’d rather slow a project down than let a detail slide.',
    majorProjects: [
      'Luxury estate 5,200 sq ft metal roof installation',
      'High-rise commercial roof system, 12,000 sq ft',
      'Historic district tile & shingle restoration',
    ],
    personalMessage:
      'When I walk your finished roof, I’m looking for the details nobody else would check. That is the standard I hold — and you get to live with it.',
    education: 'Certified Roofing Contractor — NRCA Training Program',
    linkedin: 'https://www.linkedin.com/company/ledgeroofing',
    email: 'adams.oluwaseun@ledgeroofing.com',
  },
  {
    slug: 'adegoke-michael',
    name: 'Adegoke Michael',
    role: 'Head of Safety',
    image: '/images/5.png',
    shortBio:
      'Oversees health, safety, and environmental compliance, promoting a safe working culture across all construction sites.',
    bio: [
      'As Head of Safety, Adegoke Michael leads health, safety and environmental compliance across every Ledge Roofing project. With nearly two decades in construction safety, he built the compliance-first culture that keeps crews — and the families they work for — out of harm’s way.',
      'Adegoke began as a field laborer before earning his safety certifications and rising through the ranks. That ground-level experience means he understands exactly where risks hide on a job site, and how to remove them before anyone gets close.',
      'Today he runs the company’s safety training academy, conducts daily site audits and drives the strong safety record that Ledge is proud to advertise.',
    ],
    responsibilities: [
      'Owns company-wide health, safety and environmental compliance',
      'Runs daily job-site safety audits and hazard reviews',
      'Trains and certifies every crew in safety standards',
      'Investigates incidents and drives prevention',
    ],
    yearsExperience: 15,
    certifications: [
      'OSHA 30 Certified',
      'Certified Safety Professional (CSP)',
      'Fall Protection & Rescue Certified',
      'Environmental Compliance Specialist (NEBOSH)',
    ],
    achievements: [
      'Zero lost-time incidents across three consecutive years',
      'Built the safety training academy now used by 30+ roofers',
      'Led the company to a 98% safety compliance score',
      'Developed the site-hazard checklist used on every project',
    ],
    philosophy:
      'Safety is not a rulebook — it is a mindset. If a job can’t be done safely, it doesn’t get done at all.',
    majorProjects: [
      'Company-wide safety program overhaul',
      'Fall-protection training for all field crews',
      'Environmental compliance rollout across all sites',
    ],
    personalMessage:
      'Every person who works on your roof is someone’s family. My job is to make sure every one of them goes home safe — and that your project is protected too.',
    education: 'B.Sc. Occupational Health & Safety — National Safety University',
    linkedin: 'https://www.linkedin.com/company/ledgeroofing',
    email: 'adegoke.michael@ledgeroofing.com',
  },
];

export const LEADERSHIP_TIMELINE = [
  { year: '2013', title: 'Ledge Roofing Founded', text: 'Oluyemisi Omolola founds the company with a single truck and an uncompromising standard.' },
  { year: '2015', title: 'Sales & Contract Go Pro', text: 'Okelarin Opeyemi joins to lead client engagement and professionalize sales and contract systems.' },
  { year: '2018', title: 'Field Excellence', text: 'Attai Ebiojo becomes Project Manager, building the field training academy.' },
  { year: '2020', title: 'Construction Takes Lead', text: 'Adams Oluwaseun joins as Head of Construction, standardizing site execution and quality control across every project.' },
  { year: '2024', title: 'Safety Becomes A Discipline', text: 'Adegoke Michael joins as Head of Safety, building the academy that made Ledge the region’s safest roofer.' },
  { year: '2026', title: 'Leadership Into the Future', text: 'A balanced executive team steering a decade of craft toward its next era.' },
];

export const MATERIALS = [
  {
    name: 'Architectural Asphalt Shingles',
    image: asphaltRoof,
    text: 'The industry standard for beauty and value — with deep shadow bands, wind ratings up to 130 mph and class-A fire resistance.',
  },
  {
    name: 'Standing-Seam Metal Roofing',
    image: metalRoof,
    text: 'Premium, energy-efficient and engineered for 50+ years. Perfect for modern architecture and maximum hail resistance.',
  },
  {
    name: 'Flat & Low-Slope TPO',
    image: flatRoof,
    text: 'A commercial workhorse — heat-welded seams, reflective white membranes and low-maintenance energy savings.',
  },
  {
    name: 'Clay & Concrete Tile',
    image: commercialRoof,
    text: 'Timeless durability and architectural character for Mediterranean and luxury designs, backed by 50-year warranties.',
  },
];

export const WARRANTY_TERMS = [
  { icon: 'badge', title: 'Workmanship Warranty', text: 'Every installation is covered by our written workmanship warranty — because we stand behind every nail, not just the material.' },
  { icon: 'gem', title: 'Manufacturer Warranties', text: 'We install only materials backed by the strongest manufacturer warranties, from 30 to 50 years, fully transferable.' },
  { icon: 'shield', title: 'Worry-Free Coverage', text: 'Registered systems, verified installations and prompt claims support. If anything fails, we make it right.' },
];

export const SERVICE_FAQS = [
  {
    q: 'How long does a roof replacement take?',
    a: 'Most residential replacements are completed in 2–3 days, depending on size and complexity. Commercial systems typically take 5–10 days. You’ll receive a precise timeline with your free estimate — and we stick to it.',
  },
  {
    q: 'Do you provide free inspections and estimates?',
    a: 'Yes. Every project starts with a free, no-obligation roof inspection and a transparent written estimate. No pressure, no hidden fees — just an honest assessment of what your roof needs.',
  },
  {
    q: 'What roof materials do you install?',
    a: 'We install architectural and luxury asphalt shingles, standing-seam metal, flat and low-slope TPO/PVC systems, and clay or concrete tile. During your consultation, we help you choose the best system for your home, budget and climate.',
  },
  {
    q: 'Are you licensed and insured?',
    a: 'Absolutely. Ledge Roofing is fully licensed and insured with workers’ compensation and liability coverage, and every crew member is OSHA certified. We’ll gladly provide certificates of insurance before work begins.',
  },
  {
    q: 'Do you handle storm damage and insurance claims?',
    a: 'Yes. Our 24/7 emergency division responds around the clock, documents damage for insurance, and works directly with adjusters so you get the coverage you deserve — and a roof built to last.',
  },
  {
    q: 'What warranty do I get with a new roof?',
    a: 'Every project includes our written workmanship warranty plus manufacturer warranties of 30–50 years on materials. We register your system so coverage is active and transferable.',
  },
];

export const CONTACT_FAQS = [
  {
    q: 'How quickly will you respond to my message?',
    a: 'We respond to every inquiry within 24 hours, and usually much faster. For emergencies, call our 24/7 line and a live dispatcher will connect you to a responder immediately.',
  },
  {
    q: 'What areas do you service?',
    a: 'We proudly serve Lagos and surrounding Nigerian states, including Ogun, Oyo, Osun, Ondo, Ekiti, Kwara, Edo, Delta and the Federal Capital Territory.',
  },
  {
    q: 'Do you charge for estimates?',
    a: 'Never. Inspections and estimates are always free with no obligation. We want you to have the information you need to make the best decision for your home or business.',
  },
  {
    q: 'Can you help with insurance claims after a storm?',
    a: 'Yes. Our emergency division will document the damage, work directly with your adjuster and help you navigate the claims process from start to finish.',
  },
  {
    q: 'Is there an emergency number outside business hours?',
    a: 'Yes. Our emergency line is answered 24/7, 365 days a year. Even on Sundays and holidays, a live responder will dispatch help to protect your property.',
  },
  {
    q: 'Do you offer financing?',
    a: 'We offer flexible financing options with low monthly payments on approved credit, so you can protect your home without breaking your budget.',
  },
];

export const SERVICE_AREAS = [
  'Lagos State',
  'Ogun State',
  'Oyo State',
  'Osun State',
  'Ondo State',
  'Ekiti State',
  'Kwara State',
  'Edo State',
  'Delta State',
  'Abuja (FCT)',
];

export const CASE_STUDIES = [
  {
    id: 'corporate-hq',
    title: 'Corporate HQ Re-Roof',
    client: 'Meridian Office Group',
    location: 'Lagos State',
    image: commercialRoof,
    scope: '12,000 sq ft low-slope TPO system',
    duration: '11 days',
    challenge: 'A leaking 25-year-old membrane was disrupting a 200-person office. The building had to stay fully operational through the installation.',
    solution: 'We phased the installation after hours and on weekends, using a white reflective TPO system with a 20-year manufacturer warranty.',
    result: 'Zero business interruption, energy costs dropped 18%, and the roof now carries a 20-year non-prorated warranty.',
  },
  {
    id: 'luxury-estate',
    title: 'Luxury Estate Metal Roof',
    client: 'Private Residence',
    location: 'Lakeview',
    image: luxuryHome,
    scope: '5,200 sq ft standing-seam metal system',
    duration: '8 days',
    challenge: 'A custom estate demanded a 50-year roof that matched its architectural precision — with zero tolerance for visible fasteners.',
    solution: 'Our elite metal crew installed a concealed-fastener standing-seam system with custom flashings fabricated on-site.',
    result: 'A flawless, maintenance-free roof engineered for 50+ years — delivered two days ahead of schedule.',
  },
  {
    id: 'multifamily',
    title: 'Multi-Family Portfolio',
    client: 'Harborview Properties',
    location: 'Harbor View',
    image: flatRoof,
    scope: '40+ units across three buildings',
    duration: '6 weeks',
    challenge: 'A property manager with 40+ units needed a reliable partner after repeated callbacks from previous contractors.',
    solution: 'We delivered a full tear-off and replacement program with coordinated scheduling and a 24/7 maintenance response plan.',
    result: 'A decade-long partnership — zero leaks since installation and a maintenance plan that keeps every roof under warranty.',
  },
];

export const BLOG_CATEGORIES = [
  'All',
  'Roofing Tips',
  'Maintenance Guides',
  'Industry News',
  'Commercial Insights',
];

export const BLOG_POSTS = [
  {
    id: 1,
    image: asphaltRoof,
    tag: 'Maintenance Guides',
    category: 'Maintenance Guides',
    featured: true,
    title: '5 Signs Your Asphalt Roof Needs Replacing',
    excerpt:
      'Granules in the gutters, curling shingles, daylight through the deck — learn the telltale signs it’s time for a new roof.',
    date: 'Jan 18, 2026',
    read: '6 min read',
  },
  {
    id: 2,
    image: flatRoof,
    tag: 'Commercial Insights',
    category: 'Commercial Insights',
    title: 'Flat Roof Repair vs. Replacement: What’s Right?',
    excerpt:
      'Ponding water and membrane blisters don’t always mean a full tear-off. Here’s how to decide between repair and replacement.',
    date: 'Dec 02, 2025',
    read: '5 min read',
  },
  {
    id: 3,
    image: metalRoof,
    tag: 'Roofing Tips',
    category: 'Roofing Tips',
    title: 'Metal Roofing: The Complete Homeowner’s Guide',
    excerpt:
      'From standing-seam to corrugated, discover why metal roofs are the fastest-growing premium choice for modern homes.',
    date: 'Nov 14, 2025',
    read: '8 min read',
  },
  {
    id: 4,
    image: gutter,
    tag: 'Maintenance Guides',
    category: 'Maintenance Guides',
    title: 'The 10-Minute Seasonal Gutter Check',
    excerpt:
      'Clogged gutters are the quiet enemy of a healthy roof. A simple seasonal check can save thousands in water damage.',
    date: 'Oct 28, 2025',
    read: '4 min read',
  },
  {
    id: 5,
    image: commercialRoof,
    tag: 'Commercial Insights',
    category: 'Commercial Insights',
    title: 'Cool Roofs & Energy Rebates for Commercial Buildings',
    excerpt:
      'Reflective membranes cut cooling costs and unlock utility rebates. We break down the ROI of a cool roof retrofit.',
    date: 'Sep 19, 2025',
    read: '7 min read',
  },
  {
    id: 6,
    image: luxuryHome,
    tag: 'Industry News',
    category: 'Industry News',
    title: '2026 Roofing Trends: What Homeowners Are Choosing',
    excerpt:
      'From solar-ready metal to cool-color shingles, here’s how roofing materials and technology are evolving this year.',
    date: 'Aug 30, 2025',
    read: '6 min read',
  },
];

export const FOOTER_SERVICES = SERVICES.map((s) => s.title);
