
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiveLogs from "@/components/dashboard/LiveLogs";
import SavedLogs from "@/components/dashboard/SavedLogs";
import Analytics from "@/components/dashboard/Analytics";
import { Activity, Database, BarChart3 } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="h-10 w-10 text-blue-400" />
            LogFlow Dashboard
          </h1>
          <p className="text-slate-400 text-lg">
            Real-time log monitoring and analytics platform
          </p>
        </div>

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Live Logs
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="data-[state=active]:bg-green-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <Database className="h-4 w-4" />
              Saved Logs
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="live" className="space-y-6">
              <LiveLogs />
            </TabsContent>

            <TabsContent value="saved" className="space-y-6">
              <SavedLogs />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <Analytics />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
