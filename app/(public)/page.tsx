import { AboutPreview } from "@/components/portfolio/about-preview";
import { CareerStrip } from "@/components/portfolio/career-strip";
import { CredentialsPreview } from "@/components/portfolio/credentials-preview";
import { FeaturedProjects } from "@/components/portfolio/featured-projects";
import CtaSection from "@/components/portfolio/cta-band";
import { Hero } from "@/components/portfolio/hero";
import { Statement } from "@/components/portfolio/statement";
import { WhatIBuild } from "@/components/portfolio/what-i-build";
import { TravelGallery } from "@/components/portfolio/travel-gallery";
import { VideosPreview } from "@/components/portfolio/videos-preview";
import { VelocityMarquee } from "@/components/motion/velocity-marquee";
import {
  getCareerMap,
  getCertifications,
  getClientLogos,
  getEducation,
  getExperiences,
  getFeaturedProjects,
  getMediaFolder,
  getServices,
  getSiteShell,
  getSocialLinks,
  getStats,
  getVideos,
} from "@/lib/queries/public";

export default async function HomePage() {
  const [
    { profile },
    projects,
    experiences,
    careerMap,
    services,
    stats,
    certifications,
    clientLogos,
    education,
    videos,
    socialLinks,
    travelPhotos,
  ] = await Promise.all([
    getSiteShell(),
    getFeaturedProjects(4),
    getExperiences(),
    getCareerMap(),
    getServices(),
    getStats(),
    getCertifications(),
    getClientLogos(),
    getEducation(),
    getVideos(),
    getSocialLinks(),
    getMediaFolder("travel", 9),
  ]);
  const youtube = socialLinks.find((l) => l.platform === "youtube") ?? null;

  // Sequential section indices, skipping sections that have nothing to show.
  let n = 0;
  const next = () => ++n;
  const showStatement = Boolean(profile?.short_bio) || stats.length > 0;
  const showWork = projects.length > 0;
  const showServices = services.length > 0;
  const showCareer = experiences.length > 0 || careerMap.length > 0;
  const showAbout = Boolean(
    profile &&
    (profile.about_photo || profile.profile_photo || profile.philosophy || profile.personal_intro),
  );
  const showCredentials = education.length > 0 || certifications.length > 0;
  const showVideos = videos.length > 0;
  const showTravel = travelPhotos.length > 0;

  return (
    <>
      <Hero profile={profile} clientLogos={clientLogos} />

      {showStatement ? <Statement profile={profile} stats={stats} index={next()} /> : null}

      {showWork ? <FeaturedProjects projects={projects} index={next()} /> : null}

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

      {showVideos ? <VideosPreview videos={videos} youtube={youtube} index={next()} /> : null}

      {showCredentials ? (
        <CredentialsPreview education={education} certifications={certifications} index={next()} />
      ) : null}

      {showAbout ? <AboutPreview profile={profile} index={next()} /> : null}

      {showTravel ? <TravelGallery photos={travelPhotos} index={next()} /> : null}

      <CtaSection />
    </>
  );
}
