
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsDisplayProps {
  stats: any;
  isLoading: boolean;
  error: any;
  onRetry: () => void;
}

export function StatsDisplay({ stats, isLoading, error, onRetry }: StatsDisplayProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-md">
        <p className="text-red-600 mb-3">Failed to load statistics data</p>
        <Button 
          onClick={onRetry} 
          variant="outline" 
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-100"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No statistics available</p>
      </div>
    );
  }

  // Prepare data for win/loss chart
  const winLossData = [
    { name: "Wins", value: stats.wins },
    { name: "Losses", value: stats.losses }
  ];

  const COLORS = ["#10b981", "#ef4444"];

  // Prepare prize distribution data
  const prizeData = stats.prizeDistribution ? 
    Object.entries(stats.prizeDistribution).map(([name, value]) => ({ 
      name, 
      value: Number(value) 
    })) : [];

  const PRIZE_COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
    "#84cc16", "#14b8a6", "#06b6d4", "#0ea5e9", 
    "#6366f1", "#d946ef", "#f43f5e", "#10b981"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Summary Cards */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-blue-600 text-sm font-medium mb-1">Total Spins</p>
              <h2 className="text-3xl font-bold text-blue-900">{stats.totalSpins || 0}</h2>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-green-600 text-sm font-medium mb-1">Total Wins</p>
              <h2 className="text-3xl font-bold text-green-900">{stats.wins || 0}</h2>
              <p className="text-green-600 text-xs mt-1">
                {stats.totalSpins ? ((stats.wins / stats.totalSpins) * 100).toFixed(1) + '%' : '0%'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <p className="text-red-600 text-sm font-medium mb-1">Total Losses</p>
              <h2 className="text-3xl font-bold text-red-900">{stats.losses || 0}</h2>
              <p className="text-red-600 text-xs mt-1">
                {stats.totalSpins ? ((stats.losses / stats.totalSpins) * 100).toFixed(1) + '%' : '0%'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Win/Loss Donut Chart */}
        <div className="h-64">
          <p className="text-gray-700 font-medium text-center mb-2">Win/Loss Distribution</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={winLossData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {winLossData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} spins`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Prize Distribution Bar Chart */}
      <div className="h-80">
        <p className="text-gray-700 font-medium text-center mb-2">Top 5 Prize Distribution</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={prizeData.sort((a, b) => b.value - a.value).slice(0, 5)}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 60,
            }}
          >
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              tick={{fontSize: 10}}
            />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} times awarded`, 'Count']} />
            <Legend />
            <Bar dataKey="value" name="Count">
              {prizeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PRIZE_COLORS[index % PRIZE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
