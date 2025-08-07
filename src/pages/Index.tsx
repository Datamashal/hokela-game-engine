
import { useState } from "react";
import { SpinWheel } from "@/components/SpinWheel";
import { UserForm } from "@/components/UserForm";
import { WinnerModal } from "@/components/WinnerModal";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "@/components/ui/use-toast";

// Get the proper API URL based on environment variable or fallback to API path
const API_URL = import.meta.env.VITE_API_URL || "/api";

interface UserData {
  name: string;
  email: string;
  location: string;
  agentName: string;
}

export type Prize = {
  label: string;
  isWin: boolean;
};

export default function Index() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showSpinner, setShowSpinner] = useState(false);
  const [prizeWon, setPrizeWon] = useState<Prize | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (data: UserData) => {
    setUserData(data);
    setShowSpinner(true);
  };

  const handleSpinEnd = async (prize: Prize) => {
    setPrizeWon(prize);
    setShowWinModal(true);

    if (userData) {
      try {
        setIsLoading(true);
        console.log(`Sending result to backend: ${API_URL}/spin-results`);
        
        // Create timeout for the request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // Increased timeout to 30 seconds
        
        // Prepare the payload with the correct field names expected by the backend
        const payload = {
          name: userData.name,
          email: userData.email,
          location: userData.location,
          agent_name: userData.agentName, // Added agent_name field for backend
          prize: prize.label,
          is_win: prize.isWin, // Backend expects is_win not isWin
        };
        
        console.log("Sending payload:", payload);
        
        // Save spin result to the backend API with improved error handling
        const response = await fetch(`${API_URL}/spin-results`, {
          method: 'POST',
          signal: controller.signal,
          mode: 'cors', // Explicitly set CORS mode
          cache: 'no-cache', // Disable caching
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
        });
        
        clearTimeout(timeoutId);

        // Parse response JSON first
        let responseData;
        try {
          responseData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse response JSON:', parseError);
          throw new Error(`Server returned invalid JSON response (Status: ${response.status})`);
        }

        if (!response.ok) {
          console.error('Server error response:', responseData);
          
          // Handle specific error cases
          if (response.status === 503) {
            throw new Error('Service temporarily unavailable. Please try again in a few moments.');
          } else if (response.status === 400) {
            throw new Error(responseData.message || 'Invalid data provided');
          } else if (response.status === 409) {
            throw new Error('This result has already been recorded');
          } else {
            throw new Error(responseData.message || `Server error: ${response.status}`);
          }
        }
        
        console.log('Successfully saved spin result to backend:', responseData);
        
        // Only show success toast if explicitly needed
        if (responseData.success) {
          console.log('Spin result saved successfully');
        }
        
      } catch (error: any) {
        console.error('Error saving spin result:', error);
        
        let errorTitle = "Saving Error";
        let errorMessage = "Could not save to server. Please try again.";
        
        // Handle different types of errors with user-friendly messages
        if (error.name === 'AbortError') {
          errorTitle = "Connection Timeout";
          errorMessage = "The request took too long. Your result may still be saved. Please check your connection.";
        } else if (error.message.includes('503')) {
          errorTitle = "Service Unavailable";
          errorMessage = "The server is temporarily unavailable. Please try again in a few moments.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again.";
        } else if (error.message.includes('temporarily unavailable')) {
          errorTitle = "Service Temporarily Down";
          errorMessage = error.message;
        } else {
          errorMessage = error.message || "Unknown error occurred. Please try again.";
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const closeModal = () => {
    setShowWinModal(false);
    setShowSpinner(false);
    setUserData(null);
    setPrizeWon(null);
  };

  return (
    <div className="min-h-screen bg-[#1a807a]/85 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center">
      {!showSpinner ? (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* Twende Morocco logo with responsive size */}
          <div className="mb-4 sm:mb-6">
            <img 
              src="/lovable-uploads/105f608b-85eb-4a01-9481-e651fc553969.png" 
              alt="Twende Morocco Logo" 
              className="w-[120px] sm:w-[150px] h-auto"
            />
          </div>
          
          {/* Animated disclaimer */}
          <div className="mb-2 sm:mb-3 text-center animate-fade-in">
            <p className="text-xs sm:text-sm text-white/90 animate-pulse">
              Everyone should win a merchandise prize
            </p>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mt-4 sm:mt-6 md:mt-8 mb-6 md:mb-8 uppercase text-center px-2">
            Spin the Wheel and Win
          </h1>
          <div className="w-full max-w-md px-3 sm:px-0">
            <UserForm onSubmit={handleFormSubmit} />
          </div>
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center">
          {/* Twende Morocco logo with responsive size */}
          <div className="mb-4 sm:mb-6">
            <img 
              src="/lovable-uploads/10e18fb5-c7a6-4fe2-869e-61a2e63ee5a8.png" 
              alt="Twende Morocco Logo" 
              className="w-[120px] sm:w-[150px] h-auto"
            />
          </div>
          
          {/* Animated disclaimer */}
          <div className="mb-2 sm:mb-3 text-center animate-fade-in">
            <p className="text-xs sm:text-sm text-white/90 animate-pulse">
              Everyone should win a merchandise prize
            </p>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white/95 mt-4 sm:mt-6 md:mt-8 mb-6 md:mb-8 uppercase text-center px-2">
            Spin The Wheel
          </h1>
          
          <div className="flex justify-center w-full px-4 sm:px-6">
            <div className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[400px] lg:max-w-[450px]">
              <SpinWheel onSpinEnd={handleSpinEnd} />
            </div>
          </div>
        </div>
      )}

      {/* Powered By: Hokela Team text at bottom center */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-white/95 text-sm font-medium">
          Powered By: 
          <a href="https://hokela.co.ke/" target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer ml-1">
            Hokela Interactive Africa
          </a>
        </p>
      </div>

      {showWinModal && prizeWon && userData && (
        <WinnerModal 
          isOpen={showWinModal} 
          onClose={closeModal} 
          prize={prizeWon} 
          userData={userData} 
        />
      )}
      
      <Toaster />
    </div>
  );
}
