import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/sentry-test/")({
  component: SentryTest,
});

function SentryTest() {
  return (
    <main>
      <h1>Sentry Test</h1>
      <ul>
        <li>
          <Link to="/sentry-test/error">Route that throws on render</Link>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              throw new Error("Client-side onclick error");
            }}
          >
            Throw error on click
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => {
              fetch("/api/does-not-exist").catch(() => null);
            }}
          >
            Fetch non-existent API route
          </button>
        </li>
      </ul>
    </main>
  );
}
