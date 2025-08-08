
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const API_URL = import.meta.env.VITE_API_URL || "/api";
interface PrizeSummary {
  "ILARA MAZIWA 500ML": number;
  "APRONS": number;
  "INDUCTION COOKER": number;
  "KITCHEN SET": number;
  total: number;
}

const fetchPrizeSummary = async (): Promise<PrizeSummary> => {
  const response = await axios.get(`${API_URL}/spin-results/agent-prize-stats`);
  console.log('Prize summary response:', response.data);
  
  // Return the accurate prize summary directly from backend
  return response.data.prizeSummary;
};

export function AgentPrizeStats() {
  const { data: prizeSummary, isLoading, error } = useQuery({
    queryKey: ['prizeSummary'],
    queryFn: fetchPrizeSummary
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Prize Distribution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-600 dark:text-gray-400">Loading prize summary...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Prize Distribution Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600 dark:text-red-400">Error loading prize summary</div>
        </CardContent>
      </Card>
    );
  }

const prizeData = [
  { prize: 'Ilara Maziwa 500ML', count: prizeSummary?.["ILARA MAZIWA 500ML"] || 0 },
  { prize: 'Aprons', count: prizeSummary?.["APRONS"] || 0 },
  { prize: 'Induction Cooker', count: prizeSummary?.["INDUCTION COOKER"] || 0 },
  { prize: 'Kitchen Set', count: prizeSummary?.["KITCHEN SET"] || 0 },
];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Prize Distribution Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-gray-900 dark:text-white font-semibold">Prize Type</TableHead>
              <TableHead className="text-gray-900 dark:text-white font-semibold text-right">Quantity Distributed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prizeData.map((item) => (
              <TableRow key={item.prize}>
                <TableCell className="text-gray-800 dark:text-gray-200 font-medium">{item.prize}</TableCell>
                <TableCell className="text-gray-800 dark:text-gray-200 text-right">{item.count}</TableCell>
              </TableRow>
            ))}
            <TableRow className="border-t-2 border-gray-300 dark:border-gray-600">
              <TableCell className="text-gray-900 dark:text-white font-bold">TOTAL PRIZES</TableCell>
              <TableCell className="text-gray-900 dark:text-white font-bold text-right">{prizeSummary?.total || 0}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
