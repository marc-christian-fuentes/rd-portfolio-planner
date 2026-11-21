/**
 * The portfolio site: one page, built from content.ts.
 * Sections: intro, featured project (greenlight.), experience,
 * skills and certifications, education, contact.
 */
import type { ReactNode } from 'react';
import { certifications, education, experience, featuredProject, profile, skills } from './content';

const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#experience', label: 'Experience' },
  { href: '#skills', label: 'Skills' },
  { href: '#contact', label: 'Contact' },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 py-12 md:py-16">
      <h2 id={`${id}-title`} className="mb-6 text-[13px] font-semibold tracking-wide text-moss-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** The greenlight. traffic-light mark, same drawing as the app's logo. */
function TrafficLight({ size = 34 }: { size?: number }) {
  return (
    <svg width={(size * 14) / 26} height={size} viewBox="0 0 14 26" aria-hidden="true">
      <rect x="0.5" y="0.5" width="13" height="25" rx="4" fill="#141a0e" stroke="#4f6a2c" />
      <circle cx="7" cy="6" r="2.6" fill="#5b2a22" />
      <circle cx="7" cy="13" r="2.6" fill="#5c4a1a" />
      <circle cx="7" cy="20" r="4" fill="#8fe07a" opacity="0.25" />
      <circle cx="7" cy="20" r="2.8" fill="#7fd46a" />
      <circle cx="6.1" cy="19.1" r="0.8" fill="#e6ffd9" opacity="0.9" />
    </svg>
  );
}

const buttonPrimary =
  'inline-flex items-center gap-2 rounded-md bg-moss-800 px-4 py-2 text-[14px] font-medium text-white hover:bg-moss-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600';
const buttonSecondary =
  'inline-flex items-center gap-2 rounded-md border border-moss-300 bg-white px-4 py-2 text-[14px] font-medium text-moss-800 hover:border-moss-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600';

