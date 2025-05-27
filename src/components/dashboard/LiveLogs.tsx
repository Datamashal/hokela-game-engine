
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";

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

const LiveLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // TODO: Initialize WebSocket connection to backend
    // const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
    // const socket = new WebSocket(wsUrl);
    
    // socket.onopen = () => {
    //   console.log('WebSocket connected');
    //   setIsConnected(true);
    // };

    // socket.onmessage = (event) => {
    //   const newLog = JSON.parse(event.data);
    //   setLogs(prev => [newLog, ...prev.slice(0, 49)]);
    // };

    // socket.onclose = () => {
    //   console.log('WebSocket disconnected');
    //   setIsConnected(false);
    // };

    // socket.onerror = (error) => {
    //   console.error('WebSocket error:', error);
    //   setIsConnected(false);
    // };

    // return () => {
    //   socket.close();
    // };

    // Temporary: Show disconnected state until WebSocket is implemented
    setIsConnected(false);
  }, []);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      case 'warn': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'debug': return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-300';
      case 'warn': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-300';
      case 'success': return 'bg-green-500/10 border-green-500/20 text-green-300';
      case 'debug': return 'bg-gray-500/10 border-gray-500/20 text-gray-300';
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
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No live logs yet</p>
                <p className="text-sm">
                  {isConnected ? 'Waiting for log entries...' : 'Connect to backend to see live logs'}
                </p>
              </div>
            </div>
          ) : (
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
                          {log.requestId && (
                            <span className="text-slate-500 font-mono">ID: {log.requestId}</span>
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
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LiveLogs;
