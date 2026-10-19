import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";
import type { Profile } from "@/types";
import { Eyebrow, Section } from "./section";
import { ROUTES } from "./routes";

/** Portrait + philosophy pull quote + personal intro. */
export function AboutPreview({ profile, index }: { profile: Profile | null; index: number }) {
  if (!profile) return null;
  const photo = profile.about_photo || profile.profile_photo || null;
  if (!photo && !profile.philosophy && !profile.personal_intro) return null;

  return (
    <Section className="bg-bg-950">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        {photo ? (
          <Reveal className="lg:col-span-5">
            <div className="grain relative aspect-[3/4] w-full max-w-md overflow-hidden border border-line-800 bg-surface-900 lg:max-w-none">
              <Image
                src={photo}
                alt={profile.full_name}
                fill
                sizes="(max-width: 1024px) 92vw, 40vw"
                className="object-cover"
              />
              <span
                aria-hidden
                className="absolute top-3 left-3 h-4 w-4 border-t border-l border-ember-500"
              />
              <span
                aria-hidden
                className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-ember-500"
              />
            </div>
          </Reveal>
        ) : null}

        <div className={photo ? "lg:col-span-6 lg:col-start-7" : "lg:col-span-8"}>
          <Eyebrow index={index}>About</Eyebrow>
          {profile.philosophy ? (
            <Reveal>
              <blockquote className="mt-8">
                <p className="font-display text-display-sm leading-tight font-normal text-balance text-fg-50">
                  <span aria-hidden className="text-ember-400">
                    “
                  </span>
                  {profile.philosophy}
                  <span aria-hidden className="text-ember-400">
                    ”
                  </span>
                </p>
              </blockquote>
            </Reveal>
          ) : null}
          {profile.personal_intro ? (
            <Reveal delay={0.1}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-fg-300 sm:text-lg">
                {profile.personal_intro}
              </p>
            </Reveal>
          ) : null}
          <Reveal delay={0.15}>
            <div className="mt-10">
              <ButtonLink href={ROUTES.about} variant="outline">
                More about me
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
