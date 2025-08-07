
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";

interface UserFormProps {
  onSubmit: (data: { name: string; email: string; location: string; agentName: string }) => void;
}

// Enhanced email validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .refine((email) => {
      // Check for proper email format with a more strict regex
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }, { message: "Please enter a valid email address with a proper domain." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  agentName: z.string().min(2, { message: "Agent name must be at least 2 characters." }),
});

type FormValues = z.infer<typeof formSchema>;

export function UserForm({ onSubmit }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onFormSubmit = async (data: FormValues) => {
    try {
      // Since the form validation ensures all fields are properly filled,
      // we can safely pass the data to onSubmit
      onSubmit({
        name: data.name,
        email: data.email,
        location: data.location,
        agentName: data.agentName
      });
      toast.success("Registration successful! Let's spin the wheel!");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-[#1a807a]">Register to Play</h2>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3 sm:space-y-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-base text-[#1a807a]">Full Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter your full name"
            className={`text-sm sm:text-base bg-white text-[#1a807a] ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="text-xs sm:text-sm text-red-500">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="email" className="text-sm sm:text-base text-[#1a807a]">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email address"
            className={`text-sm sm:text-base bg-white text-[#1a807a] ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-xs sm:text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="location" className="text-sm sm:text-base text-[#1a807a]">Outlet Name</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Enter Outlet Name"
            className={`text-sm sm:text-base bg-white text-[#1a807a] ${errors.location ? "border-red-500" : ""}`}
          />
          {errors.location && (
            <p className="text-xs sm:text-sm text-red-500">{errors.location.message}</p>
          )}
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="agentName" className="text-sm sm:text-base text-[#1a807a]">BA's Name</Label>
          <Input
            id="agentName"
            {...register("agentName")}
            placeholder="Enter BA's Name"
            className={`text-sm sm:text-base bg-white text-[#1a807a] ${errors.agentName ? "border-red-500" : ""}`}
          />
          {errors.agentName && (
            <p className="text-xs sm:text-sm text-red-500">{errors.agentName.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#1a807a] hover:bg-[#156b66] text-white text-sm sm:text-base py-2 sm:py-3 mt-2"
          disabled={isSubmitting}
        >
          Submit & Spin the Wheel
        </Button>
      </form>
    </div>
  );
}
