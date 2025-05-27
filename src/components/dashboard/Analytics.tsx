
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Clock, AlertTriangle, Activity } from "lucide-react";

interface AnalyticsData {
  requestVolume: Array<{ time: string; requests: number }>;
  processingTime: Array<{ endpoint: string; avgTime: number }>;
  errorRate: Array<{ name: string; value: number; color: string }>;
  logsPerEndpoint: Array<{ endpoint: string; logs: number }>;
  totalRequests: number;
  avgResponseTime: number;
  activeServices: number;
  errorRatePercent: number;
}

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch analytics data from API
    // const fetchAnalytics = async () => {
    //   setIsLoading(true);
    //   try {
    //     const response = await fetch('/api/analytics');
    //     const data = await response.json();
    //     setAnalyticsData(data);
    //   } catch (error) {
    //     console.error('Error fetching analytics:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchAnalytics();
  }, []);

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-[400px] text-slate-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No analytics data yet</p>
            <p className="text-sm">
              {isLoading ? 'Loading analytics...' : 'Analytics will be generated once logs start flowing through the system'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-300 text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Total Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.totalRequests.toLocaleString()}</div>
            <p className="text-blue-300 text-xs">Real-time data</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-300 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.avgResponseTime}ms</div>
            <p className="text-green-300 text-xs">Calculated from logs</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-300 text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.activeServices}</div>
            <p className="text-purple-300 text-xs">Services logging data</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-300 text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Error Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analyticsData.errorRatePercent}%</div>
            <p className="text-red-300 text-xs">From recent logs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Volume Over Time */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Request Volume Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.requestVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.requestVolume}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No request volume data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Time by Endpoint */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Avg Processing Time by Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.processingTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.processingTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="endpoint" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }} 
                  />
                  <Bar dataKey="avgTime" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No processing time data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Error Rate Distribution */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Response Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.errorRate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.errorRate}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analyticsData.errorRate.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No status distribution data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Logs per Endpoint */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Logs per Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData.logsPerEndpoint.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.logsPerEndpoint} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="endpoint" type="category" stroke="#94a3b8" width={120} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#ffffff'
                    }} 
                  />
                  <Bar dataKey="logs" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-slate-400">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No endpoint data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
