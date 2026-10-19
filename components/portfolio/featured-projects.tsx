import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ProjectCard } from "@/components/projects/project-card";
import type { ProjectWithRelations } from "@/types";
import { ROUTES } from "./routes";
import { Section, SectionHeader } from "./section";

/**
 * Compact two-column grid of featured projects for the landing page. The full
 * sticky showcase lives on /projects; this keeps the home page short.
 */
export function FeaturedProjects({
  projects,
  index,
  limit = 4,
}: {
  projects: ProjectWithRelations[];
  index: number;
  limit?: number;
}) {
  const list = projects.slice(0, limit);
  if (!list.length) return null;

  return (
    <Section id="work" className="bg-bg-950">
      <SectionHeader
        index={index}
        eyebrow="Selected work"
        title="Recent projects."
        action={
          <ButtonLink href={ROUTES.projects} variant="outline">
            All projects
          </ButtonLink>
        }
      />
      <Stagger className="grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-14">
        {list.map((p, i) => (
          <StaggerItem key={p.id} className="lg:col-span-6">
            <ProjectCard
              project={p}
              index={i + 1}
              span="narrow"
              priority={i < 2}
              className="lg:col-span-12"
            />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
