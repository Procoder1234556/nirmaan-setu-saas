import aiReadyDark from "../client/static/assets/aiready-dark.webp";
import aiReady from "../client/static/assets/aiready.webp";
import { HighlightedFeature } from "./components/HighlightedFeature";

export function AIReady() {
  return (
    <HighlightedFeature
      name="Causal Monotonic Reordering & Dynamic CPM Engine"
      description="Frontline field engineers capture voice notes and DPR progress completely offline. When reconnected, Nirmaan Setu sorts updates by cryptographic hardware monotonic clocks and executes forward/backward passes to immediately alert planners to critical path slips before they cascade."
      highlightedComponent={<AIReadyExample />}
      direction="row-reverse"
    />
  );
}

function AIReadyExample() {
  return (
    <div className="w-full">
      <img
        src={aiReady}
        alt="AI Ready"
        loading="lazy"
        className="dark:hidden"
      />
      <img
        src={aiReadyDark}
        alt="AI Ready"
        loading="lazy"
        className="hidden dark:block"
      />
    </div>
  );
}
