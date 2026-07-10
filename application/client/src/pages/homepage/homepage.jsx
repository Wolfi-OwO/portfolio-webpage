import { useState } from "react";
import { Link } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { usePageMeta } from "../../hooks/usePageMeta.js";
import { SocialRow } from "../../components/identity.jsx";
import LoadingScreen from "../../components/loading-screen.jsx";
import { shouldBoot } from "../../utils/boot.js";
import { IDENTITY } from "../../utils/identity.js";
import {
  SiJavascript,
  SiTypescript,
  SiReact,
  SiAngular,
  SiTailwindcss,
  SiNodedotjs,
  SiExpress,
  SiSpringboot,
  SiOpenjdk,
  SiKotlin,
  SiDotnet,
  SiDocker,
  SiGithubactions,
  SiMongodb,
  SiPostgresql,
  SiGit,
} from "react-icons/si";

import {
  FaDatabase,
  FaMicrosoft,
} from "react-icons/fa";

const technologies = [
  {
    name: "JavaScript",
    icon: SiJavascript,
    color: "#F7DF1E",
  },
  {
    name: "TypeScript",
    icon: SiTypescript,
    color: "#3178C6",
  },
  {
    name: "React",
    icon: SiReact,
    color: "#61DAFB",
  },
  {
    name: "Angular",
    icon: SiAngular,
    color: "#DD0031",
  },
  {
    name: "Tailwind CSS",
    icon: SiTailwindcss,
    color: "#06B6D4",
  },

  {
    name: "Node.js",
    icon: SiNodedotjs,
    color: "#339933",
  },
  {
    name: "Express",
    icon: SiExpress,
    color: "#FFFFFF",
  },
  {
    name: "Spring Boot",
    icon: SiSpringboot,
    color: "#6DB33F",
  },
  {
    name: "Java",
    icon: SiOpenjdk,
    color: "#ED8B00",
  },
  {
    name: "Kotlin",
    icon: SiKotlin,
    color: "#7F52FF",
  },
  {
    name: ".NET Core",
    icon: SiDotnet,
    color: "#512BD4",
  },

  {
    name: "Docker",
    icon: SiDocker,
    color: "#2496ED",
  },
  {
    name: "Azure",
    icon: FaMicrosoft,
    color: "#0078D4",
  },
  {
    name: "GitHub Actions",
    icon: SiGithubactions,
    color: "#FFFFFF",
  },
  {
    name: "MongoDB",
    icon: SiMongodb,
    color: "#47A248",
  },
  {
    name: "PostgreSQL",
    icon: SiPostgresql,
    color: "#4169E1",
  },
  {
    name: "SQL",
    icon: FaDatabase,
    color: "#FFFFFF",
  },
  {
    name: "Git",
    icon: SiGit,
    color: "#F05032",
  },
];

export default function Homepage() {
  usePageMeta(
    "Fullstack & AI-Powered Web Development",
    "Woofi Developments builds modern, AI-powered web applications with React, Node.js, and cloud technologies - fullstack software development based in Carinthia, Austria.",
  );

  const [booting, setBooting] = useState(shouldBoot);

  return (
    <>
      {booting && <LoadingScreen onDone={() => setBooting(false)} />}

      <div
        className={`mx-auto max-w-2xl px-6 py-12 lg:py-16 ${booting ? "" : "animate-fade-up"}`}
      >
        <section className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <img
              src="/profile-image.jpg"
              alt={`${IDENTITY.name}, portrait`}
              width="160"
              height="160"
              fetchPriority="high"
              className="h-20 w-20 shrink-0 rounded-md border border-[var(--line)] object-cover sm:h-24 sm:w-24"
            />

            <div className="min-w-0 pt-1">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--text)] sm:text-3xl">
                {IDENTITY.name}
              </h1>
              <p className="font-mono text-sm text-[var(--muted)]">
                {IDENTITY.handle}
              </p>
              <p className="mt-1.5 text-sm text-[var(--accent)]">
                <FormattedMessage
                  id="homepage.role"
                  defaultMessage="Fullstack developer / Carinthia, Austria"
                />
              </p>
            </div>
          </div>

          <p className="mt-6 leading-7 text-[var(--muted)]">
            <FormattedMessage
              id="homepage.bio"
              defaultMessage="I'm a software developer from Carinthia. I graduated from HTL Villach in 2026 with a Reife- und Diplomprüfung in computer science, and I've done software engineering internships at Infineon Technologies. I write web apps with React on the front and Node behind it, put them in containers, and run them on Azure."
            />
          </p>

          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <SocialRow />
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            <FormattedMessage
              id="homepage.technologies"
              defaultMessage="Technologies I use:"
            />
            
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {technologies.map(({ name, icon: Icon, color }) => (
              <div
                key={name}
                className="
                    group
                    flex items-center gap-3
                    rounded-lg
                    border border-[var(--line)]
                    bg-[var(--surface)]
                    px-4 py-3
                    transition-all
                    hover:-translate-y-0.5
                    hover:border-[var(--accent)]
                "
              >
                <Icon
                  className="h-6 w-6 shrink-0 transition-transform group-hover:scale-110"
                  style={{ color }}
                />

                <span className="text-sm font-medium text-[var(--text)]">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/projects"
            className="rounded-md bg-[var(--text)] px-4 py-2 text-sm font-medium text-[var(--bg)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <FormattedMessage
              id="homepage.viewProjects"
              defaultMessage="View projects"
            />
          </Link>
          <Link
            to="/contact"
            className="rounded-md border border-[var(--line)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <FormattedMessage
              id="homepage.contactMe"
              defaultMessage="Get in touch"
            />
          </Link>
        </section>
      </div>
    </>
  );
}
