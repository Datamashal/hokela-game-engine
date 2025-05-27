
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Search, Filter, Calendar, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  service: string;
  endpoint?: string;
  statusCode?: number;
  processingTime?: number;
  userId?: string;
  requestId?: string;
}

const SavedLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<string[]>([]);

  useEffect(() => {
    // TODO: Fetch saved logs from API
    // const fetchLogs = async () => {
    //   setIsLoading(true);
    //   try {
    //     const response = await fetch('/api/logs');
    //     const data = await response.json();
    //     setLogs(data.logs);
    //     setServices([...new Set(data.logs.map(log => log.service))]);
    //   } catch (error) {
    //     console.error('Error fetching logs:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesService = filterService === "all" || log.service === filterService;
    
    return matchesSearch && matchesLevel && matchesService;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setFilterLevel("all");
    setFilterService("all");
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'debug': return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-green-400" />
            Saved Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Log Level" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Services</SelectItem>
                {services.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={clearFilters}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          <ScrollArea className="h-[500px] w-full">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                <div className="text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No saved logs yet</p>
                  <p className="text-sm">
                    {isLoading ? 'Loading logs...' : 'Logs will appear here once they are saved to the database'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getLogIcon(log.level)}
                        <Badge 
                          variant={log.level === 'error' ? "destructive" : "secondary"}
                          className="capitalize"
                        >
                          {log.level}
                        </Badge>
                        <span className="text-white font-medium">{log.message}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4 text-slate-400">
                        <span className="bg-slate-600 px-2 py-1 rounded text-xs">{log.service}</span>
                        {log.endpoint && <span>{log.endpoint}</span>}
                        {log.requestId && (
                          <span className="text-slate-500 font-mono">ID: {log.requestId}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {log.statusCode && (
                          <Badge 
                            variant={log.statusCode >= 400 ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {log.statusCode}
                          </Badge>
                        )}
                        {log.processingTime && (
                          <span className="text-slate-400">{log.processingTime}ms</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedLogs;
