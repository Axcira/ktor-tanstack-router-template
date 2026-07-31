import { createFileRoute } from "@tanstack/react-router";
import PlaygroundPage from "./-components/PlaygroundPage";

export const Route = createFileRoute("/_app/playground/nav1-1")({
  component: () => <PlaygroundPage title="Playground Nav 1-1" />,
});
