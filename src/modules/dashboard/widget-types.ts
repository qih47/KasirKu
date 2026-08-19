export type WidgetColSpan = 1 | 2 | 3 | 4;

export interface DashboardWidgetItem {
  instanceId: string;
  widgetKey: string;
  colSpan: WidgetColSpan;
  order: number;
  customTitle?: string;
}

export interface WidgetDefinition {
  key: string;
  title: string;
  category: "SUMMARY" | "CHART" | "UTILITY" | "VERTICAL";
  description: string;
  defaultColSpan: WidgetColSpan;
  allowedColSpans: WidgetColSpan[];
  icon: string;
  requiredPlugin?: string | null;
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetItem[] = [
  { instanceId: "w-clock", widgetKey: "WIDGET_DIGITAL_CLOCK", colSpan: 1, order: 0 },
  { instanceId: "w-rev-today", widgetKey: "WIDGET_REVENUE_TODAY", colSpan: 1, order: 1 },
  { instanceId: "w-target", widgetKey: "WIDGET_DAILY_TARGET", colSpan: 1, order: 2 },
  { instanceId: "w-quick-actions", widgetKey: "WIDGET_QUICK_ACTIONS", colSpan: 1, order: 3 },
  { instanceId: "w-chart-7d", widgetKey: "WIDGET_CHART_7DAYS", colSpan: 2, order: 4 },
  { instanceId: "w-recent-tx", widgetKey: "WIDGET_RECENT_TRANSACTIONS", colSpan: 2, order: 5 },
  { instanceId: "w-low-stock", widgetKey: "WIDGET_LOW_STOCK_ALERT", colSpan: 2, order: 6 },
  { instanceId: "w-vertical-status", widgetKey: "WIDGET_VERTICAL_STATUS", colSpan: 2, order: 7 },
];
