import Image from "next/image";
import type { Project } from "@/data/projects";
import { ImageGrid } from "./ImageGrid";
import { textStyles } from "@/lib/typography";

function InlineVideo({
  src,
  poster,
  alt,
}: {
  src: string;
  poster: string;
  alt: string;
}) {
  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
      <video
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label={alt}
        className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
      />
      <Image
        src={poster}
        alt={alt}
        fill
        sizes="(min-width: 768px) 700px, 100vw"
        className="hidden object-cover object-top motion-reduce:block"
      />
    </div>
  );
}

function Beat({
  number,
  label,
  heading,
  body,
}: {
  number: string;
  label: string;
  heading: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span className={textStyles.numeral}>
          {number}
        </span>
        <p className={textStyles.eyebrowAccent}>
          {label}
        </p>
      </div>
      <div className="max-w-[65ch]">
        <h4 className={`mt-2 text-balance sm:text-2xl ${textStyles.h3}`}>
          {heading}
        </h4>
        <p className={`mt-3 ${textStyles.body}`}>{body}</p>
      </div>
    </div>
  );
}

export function CaseStudyDetail({ project }: { project: Project }) {
  const extraMedia = project.media.slice(2);

  return (
    <div className="flex flex-col gap-10 pt-8">
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div>
          <dt className={textStyles.eyebrow}>
            Role
          </dt>
          <dd className={textStyles.metaValue}>{project.role}</dd>
        </div>
        <div>
          <dt className={textStyles.eyebrow}>
            Areas
          </dt>
          <dd className={textStyles.metaValue}>{project.areas}</dd>
        </div>
        <div>
          <dt className={textStyles.eyebrow}>
            Scope
          </dt>
          <dd className={textStyles.metaValue}>{project.scope}</dd>
        </div>
      </dl>

      <div>
        <div className="flex items-baseline gap-3">
          <span className={textStyles.numeral}>00</span>
          <p className={textStyles.eyebrowAccent}>
            Context
          </p>
        </div>
        <p className={`mt-3 max-w-[65ch] ${textStyles.body}`}>
          {project.context}
        </p>
      </div>

      {project.media[0] && (
        <InlineVideo
          src={project.media[0].src}
          poster={project.media[0].poster}
          alt={project.media[0].alt}
        />
      )}

      <Beat
        number="01"
        label="Challenge"
        heading={project.challenge.heading}
        body={project.challenge.body}
      />

      {project.media[1] && (
        <InlineVideo
          src={project.media[1].src}
          poster={project.media[1].poster}
          alt={project.media[1].alt}
        />
      )}

      <Beat
        number="02"
        label="Approach"
        heading={project.approach.heading}
        body={project.approach.body}
      />

      {extraMedia.map((item) => (
        <InlineVideo key={item.src} src={item.src} poster={item.poster} alt={item.alt} />
      ))}

      <ImageGrid images={project.images} />

      <div>
        <div className="flex items-baseline gap-3">
          <span className={textStyles.numeral}>03</span>
          <p className={textStyles.eyebrowAccent}>
            Outcomes
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {project.outcomes.map((outcome) => (
            <div key={outcome.title}>
              <p className={textStyles.stat}>
                {outcome.stat}
              </p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {outcome.title}
              </p>
              <p className={`mt-1 max-w-[65ch] ${textStyles.bodySm}`}>
                {outcome.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Beat
        number="04"
        label="Reflection"
        heading={project.reflection.heading}
        body={project.reflection.body}
      />
    </div>
  );
}
