import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { trackSurveyOpen } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/survey/respond/$token")({
  component: SurveyRespondPage,
});

type PageState =
  | { status: "loading" }
  | { status: "ready"; tally_form_url: string; campaign_name: string }
  | { status: "invalid" };

function SurveyRespondPage() {
  const { token } = Route.useParams();
  const trackFn = useServerFn(trackSurveyOpen);
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    trackFn({ data: { token } })
      .then((r) => {
        if (!r.ok || !r.tally_form_url) {
          setState({ status: "invalid" });
        } else {
          setState({
            status: "ready",
            tally_form_url: r.tally_form_url,
            campaign_name: r.campaign_name,
          });
        }
      })
      .catch(() => setState({ status: "invalid" }));
  }, [token, trackFn]);

  if (state.status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your survey…</p>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl font-bold text-muted-foreground mb-4">404</div>
          <h1 className="text-lg font-semibold">Survey link not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This link may be invalid, expired, or already used. Contact the sender if you believe
            this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-3 shrink-0">
        <span className="font-semibold text-sm">UW–Whitewater CS Alumni</span>
        {state.campaign_name && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{state.campaign_name}</span>
          </>
        )}
      </header>
      <main className="flex-1">
        <iframe
          src={state.tally_form_url}
          className="w-full border-none"
          style={{ height: "calc(100vh - 53px)" }}
          title="Survey"
          allow="camera; microphone; autoplay; encrypted-media"
        />
      </main>
    </div>
  );
}
