import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UW-Whitewater Computer Science Alumni Network" },
      {
        name: "description",
        content:
          "A private UW-Whitewater Computer Science workspace for university users and faculty-managed alumni engagement.",
      },
    ],
  }),
  component: LandingPage,
});
