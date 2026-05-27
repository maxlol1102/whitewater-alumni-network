import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* ── Left — form panel ── */}
      <div className="flex flex-col">
        <header className="px-8 pt-8 sm:px-12">
          <Link to="/" aria-label="Go to home">
            <img
              src="/uw-whitewater-logo.png"
              alt="University of Wisconsin-Whitewater"
              className="h-auto w-[160px] sm:w-[180px]"
            />
          </Link>
          <div className="mt-2.5 flex items-center gap-1.5">
            <ShieldCheck className="size-3 text-muted-foreground/50" />
            <span className="text-[11px] font-medium tracking-wide text-muted-foreground/50">
              Invitation-only · Faculty-approved
            </span>
          </div>
        </header>

        <div className="flex-1 grid place-items-center px-8 py-12 sm:px-12">
          <div className="w-full max-w-[380px]">{children}</div>
        </div>
      </div>

      {/* ── Right — dark purple brand panel ── */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:flex-col"
        style={{
          background: "linear-gradient(155deg, #1e0838 0%, #2e1260 55%, #150828 100%)",
        }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-[-80px] h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[#582C83] opacity-30 blur-[120px]" />
          <div className="absolute bottom-[15%] right-[8%] h-[260px] w-[260px] rounded-full bg-[#CFB87C] opacity-[0.07] blur-[80px]" />
        </div>
        {/* Dot-grid texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />

        {/* Content */}
        <div className="relative flex flex-1 flex-col items-start justify-center p-14">
          <img
            src="/uw-whitewater-logo.png"
            alt=""
            aria-hidden
            className="mb-12 w-[188px] brightness-0 invert opacity-85"
          />

          <figure className="max-w-sm">
            <div className="mb-3 font-serif text-4xl leading-none text-white/20">"</div>
            <blockquote className="text-xl font-medium leading-snug tracking-tight text-white/80">
              A quiet, considered network for alumni, faculty, and students of UW–Whitewater
              Computer Science — invitation-only, maintained by the Department.
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-white/55">
                CS
              </div>
              <span className="text-xs text-white/50">Department of Computer Science</span>
            </figcaption>
          </figure>
        </div>

        {/* Bottom badge */}
        <div className="relative flex justify-center pb-8">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <ShieldCheck className="size-3 text-[#CFB87C]" />
            <span className="text-[11px] font-medium text-white/45">
              Invitation-only · Faculty-approved
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
