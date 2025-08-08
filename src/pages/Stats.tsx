import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, RefreshCw, BarChart3, ChartPie, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StatsDisplay } from "@/components/admin/StatsDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AgentManagement } from "@/components/admin/AgentManagement";


// API base URL - use environment variable or fallback to the API path
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Function to fetch spin stats
const fetchSpinStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/spin-results/stats`);
    console.log("Spin stats fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching spin stats:", error);
    throw error;
  }
};

// Interface for chart component props
interface ChartComponentProps {
  stats: any;
  isLoading: boolean;
  error: any;
}

const Stats = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Fetch spin stats data - we'll use this for both overview and agent stats for now
  const {
    data: spinStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['spinStats'],
    queryFn: fetchSpinStats,
  });

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Successfully logged out");
  };

  // Handle retry loading stats
  const handleRetryStatsLoad = () => {
    refetchStats();
    toast.info("Retrying to fetch statistics...");
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-4 md:py-8 px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-none mx-auto" style={{ width: '95%' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Statistics Dashboard</h1>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
            size="sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full mb-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 mx-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <ChartPie className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="prizes" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> Prize Analysis
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" /> BA Management
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6">
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <ChartPie className="h-5 w-5 text-primary" />
                    Spin Wheel Overview
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleRetryStatsLoad}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Overview of spin wheel results and prize distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <StatsDisplay 
                  stats={spinStats} 
                  isLoading={statsLoading} 
                  error={statsError} 
                  onRetry={handleRetryStatsLoad} 
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="prizes" className="mt-6">
            <Card className="shadow-lg border-t-4 border-t-purple-500">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-500" />
                    Individual Prize Analysis
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleRetryStatsLoad}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Detailed analysis of individual prize distribution
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <PrizeDistributionChart 
                  stats={spinStats} 
                  isLoading={statsLoading} 
                  error={statsError} 
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="mt-6">
            <Card className="shadow-lg border-t-4 border-t-green-500">
              <CardHeader className="bg-muted/50">
                <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    Business Agent Management
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Manage business agents and their unique agent IDs
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <AgentManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Component for prize distribution chart
const PrizeDistributionChart: React.FC<ChartComponentProps> = ({ stats, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading prize statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-md">
        <p className="text-red-600 mb-3">Failed to load prize statistics data</p>
      </div>
    );
  }

  if (!stats || !stats.prizeDistribution) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No prize statistics available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Top Prizes</CardTitle>
            <CardDescription>Most frequently awarded prizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <TopPrizesChart prizeDistribution={stats.prizeDistribution} />
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Win Rate by Prize</CardTitle>
            <CardDescription>Percentage of total wins per prize</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <WinRateChart prizeDistribution={stats.prizeDistribution} totalWins={stats.wins} />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div>
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Complete Prize Distribution</CardTitle>
            <CardDescription>All prizes and their distribution counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <AllPrizesChart prizeDistribution={stats.prizeDistribution} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Interface for prize chart props
interface PrizeChartProps {
  prizeDistribution: { [key: string]: number };
}

interface WinRateChartProps extends PrizeChartProps {
  totalWins: number;
}

// Component for top prizes chart
const TopPrizesChart: React.FC<PrizeChartProps> = ({ prizeDistribution }) => {
  const COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
    "#84cc16", "#14b8a6", "#06b6d4", "#0ea5e9", 
    "#6366f1", "#d946ef", "#f43f5e", "#10b981"
  ];
  
  // Get top 5 prizes
  const topPrizes = Object.entries(prizeDistribution)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 5)
    .map(([name, value]) => ({ name, value: Number(value) }));

  return (
    <div className="h-full w-full">
      {topPrizes.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={topPrizes}
            margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} awards`, 'Count']} />
            <Bar dataKey="value" name="Awards">
              {topPrizes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          No prize data available
        </div>
      )}
    </div>
  );
};

// Component for win rate chart
const WinRateChart: React.FC<WinRateChartProps> = ({ prizeDistribution, totalWins }) => {
  const COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
    "#84cc16", "#14b8a6", "#06b6d4", "#0ea5e9", 
    "#6366f1", "#d946ef", "#f43f5e", "#10b981"
  ];
  
  const winRateData = Object.entries(prizeDistribution)
    .map(([name, value]) => ({
      name,
      value: Number(value),
      percentage: totalWins ? ((Number(value) / totalWins) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return (
    <div className="h-full w-full">
      {winRateData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={winRateData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {winRateData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name, props) => [`${props.payload.percentage}%`, props.payload.name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          No win rate data available
        </div>
      )}
    </div>
  );
};

// Component for all prizes chart
const AllPrizesChart: React.FC<PrizeChartProps> = ({ prizeDistribution }) => {
  const COLORS = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#f97316", 
    "#84cc16", "#14b8a6", "#06b6d4", "#0ea5e9", 
    "#6366f1", "#d946ef", "#f43f5e", "#10b981"
  ];
  
  const allPrizes = Object.entries(prizeDistribution)
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="h-full w-full">
      {allPrizes.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={allPrizes}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip formatter={(value) => [`${value} awards`, 'Count']} />
            <Bar dataKey="value" name="Awards">
              {allPrizes.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">
          No prize data available
        </div>
      )}
    </div>
  );
};

export default Stats;
