import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/showcase/")({
  component: DashboardPage,
})

const monthlySales = [
  { month: "1月", sales: 2400000, orders: 186 },
  { month: "2月", sales: 1980000, orders: 152 },
  { month: "3月", sales: 3200000, orders: 241 },
  { month: "4月", sales: 2780000, orders: 209 },
  { month: "5月", sales: 3560000, orders: 267 },
  { month: "6月", sales: 4100000, orders: 312 },
  { month: "7月", sales: 3890000, orders: 295 },
  { month: "8月", sales: 4320000, orders: 328 },
  { month: "9月", sales: 3750000, orders: 284 },
  { month: "10月", sales: 4580000, orders: 347 },
  { month: "11月", sales: 5120000, orders: 389 },
  { month: "12月", sales: 5680000, orders: 431 },
]

const weeklySales = [
  { day: "月", sales: 820000, orders: 62 },
  { day: "火", sales: 930000, orders: 71 },
  { day: "水", sales: 1050000, orders: 80 },
  { day: "木", sales: 880000, orders: 67 },
  { day: "金", sales: 1120000, orders: 85 },
  { day: "土", sales: 1340000, orders: 102 },
  { day: "日", sales: 760000, orders: 58 },
]

const salesChartConfig = {
  sales: { label: "売上", color: "var(--chart-1)" },
  orders: { label: "件数", color: "var(--chart-2)" },
} satisfies ChartConfig

const kpiCards = [
  {
    title: "月間売上",
    value: "¥5,680,000",
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    description: "前月比",
  },
  {
    title: "受注件数",
    value: "431",
    change: "+10.8%",
    trend: "up" as const,
    icon: ShoppingCart,
    description: "前月比",
  },
  {
    title: "新規顧客",
    value: "89",
    change: "-3.2%",
    trend: "down" as const,
    icon: Users,
    description: "前月比",
  },
  {
    title: "在庫数",
    value: "1,247",
    change: "+5.1%",
    trend: "up" as const,
    icon: Package,
    description: "前月比",
  },
]

type ViewState = "loaded" | "loading" | "error" | "empty"

function DashboardPage() {
  const [viewState, setViewState] = useState<ViewState>("loaded")

  const handleRefresh = () => {
    setViewState("loading")
    setTimeout(() => {
      setViewState("loaded")
      toast.success("データを更新しました")
    }, 1500)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ダッシュボード</h1>
          <p className="text-sm text-muted-foreground">売上・受注の概況</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 border rounded-md p-0.5">
            {(["loaded", "loading", "error", "empty"] as const).map((s) => (
              <Button
                key={s}
                variant={viewState === s ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setViewState(s)}
              >
                {s === "loaded" ? "通常" : s === "loading" ? "読込中" : s === "error" ? "エラー" : "空"}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="size-4 mr-1" />
            更新
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {viewState === "loading"
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="size-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-7 w-28 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))
          : viewState === "error"
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-destructive/30">
                  <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                    <AlertCircle className="size-8 text-destructive mb-2" />
                    <p className="text-sm text-destructive">データの取得に失敗しました</p>
                    <Button variant="ghost" size="xs" className="mt-2" onClick={handleRefresh}>
                      再試行
                    </Button>
                  </CardContent>
                </Card>
              ))
            : viewState === "empty"
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                      <p className="text-sm text-muted-foreground">データがありません</p>
                    </CardContent>
                  </Card>
                ))
              : kpiCards.map((kpi) => (
                  <Card key={kpi.title}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </CardTitle>
                      <kpi.icon className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{kpi.value}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          variant={kpi.trend === "up" ? "default" : "destructive"}
                          className="text-xs px-1.5 py-0"
                        >
                          {kpi.trend === "up" ? (
                            <TrendingUp className="size-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="size-3 mr-0.5" />
                          )}
                          {kpi.change}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{kpi.description}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>売上推移</CardTitle>
            <CardDescription>月別売上高（円）</CardDescription>
          </CardHeader>
          <CardContent>
            {viewState === "loading" ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : viewState === "error" ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="size-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">グラフの読み込みに失敗しました</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={handleRefresh}>
                  再試行
                </Button>
              </div>
            ) : viewState === "empty" ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-sm text-muted-foreground">表示するデータがありません</p>
              </div>
            ) : (
              <ChartContainer config={salesChartConfig} className="h-64 w-full">
                <AreaChart data={monthlySales} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => `${(v / 10000).toFixed(0)}万`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) =>
                          `¥${Number(value).toLocaleString()}`
                        }
                      />
                    }
                  />
                  <Area
                    dataKey="sales"
                    type="monotone"
                    fill="var(--chart-1)"
                    fillOpacity={0.15}
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>週間受注件数</CardTitle>
            <CardDescription>曜日別の受注数</CardDescription>
          </CardHeader>
          <CardContent>
            {viewState === "loading" ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : viewState === "error" ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="size-8 text-destructive mb-2" />
                <p className="text-sm text-destructive">グラフの読み込みに失敗しました</p>
                <Button variant="ghost" size="sm" className="mt-2" onClick={handleRefresh}>
                  再試行
                </Button>
              </div>
            ) : viewState === "empty" ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-sm text-muted-foreground">表示するデータがありません</p>
              </div>
            ) : (
              <ChartContainer config={salesChartConfig} className="h-64 w-full">
                <BarChart data={weeklySales} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="orders" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
