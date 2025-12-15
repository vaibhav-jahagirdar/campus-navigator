"use client"

import React from "react"
import { cn } from "@/lib/utils"

type TooltipPayloadItem = {
  name?: string
  dataKey?: string
  value?: number
  color?: string
  payload?: Record<string, any>
}

type ChartTooltipProps = {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string | number
  formatter?: (
    value: number,
    name: string,
    item: TooltipPayloadItem,
    index: number,
    payload: Record<string, any> | undefined
  ) => React.ReactNode
  labelFormatter?: (
    label: string | number | undefined,
    payload: TooltipPayloadItem[]
  ) => React.ReactNode
  className?: string
  indicator?: "line" | "dot" | "dashed"
  hideLabel?: boolean
  hideIndicator?: boolean
  color?: string
  nameKey?: string
  labelKey?: string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  formatter,
  color,
  nameKey,
  labelKey,
}: ChartTooltipProps) {
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null

    const item = payload[0]
    const value = label ?? item?.name ?? item?.dataKey

    if (!value) return null

    if (labelFormatter) {
      return <div className="font-medium">{labelFormatter(value, payload)}</div>
    }

    return <div className="font-medium">{value}</div>
  }, [hideLabel, payload, label, labelFormatter])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== "dot"

  return (
    <div
      className={cn(
        "border border-[hsl(var(--border)/0.5)] bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}

      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`
          const indicatorColor = color || item.payload?.fill || item.color

          return (
            <div
              key={key + index}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center"
              )}
            >
              {formatter && item.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn("shrink-0 rounded-[2px]", {
                        "h-2.5 w-2.5": indicator === "dot",
                        "w-1": indicator === "line",
                        "w-0 border-[1.5px] border-dashed bg-transparent":
                          indicator === "dashed",
                        "my-0.5": nestLabel && indicator === "dashed",
                      })}
                      style={{
                        backgroundColor: indicatorColor,
                        borderColor: indicatorColor,
                      }}
                    />
                  )}

                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center"
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {item.name || item.dataKey}
                      </span>
                    </div>

                    {item.value !== undefined && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ChartTooltipContent
