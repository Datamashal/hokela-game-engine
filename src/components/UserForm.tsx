
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
    <div className="w-full p-6 sm:p-8 bg-gradient-to-br from-white via-blue-50 to-blue-100 rounded-xl shadow-xl border border-blue-200">
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
          Register to Play
        </h2>
        <p className="text-blue-600 text-sm sm:text-base">Fill in your details to spin the wheel</p>
      </div>
      
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm sm:text-base font-semibold text-blue-800">Full Name</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="Enter your full name"
            className={`text-sm sm:text-base bg-white border-2 border-blue-200 focus:border-blue-500 text-blue-800 rounded-lg transition-all duration-200 ${errors.name ? "border-red-500 focus:border-red-500" : ""}`}
          />
          {errors.name && (
            <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm sm:text-base font-semibold text-blue-800">Email Address</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="Enter your email address"
            className={`text-sm sm:text-base bg-white border-2 border-blue-200 focus:border-blue-500 text-blue-800 rounded-lg transition-all duration-200 ${errors.email ? "border-red-500 focus:border-red-500" : ""}`}
          />
          {errors.email && (
            <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm sm:text-base font-semibold text-blue-800">Outlet Name</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Enter Outlet Name"
            className={`text-sm sm:text-base bg-white border-2 border-blue-200 focus:border-blue-500 text-blue-800 rounded-lg transition-all duration-200 ${errors.location ? "border-red-500 focus:border-red-500" : ""}`}
          />
          {errors.location && (
            <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.location.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="agentName" className="text-sm sm:text-base font-semibold text-blue-800">BA's Name</Label>
          <Input
            id="agentName"
            {...register("agentName")}
            placeholder="Enter BA's Name"
            className={`text-sm sm:text-base bg-white border-2 border-blue-200 focus:border-blue-500 text-blue-800 rounded-lg transition-all duration-200 ${errors.agentName ? "border-red-500 focus:border-red-500" : ""}`}
          />
          {errors.agentName && (
            <p className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
              <span>⚠️</span> {errors.agentName.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base py-3 sm:py-4 mt-6 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit & Spin the Wheel 🎰"}
        </Button>
      </form>
    </div>
  );
}
