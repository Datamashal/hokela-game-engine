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
import { ProductManagement } from "@/components/admin/ProductManagement";
import { AgentPrizeStats } from "@/components/admin/AgentPrizeStats";
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
        return <ProductManagement />;
      default:
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Prize Distribution Summary */}
            <AgentPrizeStats />

            {/* Stats Toggle Button */}
            <div className="mb-4 md:mb-6">
              <Button 
                onClick={toggleStats}
                variant={showStats ? "secondary" : "default"}
                className="flex items-center gap-2 text-sm md:text-base"
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
              <Card className="mb-4 md:mb-6 shadow-lg border-t-4 border-t-primary">
                <CardHeader className="bg-muted/50 p-4 md:p-6">
                  <CardTitle className="flex items-center justify-between text-gray-900 dark:text-white text-lg md:text-xl">
                    <div className="flex items-center gap-2">
                      <PieChart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      <span className="hidden sm:inline">Spin Wheel Statistics</span>
                      <span className="sm:hidden">Statistics</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRetryStatsLoad}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
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
            <Card className="mb-4 md:mb-6 shadow-lg border-l-4 border-l-blue-500">
              <CardHeader className="bg-muted/50 border-b p-4 md:p-6">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg md:text-xl">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                  Date Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {/* Date From */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-900 dark:text-white">From Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateFrom && "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateFrom ? format(dateFrom, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <label className="text-sm font-medium text-gray-900 dark:text-white">To Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateTo && "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dateTo ? format(dateTo, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
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
                    <label className="text-sm font-medium text-gray-900 dark:text-white invisible">Reset</label>
                    <Button 
                      variant="outline" 
                      onClick={handleResetFilters}
                      size="default"
                      className="w-full"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Results Table */}
            <Card className="mb-4 md:mb-6 shadow-lg border-l-4 border-l-green-500">
              <CardHeader className="bg-muted/50 border-b p-4 md:p-6">
                <CardTitle className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-gray-900 dark:text-white">
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
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950 text-xs"
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
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            Delete All Results
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action will permanently delete all {spinResults.length} spin results. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAll}
                            disabled={deleteAllMutation.isPending}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                  <span className="hidden sm:inline">List of all spin wheel results with management options</span>
                  <span className="sm:hidden">All spin results</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {resultsLoading ? (
                  <div className="text-center py-8 md:py-12 text-gray-600 dark:text-gray-400">
                    <div className="animate-spin w-8 h-8 md:w-10 md:h-10 border-3 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-base md:text-lg">Loading results...</p>
                  </div>
                ) : resultsError ? (
                  <div className="text-center py-8 md:py-12 bg-destructive/10">
                    <div className="text-destructive mb-4 font-medium text-base md:text-lg">
                      Error loading results. Please try again later.
                    </div>
                    <Button onClick={handleRetryResultsLoad} variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10">
                      <RefreshCw className="mr-2 h-4 w-4" /> Retry Loading
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm whitespace-nowrap">ID</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm">Name</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm hidden sm:table-cell">Email</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm">Location</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm hidden md:table-cell">Agent</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm">Prize</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm">Result</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm hidden lg:table-cell">Date</TableHead>
                            <TableHead className="text-gray-900 dark:text-white font-semibold text-xs md:text-sm text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedResults.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center text-gray-600 dark:text-gray-400 py-6 md:py-8 text-sm">
                                {filteredResults.length === 0 && spinResults.length > 0 
                                  ? "No results match your date filter" 
                                  : "No spin results found"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            paginatedResults.map((result: any) => (
                              <TableRow key={result.id} className="hover:bg-muted/50">
                                <TableCell className="text-gray-900 dark:text-gray-200 font-medium text-xs md:text-sm">{result.id}</TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs md:text-sm">{result.name}</TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs md:text-sm hidden sm:table-cell">{result.email}</TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs md:text-sm">{result.location}</TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs md:text-sm hidden md:table-cell">{result.agent_name || 'N/A'}</TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs md:text-sm">{result.prize}</TableCell>
                                <TableCell>
                                  <span 
                                    className={`px-2 py-1 rounded text-white text-xs font-medium ${
                                      result.is_win ? "bg-green-500" : "bg-red-500"
                                    }`}
                                  >
                                    {result.is_win ? "Win" : "Loss"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-gray-200 text-xs hidden lg:table-cell">
                                  {new Date(result.date).toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteConfirm(result.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                  >
                                    <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                                    <span className="sr-only">Delete</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalResultsPages > 1 && (
                      <div className="flex justify-center p-4 md:p-6 border-t">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => handleResultsPageChange(Math.max(1, resultsPage - 1))}
                                className={`${resultsPage === 1 ? "pointer-events-none opacity-50" : ""} text-gray-700 hover:bg-gray-100 text-xs md:text-sm`}
                              />
                            </PaginationItem>
                            
                            {Array.from({ length: Math.min(totalResultsPages, 5) }, (_, i) => {
                              let page;
                              if (totalResultsPages <= 5) {
                                page = i + 1;
                              } else if (resultsPage <= 3) {
                                page = i + 1;
                              } else if (resultsPage >= totalResultsPages - 2) {
                                page = totalResultsPages - 4 + i;
                              } else {
                                page = resultsPage - 2 + i;
                              }
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink 
                                    isActive={page === resultsPage}
                                    onClick={() => handleResultsPageChange(page)}
                                    className={`text-gray-900 text-xs md:text-sm ${page === resultsPage ? "bg-primary text-white" : "hover:bg-gray-100"}`}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            })}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => handleResultsPageChange(Math.min(totalResultsPages, resultsPage + 1))}
                                className={`${resultsPage === totalResultsPages ? "pointer-events-none opacity-50" : ""} text-gray-700 hover:bg-gray-100 text-xs md:text-sm`}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-foreground">Confirm Deletion</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Are you sure you want to delete this spin result? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 text-foreground py-4 md:py-8 px-2 sm:px-4 lg:px-6">
      <div className="w-full max-w-none mx-auto" style={{ width: '99%' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 dark:text-white">Admin Dashboard</h1>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle />
            <Button 
              onClick={() => navigate('/prize-stats')}
              variant="outline"
              className="flex items-center gap-2 text-xs md:text-sm"
              size="sm"
            >
              <Award className="h-4 w-4" />
              <span className="hidden sm:inline">Prize Stats</span>
              <span className="sm:inline md:hidden">Prizes</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => navigate('/stats')}
              variant="outline"
              className="flex items-center gap-2 text-xs md:text-sm"
              size="sm"
            >
              <PieChart className="h-4 w-4" />
              <span className="hidden sm:inline">Statistics</span>
              <span className="sm:inline md:hidden">Stats</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-950 text-xs md:text-sm"
              size="sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-4 md:mb-6 border-b border-border overflow-x-auto">
          <nav className="flex space-x-4 md:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === "dashboard"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab("agents")}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === "agents"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">BA Management</span>
                <span className="sm:hidden">BA</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-900 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Product Management</span>
                <span className="sm:hidden">Products</span>
              </div>
            </button>
          </nav>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
};

export default Admin;
