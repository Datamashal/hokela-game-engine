
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface Agent {
  id: number;
  agent_id: string;
  name: string;
  email: string;
  location: string;
  created_at: string;
  updated_at: string;
}

interface AgentFormData {
  agent_id: string;
  name: string;
  email: string;
  location: string;
}

const fetchAgents = async (): Promise<Agent[]> => {
  const response = await axios.get(`${API_URL}/agents`);
  return response.data;
};

const createAgent = async (agentData: AgentFormData): Promise<Agent> => {
  const response = await axios.post(`${API_URL}/agents`, agentData);
  return response.data;
};

const updateAgent = async ({ id, ...agentData }: { id: number } & AgentFormData): Promise<Agent> => {
  const response = await axios.put(`${API_URL}/agents/${id}`, agentData);
  return response.data;
};

const deleteAgent = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/agents/${id}`);
};

export function AgentManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState<AgentFormData>({
    agent_id: '',
    name: '',
    email: '',
    location: ''
  });
  const [deleteAgentId, setDeleteAgentId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: agents = [], isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents,
  });

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      toast.success('Agent created successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create agent');
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateAgent,
    onSuccess: () => {
      toast.success('Agent updated successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setIsDialogOpen(false);
      setEditingAgent(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update agent');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAgent,
    onSuccess: () => {
      toast.success('Agent deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      setDeleteAgentId(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete agent');
    }
  });

  const resetForm = () => {
    setFormData({
      agent_id: '',
      name: '',
      email: '',
      location: ''
    });
  };

  const handleCreate = () => {
    setEditingAgent(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_id: agent.agent_id,
      name: agent.name,
      email: agent.email,
      location: agent.location
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agent_id.trim() || !formData.name.trim() || !formData.email.trim() || !formData.location.trim()) {
      toast.error('All fields are required');
      return;
    }

    if (editingAgent) {
      updateMutation.mutate({ id: editingAgent.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    setDeleteAgentId(id);
  };

  const confirmDelete = () => {
    if (deleteAgentId) {
      deleteMutation.mutate(deleteAgentId);
    }
  };

  const handleInputChange = (field: keyof AgentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
        <p className="text-gray-600">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 bg-red-50 rounded-md">
        <p className="text-red-600 mb-3">Failed to load agents</p>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          className="border-red-300 text-red-600 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex justify-between items-center text-gray-900">
            <div className="flex items-center gap-2">
              <span>Business Agent Management</span>
              <span className="text-sm font-normal text-gray-600">({agents.length} agents)</span>
            </div>
            <Button 
              onClick={handleCreate}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Agent
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage business agents with unique agent IDs and their information
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="text-gray-900 font-semibold">Agent ID</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Name</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Email</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Location</TableHead>
                  <TableHead className="text-gray-900 font-semibold">Created</TableHead>
                  <TableHead className="text-gray-900 font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No agents found. Click "Add Agent" to create your first agent.
                    </TableCell>
                  </TableRow>
                ) : (
                  agents.map((agent) => (
                    <TableRow key={agent.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-900 font-medium">{agent.agent_id}</TableCell>
                      <TableCell className="text-gray-900">{agent.name}</TableCell>
                      <TableCell className="text-gray-900">{agent.email}</TableCell>
                      <TableCell className="text-gray-900">{agent.location}</TableCell>
                      <TableCell className="text-gray-900 text-sm">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(agent)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(agent.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingAgent ? 'Edit Agent' : 'Create New Agent'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingAgent ? 'Update agent information below.' : 'Enter agent information to create a new agent.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agent_id" className="text-gray-700">Agent ID *</Label>
                <Input
                  id="agent_id"
                  value={formData.agent_id}
                  onChange={(e) => handleInputChange('agent_id', e.target.value)}
                  placeholder="Enter unique agent ID"
                  className="bg-white border-gray-200 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agent name"
                  className="bg-white border-gray-200 focus:border-blue-500"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter agent email"
                className="bg-white border-gray-200 focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-gray-700">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="Enter agent location"
                className="bg-white border-gray-200 focus:border-blue-500"
                required
              />
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? (editingAgent ? 'Updating...' : 'Creating...') 
                  : (editingAgent ? 'Update Agent' : 'Create Agent')
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAgentId !== null} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Agent
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-gray-900 border-gray-200 hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
