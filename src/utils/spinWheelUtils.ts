
import { toast } from "@/components/ui/use-toast";

export interface WheelSector {
  color: string;
  text: string;
  label: string;
  isWin: boolean;
  image?: string;
}

// Wheel sectors with actual Ilara Mazila products - alternating blue and red colors like reference
export const wheelSectors: WheelSector[] = [
  { color: "#1e40af", text: "#ffffff", label: "MAZILA BOTTLES", isWin: true, image: "/lovable-uploads/8620a2a3-f9f5-4308-a9a8-bd275d85f3bb.png" },
  { color: "#dc2626", text: "#ffffff", label: "TRY AGAIN", isWin: false },
  { color: "#1e40af", text: "#ffffff", label: "COOKWARE SET", isWin: true, image: "/lovable-uploads/61c93083-6593-44b-a6df-1049cbc61339.png" },
  { color: "#dc2626", text: "#ffffff", label: "TRY AGAIN", isWin: false },
  { color: "#1e40af", text: "#ffffff", label: "COOKING APRON", isWin: true, image: "/lovable-uploads/f571e24f-5859-4d3b-8f86-73c0d8828516.png" },
  { color: "#dc2626", text: "#ffffff", label: "TRY AGAIN", isWin: false },
  { color: "#1e40af", text: "#ffffff", label: "INDUCTION COOKER", isWin: true, image: "/lovable-uploads/b20b8cb9-412f-480c-9b0c-6b857eb67907.png" },
  { color: "#dc2626", text: "#ffffff", label: "TRY AGAIN", isWin: false },
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
