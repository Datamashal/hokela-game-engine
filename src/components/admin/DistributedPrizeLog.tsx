import React from 'react';
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function DistributedPrizeLog() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['distributedPrizes'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/spin-results`);
      return Array.isArray(res.data) ? res.data.filter((r: any) => r.is_win) : [];
    }
  });

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Distributed Prizes Log</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading distributed prizes...</div>
        )}
        {error && (
          <div className="text-center py-4 text-red-600 dark:text-red-400">Error loading distributed prizes</div>
        )}
        {!isLoading && !error && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Prize</TableHead>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Name</TableHead>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Email</TableHead>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Location</TableHead>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Agent</TableHead>
                <TableHead className="text-gray-900 dark:text-white font-semibold">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data && data.length > 0 ? (
                data.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-gray-800 dark:text-gray-200">{item.prize}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{item.name}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{item.email}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{item.location}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{item.agent_name || '-'}</TableCell>
                    <TableCell className="text-gray-800 dark:text-gray-200">{new Date(item.date).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-600 dark:text-gray-400">No prizes distributed yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
