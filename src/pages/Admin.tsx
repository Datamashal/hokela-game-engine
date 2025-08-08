import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, LogOut, Trash2, RefreshCw, Filter, Calendar, AlertTriangle, PieChart, BarChart3, ChevronRight, Package, Home, Award } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { StatsDisplay } from "@/components/admin/StatsDisplay";
import { AgentManagement } from "@/components/admin/AgentManagement";
import { ProductPrizeManagement } from "@/components/admin/ProductPrizeManagement";
import { ThemeToggle } from "@/components/ThemeToggle";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// API base URL - use environment variable or fallback to the API path
const API_URL = import.meta.env.VITE_API_URL || "/api";

// Function to fetch spin results
const fetchSpinResults = async () => {
  try {
    const response = await axios.get(`${API_URL}/spin-results`);
    console.log("Spin results response:", response);
    console.log("Spin results data:", response.data);
    
    // Ensure we always return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("API returned non-array data:", response.data);
      throw new Error("Invalid data format received from server");
    }
  } catch (error) {
    console.error("Error fetching spin results:", error);
    throw error;
  }
};

// Function to fetch spin stats
const fetchSpinStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/spin-results/stats`);
    console.log("Spin stats fetched:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching spin stats:", error);
    throw error;
  }
};

// Function to delete a spin result
const deleteSpinResult = async (id: number) => {
  try {
    const response = await axios.delete(`${API_URL}/spin-results/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting spin result:", error);
    throw error;
  }
};

// Function to delete all spin results
const deleteAllSpinResults = async (ids: number[]) => {
  try {
    const deletePromises = ids.map(id => axios.delete(`${API_URL}/spin-results/${id}`));
    await Promise.all(deletePromises);
    return { success: true };
  } catch (error) {
    console.error("Error deleting all spin results:", error);
    throw error;
  }
};

