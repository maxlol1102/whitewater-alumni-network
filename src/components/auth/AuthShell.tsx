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

      {/* ── Right — pink/purple gradient art panel ── */}
      <aside className="relative hidden overflow-hidden bg-[oklch(0.99_0.002_280)] lg:flex lg:flex-col">
        {/* SVG gradient artwork */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 800 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <linearGradient id="ag1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.85 0.12 280)" />
              <stop offset="50%" stopColor="oklch(0.65 0.20 305)" />
              <stop offset="100%" stopColor="oklch(0.55 0.22 330)" />
            </linearGradient>
            <linearGradient id="ag2" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="oklch(0.78 0.16 60)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="oklch(0.6 0.18 305)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ag3" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.7 0.18 320)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="oklch(0.9 0.08 250)" stopOpacity="0" />
            </linearGradient>
            <filter id="ag-blur">
              <feGaussianBlur stdDeviation="38" />
            </filter>
          </defs>
          <rect width="800" height="1000" fill="oklch(0.99 0.002 280)" />
          <g filter="url(#ag-blur)">
            <path d="M-100 250 Q 200 100 450 350 T 950 600 L 950 0 L -100 0 Z" fill="url(#ag1)" />
            <path
              d="M -50 700 Q 250 500 500 750 T 900 950 L 900 1050 L -50 1050 Z"
              fill="url(#ag2)"
            />
            <ellipse cx="550" cy="500" rx="280" ry="220" fill="url(#ag3)" />
            <ellipse
              cx="200"
              cy="850"
              rx="200"
              ry="160"
              fill="oklch(0.5 0.16 305)"
              opacity="0.30"
            />
          </g>
        </svg>

        {/* Content */}
        <div className="relative flex flex-1 flex-col items-start justify-center p-14">
          <img
            src="/uw-whitewater-logo.png"
            alt=""
            aria-hidden
            className="mb-12 w-[188px] opacity-90"
          />

          <figure className="max-w-sm">
            <div className="mb-3 font-serif text-4xl leading-none text-foreground/20">"</div>
            <blockquote className="text-xl font-medium leading-snug tracking-tight text-foreground/80">
              A quiet, considered network for alumni, faculty, and students of UW–Whitewater
              Computer Science — invitation-only, maintained by the Department.
            </blockquote>
            <figcaption className="mt-5 flex items-center gap-2.5">
              <div className="grid size-7 place-items-center rounded-full bg-foreground/8 text-[10px] font-semibold text-foreground/55">
                CS
              </div>
              <span className="text-xs text-foreground/50">Department of Computer Science</span>
            </figcaption>
          </figure>
        </div>

        {/* Bottom badge */}
        <div className="relative flex justify-center pb-8">
          <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-white/40 px-4 py-1.5 backdrop-blur-sm">
            <ShieldCheck className="size-3 text-[#582C83]" />
            <span className="text-[11px] font-medium text-foreground/50">
              Invitation-only · Faculty-approved
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
