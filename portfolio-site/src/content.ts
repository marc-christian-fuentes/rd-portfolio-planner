/**
 * EVERYTHING THE SITE SAYS LIVES HERE.
 * Edit this file to update your experience, skills or links; the page
 * rebuilds itself from it. Content comes from your LinkedIn profile export.
 */

export const profile = {
  name: 'Marc Fuentes',
  headline: 'FP&A and Systems Analyst · CFA Candidate',
  location: 'Greater Vancouver, BC',
  // A draft intro in my words, based on your current role. Rewrite it in your own voice.
  intro:
    'I work where finance meets systems: building the models, processes and tools that turn operating plans into numbers leaders can act on. Currently FP&A and Systems Analyst at Novarc Technologies.',
  links: {
    linkedin: 'https://www.linkedin.com/in/marc-christian-fuentes',
    github: 'https://github.com/marc-christian-fuentes',
  },
};

export const featuredProject = {
  name: 'greenlight.',
  tagline: 'R&D investment planning',
  summary:
    'A working demo of how R&D, project management, sales, manufacturing and leadership can plan from one shared project and ROI model, instead of five disconnected spreadsheets.',
  highlights: [
    'ROI calculator with multi-year cash flows, WACC and mid-year discounting, and live NPV, IRR and discounted payback.',
    'One shared model: sales plans set units and price, manufacturing’s itemised unit costs replace margin estimates, and proposed hires flow straight into ROI and the forecast.',
    'Quarterly planning with “Rank by comparing”: leaders pick between two projects at a time, and a binary insertion sort builds the full ranking from those choices.',
    'Excel export with live formulas, checked against an independent spreadsheet engine (all 676 formulas match the app).',
    'Eight role-based views (no logins), a P&L forecast, roadmap, capacity planning and an approval chain for new hires.',
  ],
  stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS', 'Zustand', 'ExcelJS', 'Vercel'],
  liveUrl: 'https://rd-portfolio-planner.vercel.app',
  codeUrl: 'https://github.com/marc-christian-fuentes/rd-portfolio-planner',
  note: 'All companies, people and numbers in the demo are fictional.',
};

export interface Role {
  title: string;
  dates: string;
  place: string;
  points?: string[];
}

export interface Job {
  company: string;
  roles: Role[];
}

export const experience: Job[] = [
  {
    company: 'Novarc Technologies Inc.',
    roles: [{ title: 'FP&A and Systems Analyst', dates: 'May 2026 – Present', place: 'Vancouver, British Columbia' }],
  },
  {
    company: 'Securonix',
    roles: [{ title: 'Financial Analyst', dates: 'Jan 2025 – May 2026', place: 'San Francisco Bay Area' }],
  },
  {
    company: 'Vendasta',
    roles: [
      {
        title: 'Financial Analyst II',
        dates: 'Aug 2021 – Dec 2024',
        place: 'Saskatoon, Saskatchewan',
        points: [
          'Led my team through integrating the FP&A and financial reporting processes of two of our newest acquisitions.',
          'Built and developed the sales organisation’s commission calculators, giving managers insight into individual performance and a gauge of how well the compensation plan was working against its key metrics.',
          'Modelled sales efficiency and pinned down the most productive customer segments, maintaining 97%+ NRR and lower churn risk while giving sales teams more precise target ICPs.',
        ],
      },
      { title: 'Sales Development Representative', dates: 'May 2021 – Aug 2021', place: 'Saskatoon, Saskatchewan' },
    ],
  },
  {
    company: 'Ensightful',
    roles: [{ title: 'Student Sales Outreach Ambassador', dates: 'Jun 2021 – Jul 2021', place: 'Vancouver, British Columbia' }],
  },
];

export const skills = ['Python', 'Google Cloud Platform (GCP)', 'Google Workspace'];

export const certifications = ['CFA Program candidate', 'Bloomberg Market Concepts'];

export const education = [
  {
    school: 'University of Saskatchewan',
    degree: 'Bachelor of Commerce (BCom), Finance',
    dates: '2017 – 2021',
  },
];
