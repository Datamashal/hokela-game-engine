
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  service: string;
  endpoint?: string;
  statusCode?: number;
  processingTime?: number;
}

const LiveLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Simulate real-time log streaming
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: ['info', 'warn', 'error', 'success'][Math.floor(Math.random() * 4)] as LogEntry['level'],
        message: [
          'User authentication successful',
          'Database connection established',
          'API rate limit exceeded',
          'File upload completed',
          'Cache invalidated',
          'Request timeout occurred',
          'Payment processed successfully'
        ][Math.floor(Math.random() * 7)],
        service: ['auth-service', 'payment-service', 'user-service', 'file-service'][Math.floor(Math.random() * 4)],
        endpoint: ['/api/login', '/api/users', '/api/upload', '/api/payments'][Math.floor(Math.random() * 4)],
        statusCode: [200, 201, 400, 401, 500][Math.floor(Math.random() * 5)],
        processingTime: Math.floor(Math.random() * 1000) + 50
      };

      setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep only latest 50 logs
    }, 2000);

    setIsConnected(true);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, []);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-300';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-400" />
            Live Log Stream
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getLogColor(log.level)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getLogIcon(log.level)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white mb-1">{log.message}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.service}
                        </Badge>
                        {log.endpoint && (
                          <span className="text-slate-500">{log.endpoint}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {log.statusCode && (
                      <Badge 
                        variant={log.statusCode >= 400 ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {log.statusCode}
                      </Badge>
                    )}
                    {log.processingTime && (
                      <span>{log.processingTime}ms</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveLogs;
