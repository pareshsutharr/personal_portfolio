import { AboutPreview } from "@/components/portfolio/about-preview";
import { CareerStrip } from "@/components/portfolio/career-strip";
import { CertificationsPreview } from "@/components/portfolio/certifications-preview";
import CtaSection from "@/components/portfolio/cta-band";
import { Hero } from "@/components/portfolio/hero";
import { Industries } from "@/components/portfolio/industries";
import { Section, SectionHeader } from "@/components/portfolio/section";
import { Statement } from "@/components/portfolio/statement";
import { TechEcosystem } from "@/components/portfolio/tech-ecosystem";
import { WhatIBuild } from "@/components/portfolio/what-i-build";
import { Showcase } from "@/components/projects/showcase";
import { VelocityMarquee } from "@/components/motion/velocity-marquee";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES } from "@/components/portfolio/routes";
import {
  getCareerMap,
  getCertifications,
  getClientLogos,
  getExperiences,
  getFeaturedProjects,
  getIndustries,
  getServices,
  getSiteShell,
  getSkills,
  getStats,
} from "@/lib/queries/public";

export default async function HomePage() {
  const [
    { profile },
    projects,
    experiences,
    careerMap,
    skills,
    industries,
    services,
    stats,
    certifications,
    clientLogos,
  ] = await Promise.all([
    getSiteShell(),
    getFeaturedProjects(6),
    getExperiences(),
    getCareerMap(),
    getSkills(),
    getIndustries(),
    getServices(),
    getStats(),
    getCertifications(),
    getClientLogos(),
  ]);

  // Sequential section indices, skipping sections that have nothing to show.
  let n = 0;
  const next = () => ++n;
  const showStatement = Boolean(profile?.short_bio) || stats.length > 0;
  const showWork = projects.length > 0;
  const showServices = services.length > 0;
  const showCareer = experiences.length > 0 || careerMap.length > 0;
  const showSkills = skills.length > 0;
  const showIndustries = industries.length > 0;
  const showAbout = Boolean(
    profile &&
    (profile.about_photo || profile.profile_photo || profile.philosophy || profile.personal_intro),
  );
  const showCerts = certifications.length > 0;

  return (
    <>
      <Hero profile={profile} clientLogos={clientLogos} />

      {showStatement ? <Statement profile={profile} stats={stats} index={next()} /> : null}

      {showWork ? <Showcase projects={projects} index={next()} /> : null}

      <VelocityMarquee
        items={
          profile?.hero_keywords?.length
            ? profile.hero_keywords
            : ["Web", "Mobile", "APIs", "Fintech", "Enterprise"]
        }
      />

      {showServices ? (
        <WhatIBuild services={services} intro={profile?.what_i_build} index={next()} />
      ) : null}

      {showCareer ? (
        <CareerStrip experiences={experiences} careerMap={careerMap} index={next()} />
      ) : null}

      {showSkills ? (
        <Section className="bg-bg-900">
          <SectionHeader
            index={next()}
            eyebrow="Technology ecosystem"
            title="Technologies, and the projects they shipped in."
            description="Select a category to see the technologies, then a technology to see where it shipped."
            action={
              <ButtonLink href={ROUTES.skills} variant="outline">
                All skills
              </ButtonLink>
            }
          />
          <TechEcosystem skills={skills} />
        </Section>
      ) : null}

      {showIndustries ? <Industries industries={industries} index={next()} /> : null}

      {showAbout ? <AboutPreview profile={profile} index={next()} /> : null}

      {showCerts ? <CertificationsPreview certifications={certifications} index={next()} /> : null}

      <CtaSection />
    </>
  );
}
