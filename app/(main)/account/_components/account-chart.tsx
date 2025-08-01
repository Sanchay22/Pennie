"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Transaction interface - matching Prisma/database schema
interface Transaction {
  id: string;
  date: string | Date;
  description: string | null;
  notes?: string | null;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
}

// Chart data structure
interface ChartData {
  date: string;
  income: number;
  expense: number;
}

// Period totals
interface PeriodTotals {
  income: number;
  expense: number;
}

// Date range configuration
interface DateRangeConfig {
  label: string;
  days: number | null;
}

// Component props
interface AccountChartProps {
  transactions: Transaction[];
}

const DATE_RANGES: Record<string, DateRangeConfig> = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }: AccountChartProps): React.ReactElement {
  const [dateRange, setDateRange] = useState<string>("1M");

  const filteredData = useMemo((): ChartData[] => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions within date range
    const filtered = transactions.filter(
      (t: Transaction): boolean => 
        new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    // Group transactions by date
    const grouped = filtered.reduce((acc: Record<string, ChartData>, transaction: Transaction): Record<string, ChartData> => {
      const transactionDate = new Date(transaction.date);
      const currentYear = now.getFullYear();
      
      // For all-time view or if transaction is from a different year, include year in format
      const dateFormat = (dateRange === "ALL" || transactionDate.getFullYear() !== currentYear) 
        ? "MMM dd, yyyy" 
        : "MMM dd";
      
      const date = format(transactionDate, dateFormat);
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      
      // Ensure amount is a number, handle potential Decimal objects
      const amount = typeof transaction.amount === 'number' 
        ? transaction.amount 
        : (typeof transaction.amount === 'object' && transaction.amount && 'toNumber' in transaction.amount)
          ? (transaction.amount as { toNumber(): number }).toNumber()
          : Number(transaction.amount) || 0;
      
      if (transaction.type === "INCOME") {
        acc[date].income += amount;
      } else {
        acc[date].expense += amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by actual date
    return Object.values(grouped).sort(
      (a: ChartData, b: ChartData): number => {
        // Parse the date strings back to Date objects for proper sorting
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      }
    );
  }, [transactions, dateRange]);

  // Calculate totals for the selected period
  const totals = useMemo((): PeriodTotals => {
    return filteredData.reduce(
      (acc: PeriodTotals, day: ChartData): PeriodTotals => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  const handleDateRangeChange = (value: string): void => {
    setDateRange(value);
  };

  const formatTooltipValue = (value: number): [string, undefined] => {
    return [`₹${value}`, undefined];
  };

  const formatYAxisTick = (value: number): string => `₹${value}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <CardTitle className="text-base font-normal">
          Transaction Overview
        </CardTitle>
        <Select defaultValue={dateRange} onValueChange={handleDateRangeChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(DATE_RANGES).map(([key, { label }]: [string, DateRangeConfig]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="flex justify-around mb-6 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Total Income</p>
            <p className="text-lg font-bold text-green-500">
              ₹{(totals.income || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-bold text-red-500">
              ₹{(totals.expense || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Net</p>
            <p
              className={`text-lg font-bold ${
                (totals.income || 0) - (totals.expense || 0) >= 0
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ₹{((totals.income || 0) - (totals.expense || 0)).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatYAxisTick}
              />
              <Tooltip
                formatter={formatTooltipValue}
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Legend />
              <Bar
                dataKey="income"
                name="Income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="expense"
                name="Expense"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}