import { Counter } from "@/components/motion/counter";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { ScrollText } from "@/components/motion/scroll-text";
import type { Profile, Stat } from "@/types";
import { Eyebrow, Section } from "./section";

type ResolvedStat = Stat & { resolved_value: string };

/** Quick professional statement: short bio + stats row. */
export function Statement({
  profile,
  stats,
  index,
}: {
  profile: Profile | null;
  stats: ResolvedStat[];
  index: number;
}) {
  const bio = profile?.short_bio ?? null;
  if (!bio && !stats.length) return null;

  return (
    <Section className="bg-bg-900">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <Eyebrow index={index}>Who I am</Eyebrow>
        </div>
        <div className="lg:col-span-8">
          {bio ? (
            <ScrollText
              text={bio}
              className="max-w-3xl font-display text-display-sm leading-tight font-normal text-fg-100"
            />
          ) : null}

          {stats.length ? (
            <Stagger
              className={
                bio
                  ? "mt-14 grid grid-cols-2 gap-px border-t border-line-800 pt-10 sm:grid-cols-4"
                  : "grid grid-cols-2 gap-px sm:grid-cols-4"
              }
            >
              {stats.slice(0, 4).map((s) => (
                <StaggerItem key={s.id} className="pr-6">
                  <div className="font-display text-4xl font-semibold tracking-tight text-fg-50 sm:text-5xl">
                    <Counter value={s.resolved_value} />
                  </div>
                  <p className="mt-3 label-mono">{s.label}</p>
                  {s.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-fg-500">{s.description}</p>
                  ) : null}
                </StaggerItem>
              ))}
            </Stagger>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