export default function App() {
  const p = featuredProject;
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>

      <header className="sticky top-0 z-20 border-b border-moss-200 bg-moss-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 md:px-6">
          <a href="#top" className="text-[16px] font-semibold tracking-tight">
            Marc Fuentes
          </a>
          <nav aria-label="Sections">
            <ul className="flex gap-4 text-[14px] text-moss-700 sm:gap-6">
              {NAV.map((n) => (
                <li key={n.href} className={n.href === '#skills' ? 'hidden sm:block' : ''}>
                  <a href={n.href} className="hover:text-moss-900 hover:underline">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-4 md:px-6">
        {/* Intro */}
        <section id="top" className="pt-14 pb-6 md:pt-20">
          <p className="text-[14px] text-moss-600">{profile.location}</p>
          <h1 className="mt-2 text-[36px] leading-tight font-semibold tracking-tight md:text-[48px]">{profile.name}</h1>
          <p className="mt-2 text-[18px] font-medium text-moss-700 md:text-[20px]">{profile.headline}</p>
          <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-moss-800">{profile.intro}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#work" className={buttonPrimary}>
              See my featured project
            </a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className={buttonSecondary}>
              LinkedIn
            </a>
            <a href={profile.links.github} target="_blank" rel="noreferrer" className={buttonSecondary}>
              GitHub
            </a>
          </div>
        </section>

        {/* Featured project */}
        <Section id="work" title="Featured project">
          <article className="overflow-hidden rounded-[14px] border border-moss-200 bg-white">
            <div className="flex flex-wrap items-center gap-4 bg-moss-800 px-6 py-5 text-white">
              <TrafficLight />
              <div>
                <h3 className="text-[24px] leading-none font-semibold tracking-tight">
                  {p.name.replace('.', '')}
                  <span className="text-sage-300">.</span>
                </h3>
                <p className="mt-1 text-[14px] text-sage-200">{p.tagline}</p>
              </div>
            </div>
            <div className="px-6 py-6">
              <p className="text-[16px] leading-relaxed text-moss-800">{p.summary}</p>
              <ul className="mt-5 space-y-2.5">
                {p.highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-[15px] leading-relaxed text-moss-800">
                    <span className="mt-2 size-2 shrink-0 rounded-full bg-moss-600" aria-hidden="true" />
                    {h}
                  </li>
                ))}
              </ul>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label="Built with">
                {p.stack.map((s) => (
                  <li key={s} className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[12px] font-medium text-moss-800">
                    {s}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={p.liveUrl} target="_blank" rel="noreferrer" className={buttonPrimary}>
                  Open the live demo
                </a>
                <a href={p.codeUrl} target="_blank" rel="noreferrer" className={buttonSecondary}>
                  View the code on GitHub
                </a>
              </div>
              <p className="mt-4 text-[13px] text-moss-500">No sign-up needed: switch roles with “View as” at the top of the app. {p.note}</p>
            </div>
          </article>
        </Section>

        {/* Experience */}
        <Section id="experience" title="Experience">
          <ol className="space-y-8">
            {experience.map((job) => (
              <li key={job.company} className="grid gap-x-8 gap-y-2 md:grid-cols-[200px_1fr]">
                <h3 className="text-[16px] font-semibold text-moss-900">{job.company}</h3>
                <ol className="space-y-5">
                  {job.roles.map((r) => (
                    <li key={r.title}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <p className="text-[15px] font-medium text-moss-900">{r.title}</p>
                        <p className="text-[13px] text-moss-500">{r.dates}</p>
                      </div>
                      <p className="text-[13px] text-moss-500">{r.place}</p>
                      {r.points && (
                        <ul className="mt-2 space-y-1.5">
                          {r.points.map((pt) => (
                            <li key={pt} className="flex gap-3 text-[14px] leading-relaxed text-moss-800">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-moss-500" aria-hidden="true" />
                              {pt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        </Section>

        {/* Skills, certifications, education */}
        <Section id="skills" title="Skills, certifications and education">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-[10px] border border-moss-200 bg-white p-5">
              <h3 className="text-[15px] font-semibold">Skills</h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <li key={s} className="rounded-full bg-sage-100 px-2.5 py-0.5 text-[13px] text-moss-800">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[10px] border border-moss-200 bg-white p-5">
              <h3 className="text-[15px] font-semibold">Certifications</h3>
              <ul className="mt-3 space-y-1.5 text-[14px] text-moss-800">
                {certifications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[10px] border border-moss-200 bg-white p-5">
              <h3 className="text-[15px] font-semibold">Education</h3>
              <ul className="mt-3 space-y-2 text-[14px] text-moss-800">
                {education.map((e) => (
                  <li key={e.school}>
                    <p className="font-medium">{e.school}</p>
                    <p>{e.degree}</p>
                    <p className="text-[13px] text-moss-500">{e.dates}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        {/* Contact */}
        <Section id="contact" title="Contact">
          <div className="rounded-[14px] bg-moss-800 px-6 py-8 text-white">
            <p className="text-[22px] font-semibold tracking-tight">Let’s talk finance, systems and planning.</p>
            <p className="mt-2 max-w-xl text-[15px] text-sage-200">The best way to reach me is a message on LinkedIn.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={profile.links.linkedin}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md bg-sage-100 px-4 py-2 text-[14px] font-medium text-moss-900 hover:bg-white"
              >
                Message me on LinkedIn
              </a>
              <a
                href={profile.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-md border border-moss-600 px-4 py-2 text-[14px] font-medium text-sage-100 hover:bg-moss-700"
              >
                GitHub
              </a>
            </div>
          </div>
        </Section>
      </main>

      <footer className="border-t border-moss-200 py-6 text-center text-[13px] text-moss-500">
        © {new Date().getFullYear()} {profile.name} · {profile.location}
      </footer>
    </>
  );
}
