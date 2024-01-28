import * as Sentry from "@sentry/browser";
import * as SentryIntegrations from "@sentry/integrations";

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DNS,
  environment: process.env.REACT_APP_SENTRY_ENV || "dev",
  release: process.env.REACT_APP_GIT_SHA,
  ignoreErrors: [
    "undefined is not an object (evaluating 'window.__pad.performLoop')", // Only happens on Safari, but spams our servers. Doesn't break anything
  ],
  integrations: [
    new SentryIntegrations.CaptureConsole({
      levels: ["error"],
    }),
  ],
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/#.*$/, "");
    }
    return event;
  },
});
