import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/playground/nav1-1')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 px-4 py-24 text-center">
      <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Playground Nav 1-1
      </h1>
      </div>
  )
}
