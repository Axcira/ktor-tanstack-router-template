"use client"

import { useAtomValue } from "jotai"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import type { CSSProperties } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { sonnerToastCssVars } from "@/lib/theme-tokens"
import { themeAtom } from "@/store/theme"

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useAtomValue(themeAtom)

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={sonnerToastCssVars as CSSProperties}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          description: "!text-current",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
