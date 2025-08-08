import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface ProductPrize {
  id: number;
  name: string;
  description: string;
  total_quantity: number;
  available_quantity: number;
  distributed_quantity: number;
  created_at: string;
}

const fetchProductPrizes = async (): Promise<ProductPrize[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

export function ProductPrizeManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<ProductPrize | null>(null);
  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    quantity_given: '', 
    quantity_remaining: '' 
  });

  const queryClient = useQueryClient();

  const { data: prizes = [], isLoading, error } = useQuery({
    queryKey: ['productPrizes'],
    queryFn: fetchProductPrizes
  });

  const createPrizeMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; quantity: number }) => {
      const response = await axios.post(`${API_URL}/products`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product prize created successfully");
      queryClient.invalidateQueries({ queryKey: ['productPrizes'] });
      setDialogOpen(false);
      setForm({ name: '', description: '', quantity_given: '', quantity_remaining: '' });
    },
    onError: (error: any) => {
      console.error('Create prize error:', error);
      toast.error(error.response?.data?.message || "Failed to create product prize");
    }
  });

  const updatePrizeMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name: string; description: string }) => {
      const response = await axios.put(`${API_URL}/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Product prize updated successfully");
      queryClient.invalidateQueries({ queryKey: ['productPrizes'] });
      setDialogOpen(false);
      setEditingPrize(null);
      setForm({ name: '', description: '', quantity_given: '', quantity_remaining: '' });
    },
    onError: (error: any) => {
      console.error('Update prize error:', error);
      toast.error(error.response?.data?.message || "Failed to update product prize");
    }
  });

  const deletePrizeMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_URL}/products/${id}`),
    onSuccess: () => {
      toast.success("Product prize deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['productPrizes'] });
    },
    onError: (error: any) => {
      console.error('Delete prize error:', error);
      toast.error(error.response?.data?.message || "Failed to delete product prize");
    }
  });

  const handleSubmit = () => {
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (editingPrize) {
      updatePrizeMutation.mutate({
        id: editingPrize.id,
        name: form.name,
        description: form.description
      });
    } else {
      if (!form.quantity_given || isNaN(parseInt(form.quantity_given)) || parseInt(form.quantity_given) <= 0) {
        toast.error("Please enter a valid quantity given");
        return;
      }

      const quantityGiven = parseInt(form.quantity_given);
      createPrizeMutation.mutate({
        name: form.name,
        description: form.description,
        quantity: quantityGiven
      });
    }
  };

  const openDialog = (prize?: ProductPrize) => {
    if (prize) {
      setEditingPrize(prize);
      setForm({
        name: prize.name,
        description: prize.description,
        quantity_given: prize.total_quantity.toString(),
        quantity_remaining: prize.available_quantity.toString()
      });
    } else {
      setEditingPrize(null);
      setForm({ name: '', description: '', quantity_given: '', quantity_remaining: '' });
    }
    setDialogOpen(true);
  };

  if (error) {
    return (
      <Card className="bg-admin-card border-admin-border">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading product prizes: {error.message}</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['productPrizes'] })} 
            className="mt-4 bg-admin-primary hover:bg-admin-primary/90 text-white"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-admin-bg p-6 rounded-lg">
      <Card className="bg-admin-card border-admin-border">
        <CardHeader className="bg-admin-secondary/20">
          <CardTitle className="flex justify-between items-center text-admin-text">
            <span>Product Prize Management</span>
            <Button 
              onClick={() => openDialog()} 
              className="flex items-center gap-2 bg-admin-primary hover:bg-admin-primary/90 text-white"
            >
              <Plus className="h-4 w-4" />
              Add Product Prize
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-admin-secondary/10">
                <TableHead className="text-admin-text font-semibold">Name</TableHead>
                <TableHead className="text-admin-text font-semibold">Description</TableHead>
                <TableHead className="text-admin-text font-semibold">Quantity Given</TableHead>
                <TableHead className="text-admin-text font-semibold">Quantity Remaining</TableHead>
                <TableHead className="text-admin-text font-semibold">Created At</TableHead>
                <TableHead className="text-right text-admin-text font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-admin-text">
                    Loading product prizes...
                  </TableCell>
                </TableRow>
              ) : prizes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-admin-text">
                    No product prizes found. Create your first prize!
                  </TableCell>
                </TableRow>
              ) : (
                prizes.map((prize) => (
                  <TableRow key={prize.id} className="border-admin-border">
                    <TableCell className="font-medium text-admin-text">{prize.name}</TableCell>
                    <TableCell className="text-admin-text">{prize.description}</TableCell>
                    <TableCell className="text-admin-text">{prize.total_quantity || 0}</TableCell>
                    <TableCell className="text-admin-text">
                      <span className={`font-medium ${
                        (prize.available_quantity || 0) === 0 
                          ? 'text-red-600' 
                          : (prize.available_quantity || 0) < 5 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                      }`}>
                        {prize.available_quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-admin-text">
                      {new Date(prize.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDialog(prize)}
                        className="text-admin-primary hover:text-admin-primary hover:bg-admin-secondary/20"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-admin-card border-admin-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-admin-text">Delete Product Prize</AlertDialogTitle>
                            <AlertDialogDescription className="text-admin-text/80">
                              Are you sure you want to delete "{prize.name}"? This action cannot be undone and will affect all related game data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-admin-text bg-admin-secondary hover:bg-admin-secondary/80">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deletePrizeMutation.mutate(prize.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-admin-card border-admin-border">
          <DialogHeader>
            <DialogTitle className="text-admin-text">
              {editingPrize ? 'Edit Product Prize' : 'Add Product Prize'}
            </DialogTitle>
            <DialogDescription className="text-admin-text/80">
              {editingPrize 
                ? 'Update product prize details' 
                : 'Create a new product prize for the game'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-admin-text font-medium">Prize Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter prize name (e.g., 'KEY HOLDERS')"
                className="text-admin-text bg-admin-bg border-admin-border placeholder:text-admin-text/50"
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-admin-text font-medium">Description *</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Enter prize description"
                className="text-admin-text bg-admin-bg border-admin-border placeholder:text-admin-text/50"
                required
              />
            </div>
            {!editingPrize && (
              <div>
                <Label htmlFor="quantity_given" className="text-admin-text font-medium">Quantity Given *</Label>
                <Input
                  id="quantity_given"
                  type="number"
                  min="1"
                  value={form.quantity_given}
                  onChange={(e) => setForm({ ...form, quantity_given: e.target.value })}
                  placeholder="Enter total quantity to give out"
                  className="text-admin-text bg-admin-bg border-admin-border placeholder:text-admin-text/50"
                  required
                />
              </div>
            )}
            {editingPrize && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity_given_display" className="text-admin-text font-medium">Quantity Given</Label>
                  <Input
                    id="quantity_given_display"
                    value={form.quantity_given}
                    readOnly
                    className="text-admin-text/60 bg-admin-secondary/20 border-admin-border"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity_remaining_display" className="text-admin-text font-medium">Quantity Remaining</Label>
                  <Input
                    id="quantity_remaining_display"
                    value={form.quantity_remaining}
                    readOnly
                    className="text-admin-text/60 bg-admin-secondary/20 border-admin-border"
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="text-admin-text bg-admin-secondary hover:bg-admin-secondary/80 border-admin-border"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPrizeMutation.isPending || updatePrizeMutation.isPending}
              className="bg-admin-primary hover:bg-admin-primary/90 text-white"
            >
              {(createPrizeMutation.isPending || updatePrizeMutation.isPending) 
                ? "Saving..." 
                : editingPrize 
                  ? "Update Prize" 
                  : "Create Prize"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}