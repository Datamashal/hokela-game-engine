
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AgentPrizeStats } from "@/components/admin/AgentPrizeStats";
import { ThemeToggle } from "@/components/ThemeToggle";
const PrizeStats = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground py-4 md:py-8 px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-none mx-auto" style={{ width: '99%' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/admin')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Prize Statistics</h1>
          </div>
          <ThemeToggle />
        </div>

        <AgentPrizeStats />
      </div>
    </div>
  );
};

export default PrizeStats;
