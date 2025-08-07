
import { useEffect, useRef } from "react";
import { WheelSector, wheelSectors } from "@/utils/spinWheelUtils";

interface WheelCanvasProps {
  onCanvasReady: (canvas: HTMLCanvasElement) => void;
}

export function WheelCanvas({ onCanvasReady }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get the actual width of the canvas element - responsive for different screen sizes
    const parentWidth = canvas.parentElement ? canvas.parentElement.clientWidth : canvas.width;
    
    // Adjust the size based on the parent width
    // Use a more responsive approach for tablets and older browsers
    const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const size = Math.min(parentWidth, windowWidth > 768 ? 450 : 380);
    
    // Set canvas dimensions based on parent container size
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dia = canvas.width;
    const rad = dia / 2;
    const PI = Math.PI;
    const TAU = 2 * PI;
    const arc = TAU / wheelSectors.length;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw border around the wheel with white color
    ctx.beginPath();
    ctx.arc(rad, rad, rad - 2, 0, TAU);
    // Use parseInt instead of Math.max for better compatibility
    ctx.lineWidth = parseInt((canvas.width * 0.018).toString()) || 4; 
    ctx.strokeStyle = "#ffffff"; 
    ctx.stroke();

    var drawSector = function(sector, i) {
      var ang = arc * i;
      ctx.save();

      // COLOR
      ctx.beginPath();
      ctx.fillStyle = sector.color;
      ctx.moveTo(rad, rad);
      // Use parseInt for better compatibility
      var borderWidth = parseInt((canvas.width * 0.022).toString()) || 5;
      ctx.arc(rad, rad, rad - borderWidth, ang, ang + arc); 
      ctx.lineTo(rad, rad);
      ctx.fill();

      // Draw image if sector has one
      if (sector.image) {
        var img = new Image();
        img.onload = function() {
          ctx.save();
          ctx.translate(rad, rad);
          ctx.rotate(ang + arc / 2);
          
          // Calculate image size and position
          var imageSize = parseInt((rad * 0.25).toString()) || 40;
          var imageDistance = parseInt((rad * 0.5).toString()) || rad - 80;
          
          ctx.drawImage(img, imageDistance - imageSize/2, -imageSize/2, imageSize, imageSize);
          ctx.restore();
        };
        img.src = sector.image;
      }

      // TEXT
      ctx.translate(rad, rad);
      ctx.rotate(ang + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = sector.text;
      
      // Improved responsive font size calculation for better readability
      var fontSizeBase = windowWidth > 768 ? 0.020 : 0.025;
      var fontSizeCalc = canvas.width * fontSizeBase;
      var fontSize = parseInt(fontSizeCalc.toString()) || 10;
      fontSize = fontSize < 10 ? 10 : fontSize; // Ensure minimum font size for readability
      
      ctx.font = "bold " + fontSize + "px Arial, sans-serif";
      
      // Position text based on canvas size with better spacing (lower position for images)
      var textDistance = parseInt((rad * 0.72).toString()) || rad - 35;
      var textYPosition = sector.image ? 25 : 4; // Lower text if there's an image
      ctx.fillText(sector.label, textDistance, textYPosition);

      ctx.restore();
    };

    // Draw all sectors initially
    for (var i = 0; i < wheelSectors.length; i++) {
      drawSector(wheelSectors[i], i);
    }

    // Draw smaller center circle with white background
    var centerRadius = rad / 4;
    ctx.beginPath();
    ctx.arc(rad, rad, centerRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = "white";
    ctx.fill();

    // Add "SPIN" text in the center with improved sizing
    var spinFontSizeCalc = canvas.width * 0.055;
    var spinFontSize = parseInt(spinFontSizeCalc.toString()) || 18;
    spinFontSize = spinFontSize < 18 ? 18 : spinFontSize;

    ctx.font = "bold " + spinFontSize + "px Arial, sans-serif";
    ctx.fillStyle = "#1a807a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", rad, rad);

    // Notify parent that canvas is ready
    onCanvasReady(canvas);

  }, [canvasRef.current ? (canvasRef.current.parentElement ? canvasRef.current.parentElement.clientWidth : 0) : 0]); 

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-auto rounded-full transition-transform cursor-pointer"
      style={{WebkitTapHighlightColor: 'rgba(0,0,0,0)'}}
      aria-label="Prize wheel with Mazila Bottles, Cookware Set, Cooking Apron, and Induction Cooker prizes"
    />
  );
}
