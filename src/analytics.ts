import type {PostHog} from "posthog-js";

type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>;

// PostHog project tokens are intentionally public write-only browser tokens.
// A Vite variable can override this project's default for forks/deployments.
const projectToken = import.meta.env.VITE_POSTHOG_KEY?.trim()
    || "phc_1HiV35YJIIU8z4K0tp4SCkviladPieFdmj3nHh1k8Ns";
const apiHost = import.meta.env.VITE_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com";
let analyticsClient: Promise<PostHog | null> | null = null;

export function initializeAnalytics(): void {
    if (!projectToken) {
        console.info("PostHog analytics disabled: VITE_POSTHOG_KEY is not configured.");
        return;
    }
    analyticsClient = import("posthog-js").then(({default: posthog}) => {
        posthog.init(projectToken, {
            api_host: apiHost,
            capture_pageview: true,
            capture_pageleave: true,
            autocapture: false,
            disable_session_recording: true,
            person_profiles: "identified_only",
            persistence: "localStorage",
            loaded: (client) => {
                client.register({app: "mujocoweb", deployment: window.location.hostname});
            },
        });
        return posthog;
    }).catch((error) => {
        console.warn("PostHog analytics could not be loaded:", error);
        return null;
    });
}

export function captureEvent(name: string, properties: AnalyticsProperties = {}): void {
    if (!analyticsClient) return;
    void analyticsClient.then((client) => client?.capture(name, properties));
}
