
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Prize } from "@/pages/Index";
import { WheelCanvas } from "./wheel/WheelCanvas";
import { spinWheel, WheelSector } from "@/utils/spinWheelUtils";

interface SpinWheelProps {
  onSpinEnd: (prize: Prize) => void;
}

export function SpinWheel({ onSpinEnd }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [wheelCanvas, setWheelCanvas] = useState<HTMLCanvasElement | null>(null);
  const isMobile = useIsMobile();

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    
    // Get the current wheel angle and trigger the spin animation
    const spinResult = spinWheel(wheelCanvas, handleSpinComplete);
    if (spinResult !== undefined) {
      setCurrentRotation(spinResult);
    }
  };
  
  const handleSpinComplete = (finalSector: WheelSector) => {
    // Notify parent component
    onSpinEnd({ 
      label: finalSector.label, 
      isWin: finalSector.isWin 
    });
    
    setIsSpinning(false);
  };

  const handleCanvasReady = (canvas: HTMLCanvasElement) => {
    setWheelCanvas(canvas);
  };

  // Determine wheel container size based on device - 3/4 of screen
  // Using string concatenation instead of template literals for older browsers
  const wheelSizeClass = isMobile 
    ? "w-[75vw] h-[75vw] max-w-[400px] max-h-[400px]" 
    : "w-[60vw] h-[60vw] max-w-[600px] max-h-[600px]";

  return (
    <div className="flex flex-col items-center w-full">
      <div className={"relative " + wheelSizeClass + " mx-auto"}>
        <WheelCanvas onCanvasReady={handleCanvasReady} />
        
        {/* Spin Area - the whole wheel is clickable */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          onClick={handleSpin}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSpin();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Spin the wheel"
        />
        
        {/* Center button with logo */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[15%] h-[15%] rounded-full cursor-pointer bg-white border-2 border-gray-300 flex items-center justify-center shadow-lg"
          onClick={handleSpin}
          onKeyPress={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleSpin();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Spin the wheel center button"
        >
          <img 
            src="/lovable-uploads/dea1f866-73e1-425a-915f-a3c933e3204c.png" 
            alt="Ilara Logo" 
            className="w-[80%] h-[80%] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
