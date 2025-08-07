
import { toast } from "@/components/ui/use-toast";

export interface WheelSector {
  color: string;
  text: string;
  label: string;
  isWin: boolean;
  image?: string;
}


// Wheel sectors with actual Ilara Mazila products - alternating blue and red colors like reference
export interface WheelSector {
  color: string;
  text: string;
  label: string;
  isWin: boolean;
  image?: string;
}

export const wheelSectors: WheelSector[] = [
  {
    color: "#1e40af",
    text: "#ffffff",
    label: "Ilara Maziwa 500ML",
    isWin: true,
    image: "/lovable-uploads/ce83ca42-1c5a-4b59-aeea-02d67702e949.png",
  },
  {
    color: "#dc2626",
    text: "#ffffff",
    label: "Try Again",
    isWin: false,
  },
  {
    color: "#1e40af",
    text: "#ffffff",
    label: "Aprons",
    isWin: true,
    image: "/lovable-uploads/930d77e5-260e-4f17-815a-16b4adfcc090.png",
  },
  {
    color: "#dc2626",
    text: "#ffffff",
    label: "Try Again",
    isWin: false,
  },
  {
    color: "#1e40af",
    text: "#ffffff",
    label: "Induction Cooker",
    isWin: true,
    image: "/lovable-uploads/393fafe7-a016-467c-ad93-0753a4608635.png",
  },
  {
    color: "#dc2626",
    text: "#ffffff",
    label: "Try Again",
    isWin: false,
  },
  {
    color: "#1e40af",
    text: "#ffffff",
    label: "Kitchen Set",
    isWin: true,
    image: "/lovable-uploads/3c0a59aa-d4a8-4afd-9519-6e34535bbb53.png",
  },
  {
    color: "#dc2626",
    text: "#ffffff",
    label: "Try Again",
    isWin: false,
  },
];


// Function to determine which sector the wheel landed on based on final angle
export function getFinalSector(degrees: number, sectors: WheelSector[]): WheelSector {
  // Convert degrees to sectors
  // Each sector occupies (360 / number of sectors) degrees
  const sectorAngle = 360 / sectors.length;
  const normalizedDegrees = degrees % 360;
  
  // Calculate sector index (account for clockwise rotation)
  // We need to find the opposite sector since the wheel spins clockwise
  const sectorIndex = Math.floor(normalizedDegrees / sectorAngle);
  const finalIndex = (sectors.length - sectorIndex - 1) % sectors.length;
  
  return sectors[finalIndex];
}

// Send result to backend
export const sendSpinResultToBackend = async (sector: WheelSector) => {
  try {
    // This will be implemented when we connect to the backend
    console.log("Sending result to backend:", sector);
  } catch (error) {
    console.error("Error sending result to backend:", error);
  }
};

// Function to animate wheel spinning with a random end position
export const spinWheel = (
  canvas: HTMLCanvasElement | null,
  onSpinComplete: (sector: WheelSector) => void
): number | undefined => {
  if (!canvas) return undefined;
  
  // Calculate a random number of full rotations (5-10) plus a random ending position
  const spinRevolutions = 5 + Math.random() * 5; // 5-10 full revolutions
  const spinAngle = spinRevolutions * 360 + Math.floor(Math.random() * 360);
  
  // Set up the animation
  canvas.style.transition = "transform 4s cubic-bezier(0.1, 0.25, 0.1, 1.0)";
  canvas.style.transform = `rotate(${spinAngle}deg)`;
  
  toast({
    title: "Spinning the wheel...",
    description: "Good luck!",
  });
  
  // When spin is done, determine the winner
  setTimeout(() => {
    // Calculate which sector the wheel landed on
    const finalSector = getFinalSector(spinAngle, wheelSectors);
    
    // Notify parent component
    onSpinComplete(finalSector);
    
    // Log result to backend (not used directly in this component)
    sendSpinResultToBackend(finalSector);
  }, 4000);
  
  return spinAngle;
};
