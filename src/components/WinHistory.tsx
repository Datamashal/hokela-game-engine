
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

interface WinRecord {
  id: number;
  name: string;
  email: string;
  location: string;
  agent_name: string;
  prize: string;
  isWin: boolean;
  date: string;
}

// Use the environment variable or fallback to the API path
const API_URL = import.meta.env.VITE_API_URL || "/api";

export function WinHistory() {
  const [records, setRecords] = useState<WinRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWinHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching spin history from: ${API_URL}/spin-results`);
      
      // Attempt to fetch from backend API with an extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Extended to 30 seconds
      
      const response = await fetch(`${API_URL}/spin-results`, {
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        cache: 'no-cache', // Disable caching
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Parse response
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw new Error(`Server returned invalid response (Status: ${response.status})`);
      }
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Service temporarily unavailable. Please try again later.');
        } else if (response.status === 500) {
          throw new Error(responseData.message || 'Internal server error. Please try again.');
        } else {
          throw new Error(responseData.message || `Server error: ${response.status}`);
        }
      }
      
      console.log('Successfully fetched spin history:', responseData.length, 'records');
      
      // Transform the data to match our frontend model (is_win to isWin)
      const transformedData = responseData.map((record: any) => ({
        id: record.id,
        name: record.name,
        email: record.email,
        location: record.location,
        agent_name: record.agent_name || 'N/A',
        prize: record.prize,
        isWin: record.is_win,  // Convert from is_win to isWin
        date: record.date
      }));
      
      setRecords(transformedData);
    } catch (error: any) {
      console.error('Error fetching win history:', error);
      
      let errorMessage = 'Failed to connect to server';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - please check your connection and try again';
      } else if (error.message.includes('503')) {
        errorMessage = 'Service temporarily unavailable - please try again in a few moments';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error - please check your internet connection';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      toast({
        title: "Connection Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWinHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500"></div>
          <p className="text-gray-500">Loading spin history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-red-800 text-sm">
              {error}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWinHistory}
              className="flex items-center gap-1"
              disabled={isLoading}
            >
              <RefreshCcw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} /> 
              {isLoading ? 'Retrying...' : 'Retry'}
            </Button>
          </div>
        </div>
      )}
      
      {records.length === 0 && !error && !isLoading ? (
        <div className="text-center p-8">
          <p className="text-gray-500">No spin history available yet. Play the game to see your results here!</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Prize</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>{record.name}</TableCell>
                  <TableCell>{record.location}</TableCell>
                  <TableCell>{record.agent_name}</TableCell>
                  <TableCell>{record.prize}</TableCell>
                  <TableCell>
                    <span className={record.isWin ? "text-green-600 font-bold" : "text-red-500 font-medium"}>
                      {record.isWin ? "Win" : "Loss"}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(record.date).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
