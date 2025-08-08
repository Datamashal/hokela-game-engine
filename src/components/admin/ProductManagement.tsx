import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
const API_URL = import.meta.env.VITE_API_URL || "/api";


interface Product {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  total_quantity?: number;
  available_quantity?: number;
  distributed_quantity?: number;
}

interface ProductAssignment {
  id: number;
  agent_id: string;
  agent_name: string;
  product_id: number;
  product_name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

const fetchProducts = async (): Promise<Product[]> => {
  const response = await axios.get(`${API_URL}/products`);
  return response.data;
};

const fetchProductAssignments = async (): Promise<ProductAssignment[]> => {
  const response = await axios.get(`${API_URL}/product-assignments`);
  return response.data;
};

const fetchAgents = async () => {
  const response = await axios.get(`${API_URL}/agents`);
  return response.data;
};

export function ProductManagement() {
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ProductAssignment | null>(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', quantity: '' });
  const [assignmentForm, setAssignmentForm] = useState({ agent_id: '', product_id: '', quantity: '' });

  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery({
    queryKey: ['productAssignments'],
    queryFn: fetchProductAssignments
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgents
  });

  const createProductMutation = useMutation({
    mutationFn: (data: { name: string; description: string; quantity?: number }) =>
      axios.post(`${API_URL}/products`, data),
    onSuccess: () => {
      toast.success("Product created successfully");
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductDialogOpen(false);
      setProductForm({ name: '', description: '', quantity: '' });
    },
    onError: () => toast.error("Failed to create product")
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; name: string; description: string }) =>
      axios.put(`${API_URL}/products/${id}`, data),
    onSuccess: () => {
      toast.success("Product updated successfully");
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductDialogOpen(false);
      setEditingProduct(null);
    },
    onError: () => toast.error("Failed to update product")
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_URL}/products/${id}`),
    onSuccess: () => {
      toast.success("Product deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => toast.error("Failed to delete product")
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data: { agent_id: string; product_id: number; quantity: number }) =>
      axios.post(`${API_URL}/product-assignments`, data),
    onSuccess: () => {
      toast.success("Product assigned successfully");
      queryClient.invalidateQueries({ queryKey: ['productAssignments'] });
      setAssignmentDialogOpen(false);
      setAssignmentForm({ agent_id: '', product_id: '', quantity: '' });
    },
    onError: () => toast.error("Failed to assign product")
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: number; agent_id: string; product_id: number; quantity: number }) =>
      axios.put(`${API_URL}/product-assignments/${id}`, data),
    onSuccess: () => {
      toast.success("Assignment updated successfully");
      queryClient.invalidateQueries({ queryKey: ['productAssignments'] });
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
    },
    onError: () => toast.error("Failed to update assignment")
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`${API_URL}/product-assignments/${id}`),
    onSuccess: () => {
      toast.success("Assignment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['productAssignments'] });
    },
    onError: () => toast.error("Failed to delete assignment")
  });

  const handleProductSubmit = () => {
    if (!productForm.name.trim() || !productForm.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, name: productForm.name, description: productForm.description });
    } else {
      const payload: { name: string; description: string; quantity?: number } = {
        name: productForm.name,
        description: productForm.description,
      };
      if (productForm.quantity && !isNaN(parseInt(productForm.quantity))) {
        payload.quantity = Math.max(0, parseInt(productForm.quantity));
      }
      createProductMutation.mutate(payload);
    }
  };

  const handleAssignmentSubmit = () => {
    if (!assignmentForm.agent_id || !assignmentForm.product_id || !assignmentForm.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const quantity = parseInt(assignmentForm.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const data = {
      agent_id: assignmentForm.agent_id,
      product_id: parseInt(assignmentForm.product_id),
      quantity: quantity
    };

    if (editingAssignment) {
      updateAssignmentMutation.mutate({ id: editingAssignment.id, ...data });
    } else {
      createAssignmentMutation.mutate(data);
    }
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({ name: product.name, description: product.description, quantity: '' });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', description: '', quantity: '' });
    }
    setProductDialogOpen(true);
  };

  const openAssignmentDialog = (assignment?: ProductAssignment) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setAssignmentForm({
        agent_id: assignment.agent_id,
        product_id: assignment.product_id.toString(),
        quantity: assignment.quantity.toString()
      });
    } else {
      setEditingAssignment(null);
      setAssignmentForm({ agent_id: '', product_id: '', quantity: '' });
    }
    setAssignmentDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-blue-500 p-6">
      <div className="space-y-6 text-black">
        {/* Products Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-black">
              <span className="text-black">Products</span>
              <Button onClick={() => openProductDialog()} className="flex items-center gap-2 text-white">
                <Plus className="h-4 w-4" />
                Add Product
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-semibold">Name</TableHead>
                  <TableHead className="text-black font-semibold">Description</TableHead>
                  <TableHead className="text-black font-semibold">Total Won / Initial Quantity</TableHead>
                  <TableHead className="text-black font-semibold">Created At</TableHead>
                  <TableHead className="text-right text-black font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium text-black">{product.name}</TableCell>
                    <TableCell className="text-black">{product.description}</TableCell>
                    <TableCell className="text-black">{`${(product.total_quantity ?? 0) - (product.available_quantity ?? 0)} / ${product.total_quantity ?? 0}`}</TableCell>
                    <TableCell className="text-black">{new Date(product.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openProductDialog(product)}
                        className="text-black hover:text-black hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-black hover:text-black hover:bg-gray-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-black">Delete Product</AlertDialogTitle>
                            <AlertDialogDescription className="text-black">
                              Are you sure you want to delete this product? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-black bg-white border-gray-300 hover:bg-gray-50 hover:text-black">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteProductMutation.mutate(product.id)} className="text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Assignments Section */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="flex justify-between items-center text-black">
              <span className="text-black">Product Assignments</span>
              <Button onClick={() => openAssignmentDialog()} className="flex items-center gap-2 text-white">
                <Plus className="h-4 w-4" />
                Assign Product
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black font-semibold">Agent ID</TableHead>
                  <TableHead className="text-black font-semibold">Agent Name</TableHead>
                  <TableHead className="text-black font-semibold">Product</TableHead>
                  <TableHead className="text-black font-semibold">Quantity</TableHead>
                  <TableHead className="text-black font-semibold">Assigned At</TableHead>
                  <TableHead className="text-right text-black font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="text-black">{assignment.agent_id}</TableCell>
                    <TableCell className="text-black">{assignment.agent_name}</TableCell>
                    <TableCell className="text-black">{assignment.product_name}</TableCell>
                    <TableCell className="text-black">{assignment.quantity}</TableCell>
                    <TableCell className="text-black">{new Date(assignment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openAssignmentDialog(assignment)}
                        className="text-black hover:text-black hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-black hover:text-black hover:bg-gray-100">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-black">Delete Assignment</AlertDialogTitle>
                            <AlertDialogDescription className="text-black">
                              Are you sure you want to delete this product assignment?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-black bg-white border-gray-300 hover:bg-gray-50 hover:text-black">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteAssignmentMutation.mutate(assignment.id)} className="text-white">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Product Dialog */}
        <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-black">{editingProduct ? 'Edit Product' : 'Add Product'}</DialogTitle>
              <DialogDescription className="text-black">
                {editingProduct ? 'Update product details' : 'Create a new product'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-black font-medium">Product Name *</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Enter product name"
                  className="text-black bg-white border-gray-300 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-black font-medium">Description *</Label>
                <Input
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Enter product description"
                  className="text-black bg-white border-gray-300 placeholder:text-gray-500"
                  required
                />
              </div>
              {!editingProduct && (
                <div>
                  <Label htmlFor="quantity" className="text-black font-medium">Number of prizes to be won (optional)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={0}
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({ ...productForm, quantity: e.target.value })}
                    placeholder="Enter initial stock without assigning an agent"
                    className="text-black bg-white border-gray-300 placeholder:text-gray-500"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProductDialogOpen(false)} className="text-black bg-white border-gray-300 hover:bg-gray-50 hover:text-black">
                Cancel
              </Button>
              <Button 
                onClick={handleProductSubmit}
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="text-white"
              >
                {createProductMutation.isPending || updateProductMutation.isPending 
                  ? "Saving..." 
                  : (editingProduct ? 'Update' : 'Create')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-black">{editingAssignment ? 'Edit Assignment' : 'Assign Product'}</DialogTitle>
              <DialogDescription className="text-black">
                {editingAssignment ? 'Update product assignment' : 'Assign a product to an agent'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-black font-medium">Agent *</Label>
                <Select
                  value={assignmentForm.agent_id}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, agent_id: value })}
                >
                  <SelectTrigger className="text-black bg-white border-gray-300">
                    <SelectValue placeholder="Select an agent" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {agents.map((agent: any) => (
                      <SelectItem key={agent.agent_id} value={agent.agent_id} className="text-black hover:bg-gray-50 focus:bg-gray-50">
                        {agent.name} ({agent.agent_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-black font-medium">Product *</Label>
                <Select
                  value={assignmentForm.product_id}
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, product_id: value })}
                >
                  <SelectTrigger className="text-black bg-white border-gray-300">
                    <SelectValue placeholder="Select a product" className="text-black" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()} className="text-black hover:bg-gray-50 focus:bg-gray-50">
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="quantity" className="text-black font-medium">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={assignmentForm.quantity}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, quantity: e.target.value })}
                  placeholder="Enter quantity"
                  min="1"
                  className="text-black bg-white border-gray-300 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignmentDialogOpen(false)} className="text-black bg-white border-gray-300 hover:bg-gray-50 hover:text-black">
                Cancel
              </Button>
              <Button 
                onClick={handleAssignmentSubmit}
                disabled={createAssignmentMutation.isPending || updateAssignmentMutation.isPending}
                className="text-white"
              >
                {createAssignmentMutation.isPending || updateAssignmentMutation.isPending 
                  ? "Saving..." 
                  : (editingAssignment ? 'Update' : 'Assign')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}