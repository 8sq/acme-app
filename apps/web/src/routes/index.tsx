import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main>
      <h1>ygoma</h1>
      <p>Yu-Gi-Oh! tournament manager</p>
    </main>
  );
}
