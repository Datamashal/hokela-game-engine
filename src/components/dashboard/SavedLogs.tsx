
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Database, Search, Filter, Calendar } from "lucide-react";

const SavedLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterService, setFilterService] = useState("all");

  // Mock saved logs data
  const savedLogs = Array.from({ length: 20 }, (_, i) => ({
    id: `saved-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    level: ['info', 'warn', 'error', 'success'][Math.floor(Math.random() * 4)],
    message: [
      'User authentication successful',
      'Database connection established',
      'API rate limit exceeded',
      'File upload completed',
      'Cache invalidated',
      'Request timeout occurred',
      'Payment processed successfully',
      'Email notification sent',
      'Backup completed',
      'System health check passed'
    ][Math.floor(Math.random() * 10)],
    service: ['auth-service', 'payment-service', 'user-service', 'file-service', 'email-service'][Math.floor(Math.random() * 5)],
    endpoint: ['/api/login', '/api/users', '/api/upload', '/api/payments', '/api/notifications'][Math.floor(Math.random() * 5)],
    statusCode: [200, 201, 400, 401, 404, 500][Math.floor(Math.random() * 6)],
    processingTime: Math.floor(Math.random() * 2000) + 10
  }));

  const filteredLogs = savedLogs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    const matchesService = filterService === "all" || log.service === filterService;
    
    return matchesSearch && matchesLevel && matchesService;
  });

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
              </SelectContent>
            </Select>

            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger className="w-full md:w-[180px] bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">All Services</SelectItem>
                <SelectItem value="auth-service">Auth Service</SelectItem>
                <SelectItem value="payment-service">Payment Service</SelectItem>
                <SelectItem value="user-service">User Service</SelectItem>
                <SelectItem value="file-service">File Service</SelectItem>
                <SelectItem value="email-service">Email Service</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          <ScrollArea className="h-[500px] w-full">
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:bg-slate-700/70 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
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
                      <span>{log.endpoint}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={log.statusCode >= 400 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {log.statusCode}
                      </Badge>
                      <span className="text-slate-400">{log.processingTime}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SavedLogs;
