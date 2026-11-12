import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { XerReport } from "@/services/xer.service";

const chartConfig = {
  count: { label: "Activities", color: "var(--primary)" },
} satisfies ChartConfig;

const fill = (id: string) =>
  id === "negative" ? "var(--destructive)" : id === "high" ? "oklch(0.769 0.188 70.08)" : "var(--primary)";

/** How many checked activities fall in each total-float band, in working days. */
export function FloatChart({ bins }: { bins: XerReport["floatHistogram"] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
      <BarChart data={bins} margin={{ top: 20, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={<ChartTooltipContent hideIndicator labelFormatter={(label) => `${label} working days`} />}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          {bins.map((bin) => (
            <Cell key={bin.id} fill={fill(bin.id)} />
          ))}
          <LabelList dataKey="count" position="top" className="fill-muted-foreground text-3xs" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