// Function to download data
const downloadData = (format: string) => {
  // Generate the download URL
  const url = `${API_URL}/admin/results/export?format=${format}`;
  
  // Create a temporary link element
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.download = `results.${format}`;
  
  // Trigger the download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success(`Downloading spin results in ${format} format`);
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [resultsPage, setResultsPage] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showStats, setShowStats] = useState(false);
  const itemsPerPage = 50;
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
    toast.success("Successfully logged out");
  };

  // Fetch spin results data with proper error handling
  const { 
    data: spinResultsData, 
    isLoading: resultsLoading, 
    error: resultsError,
    refetch: refetchResults
  } = useQuery({
    queryKey: ['spinResults'],
    queryFn: fetchSpinResults,
    retry: 1
  });

  // Ensure spinResults is always an array
  const spinResults = Array.isArray(spinResultsData) ? spinResultsData : [];

  // Handle error display for results
  useEffect(() => {
    if (resultsError) {
      console.error("Query error:", resultsError);
      toast.error("Failed to fetch spin results");
    }
  }, [resultsError]);

  // Fetch spin stats data
  const {
    data: spinStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['spinStats'],
    queryFn: fetchSpinStats,
    enabled: showStats, // Only fetch when stats are being shown
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSpinResult,
    onSuccess: () => {
      toast.success("Spin result deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['spinResults'] });
      queryClient.invalidateQueries({ queryKey: ['spinStats'] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to delete spin result");
    }
  });

  // Delete all mutation
  const deleteAllMutation = useMutation({
    mutationFn: deleteAllSpinResults,
    onSuccess: () => {
      toast.success("All spin results deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['spinResults'] });
      queryClient.invalidateQueries({ queryKey: ['spinStats'] });
    },
    onError: () => {
      toast.error("Failed to delete all spin results");
    }
  });

  // Toggle stats view
  const toggleStats = () => {
    setShowStats(!showStats);
  };

  // Filter logic with date filtering
  const filteredResults = spinResults.filter((result: any) => {
    const resultDate = new Date(result.date);
    
    // Date filtering
    let matchesDateRange = true;
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      matchesDateRange = matchesDateRange && resultDate >= fromDate;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      matchesDateRange = matchesDateRange && resultDate <= toDate;
    }
    
    return matchesDateRange;
  });

  // Pagination logic for filtered results
  const paginatedResults = filteredResults.slice(
    (resultsPage - 1) * itemsPerPage,
    resultsPage * itemsPerPage
  );
  const totalResultsPages = Math.ceil(filteredResults.length / itemsPerPage);

  // Handle page changes
  const handleResultsPageChange = (page: number) => {
    setResultsPage(page);
  };

  // Handle retry loading results
  const handleRetryResultsLoad = () => {
    refetchResults();
    toast.info("Retrying to fetch spin results...");
  };

  // Handle retry loading stats
  const handleRetryStatsLoad = () => {
    refetchStats();
    toast.info("Retrying to fetch statistics...");
  };

  // Handle delete confirmation
  const handleDeleteConfirm = (id: number) => {
    setSelectedResult(id);
    setDeleteDialogOpen(true);
  };

  // Handle delete action
  const handleDelete = () => {
    if (selectedResult) {
      deleteMutation.mutate(selectedResult);
    }
  };

  // Handle delete all
  const handleDeleteAll = () => {
    const allIds = spinResults.map((result: any) => result.id);
    deleteAllMutation.mutate(allIds);
  };

  // Reset filters
  const handleResetFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setResultsPage(1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "agents":
        return <AgentManagement />;
      case "products":
        return <ProductPrizeManagement />;
      default:
        return (
          <div className="space-y-4 md:space-y-6 bg-admin-bg min-h-screen p-4 rounded-lg">
            {/* Stats Toggle Button */}
            <div className="mb-4 md:mb-6">
              <Button 
                onClick={toggleStats}
                variant={showStats ? "secondary" : "default"}
                className="flex items-center gap-2 text-sm md:text-base bg-admin-primary hover:bg-admin-primary/90 text-white"
                size="sm"
              >
                {showStats ? <BarChart3 className="h-4 w-4" /> : <PieChart className="h-4 w-4" />}
                <span className="hidden sm:inline">
                  {showStats ? "Hide Statistics" : "Show Statistics Summary"}
                </span>
                <span className="sm:hidden">
                  {showStats ? "Hide Stats" : "Show Stats"}
                </span>
              </Button>
            </div>

            {/* Statistics Display */}
            {showStats && (
              <Card className="mb-4 md:mb-6 shadow-lg border-t-4 border-t-admin-primary bg-admin-card">
                <CardHeader className="bg-admin-secondary/20 p-4 md:p-6">
                  <CardTitle className="flex items-center justify-between text-admin-text text-lg md:text-xl">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4 md:h-5 md:w-5 text-admin-primary" />
                      <span className="hidden sm:inline">Spin Wheel Statistics</span>
                      <span className="sm:hidden">Statistics</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRetryStatsLoad}
                      className="text-admin-text/60 hover:text-admin-text"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-admin-text/60 text-sm">
                    <span className="hidden sm:inline">Overview of spin wheel results and prize distribution</span>
                    <span className="sm:hidden">Results overview</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                  <StatsDisplay 
                    stats={spinStats} 
                    isLoading={statsLoading} 
                    error={statsError} 
                    onRetry={handleRetryStatsLoad} 
                  />
                </CardContent>
              </Card>
            )}

            {/* Date Filter Section */}
            <Card className="mb-4 md:mb-6 shadow-lg border-l-4 border-l-admin-primary bg-admin-card">
              <CardHeader className="bg-admin-secondary/20 border-b border-admin-border p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-admin-text text-lg md:text-xl">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-admin-primary" />
                  Date Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {/* Date From */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-admin-text">From Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-admin-border text-admin-text",
                            !dateFrom && "text-admin-text/60"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-admin-card border-admin-border" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateFrom}
                          onSelect={setDateFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-admin-text">To Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-admin-border text-admin-text",
                            !dateTo && "text-admin-text/60"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-admin-card border-admin-border" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dateTo}
                          onSelect={setDateTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Reset Button */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-admin-text invisible">Reset</label>
                    <Button 
                      variant="outline" 
                      onClick={handleResetFilters}
                      size="default"
                      className="w-full border-admin-border text-admin-text hover:bg-admin-secondary/20"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Results Table */}
            <Card className="mb-4 md:mb-6 shadow-lg border-l-4 border-l-green-500 bg-admin-card">
              <CardHeader className="bg-admin-secondary/20 border-b border-admin-border p-4 md:p-6">
                <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-admin-text">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                    <span className="text-sm md:text-base">
                      Results ({filteredResults.length} of {spinResults.length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRetryResultsLoad}
                      className="text-admin-primary border-admin-border hover:bg-admin-secondary/20 text-xs"
                    >
                      <RefreshCw className="mr-1 h-3 w-3 md:h-4 md:w-4" /> 
                      <span className="hidden sm:inline">Refresh</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadData('csv')}
                      className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950 text-xs"
                    >
                      <FileText className="mr-1 h-3 w-3 md:h-4 md:w-4" /> 
                      <span className="hidden sm:inline">Export CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950 text-xs"
                          disabled={spinResults.length === 0}
                        >
                          <Trash2 className="mr-1 h-3 w-3 md:h-4 md:w-4" /> 
                          <span className="hidden sm:inline">Delete All</span>
                          <span className="sm:hidden">Del All</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-admin-card border-admin-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-admin-text">Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription className="text-admin-text/80">
                            This action cannot be undone. This will permanently delete all spin results from the database.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-admin-border text-admin-text">Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAll}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            Delete All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-admin-secondary/10">
                        <TableHead className="text-admin-text font-semibold">Name</TableHead>
                        <TableHead className="text-admin-text font-semibold">Email</TableHead>
                        <TableHead className="text-admin-text font-semibold">Location</TableHead>
                        <TableHead className="text-admin-text font-semibold">Agent</TableHead>
                        <TableHead className="text-admin-text font-semibold">Prize</TableHead>
                        <TableHead className="text-admin-text font-semibold">Result</TableHead>
                        <TableHead className="text-admin-text font-semibold">Date</TableHead>
                        <TableHead className="text-right text-admin-text font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-admin-text">
                            Loading results...
                          </TableCell>
                        </TableRow>
                      ) : resultsError ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <AlertTriangle className="h-8 w-8 text-red-500" />
                              <p className="text-red-500">Error loading results</p>
                              <Button 
                                onClick={handleRetryResultsLoad} 
                                size="sm"
                                className="bg-admin-primary hover:bg-admin-primary/90 text-white"
                              >
                                Retry
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : paginatedResults.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-admin-text">
                            No results found
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedResults.map((result: any) => (
                          <TableRow key={result.id} className="border-admin-border">
                            <TableCell className="font-medium text-admin-text">{result.name}</TableCell>
                            <TableCell className="text-admin-text">{result.email}</TableCell>
                            <TableCell className="text-admin-text">{result.location}</TableCell>
                            <TableCell className="text-admin-text">{result.agent_name || 'N/A'}</TableCell>
                            <TableCell className="text-admin-text">{result.prize}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                result.is_win 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }`}>
                                {result.is_win ? 'WIN' : 'TRY AGAIN'}
                              </span>
                            </TableCell>
                            <TableCell className="text-admin-text">
                              {new Date(result.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteConfirm(result.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalResultsPages > 1 && (
                  <div className="p-4 border-t border-admin-border">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => handleResultsPageChange(Math.max(1, resultsPage - 1))}
                            className={cn(
                              resultsPage === 1 && "opacity-50 cursor-not-allowed pointer-events-none",
                              "text-admin-text hover:bg-admin-secondary/20"
                            )}
                          />
                        </PaginationItem>
                        {Array.from({ length: Math.min(5, totalResultsPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => handleResultsPageChange(pageNum)}
                                isActive={pageNum === resultsPage}
                                className={cn(
                                  pageNum === resultsPage 
                                    ? "bg-admin-primary text-white" 
                                    : "text-admin-text hover:bg-admin-secondary/20"
                                )}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => handleResultsPageChange(Math.min(totalResultsPages, resultsPage + 1))}
                            className={cn(
                              resultsPage === totalResultsPages && "opacity-50 cursor-not-allowed pointer-events-none",
                              "text-admin-text hover:bg-admin-secondary/20"
                            )}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-admin-bg">
      {/* Header */}
      <header className="bg-admin-card shadow-sm border-b border-admin-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-admin-text">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-admin-card shadow-sm border-b border-admin-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: "dashboard", label: "Dashboard", icon: Home },
              { key: "products", label: "Prize Management", icon: Package },
              { key: "agents", label: "Agents", icon: Award },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === key
                    ? "border-admin-primary text-admin-primary"
                    : "border-transparent text-admin-text/60 hover:text-admin-text hover:border-admin-border"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 bg-admin-bg min-h-screen">
          {renderTabContent()}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-admin-card border-admin-border">
          <DialogHeader>
            <DialogTitle className="text-admin-text">Delete Spin Result</DialogTitle>
            <DialogDescription className="text-admin-text/80">
              Are you sure you want to delete this spin result? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteDialogOpen(false)}
              className="border-admin-border text-admin-text"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;