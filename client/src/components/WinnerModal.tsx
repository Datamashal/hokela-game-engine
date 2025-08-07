import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Prize } from "@/pages/Index";
import confetti from "canvas-confetti";
import { useEffect } from "react";

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prize: Prize;
  userData: {
    name: string;
    email: string;
    location: string;
  };
}

export function WinnerModal({ isOpen, onClose, prize, userData }: WinnerModalProps) {
  useEffect(() => {
    if (isOpen && prize.isWin) {
      // First check if confetti function exists
      if (typeof confetti === 'function') {
        try {
          // Enhanced confetti animation for winning
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#1a807a', '#ffffff', '#FEF7CD']
          });
        } catch (error) {
          console.log("Confetti animation not supported in this browser");
        }
      } else {
        console.log("Confetti library not available");
      }
    }
  }, [isOpen, prize.isWin]);

  // Get prize emoji based on prize type
  const getPrizeEmoji = (prizeLabel: string) => {
    const label = prizeLabel.toLowerCase();
    if (label.includes('umbrella')) return '☂️';
    if (label.includes('water bottle')) return '💧';
    if (label.includes('key holder')) return '🔑';
    return '🎁';
  };

  // Use string concatenation instead of template literals for class names
  const titleClass = "text-center text-xl sm:text-2xl " + 
    (prize.isWin ? "text-[#1a807a]" : "text-[#f59122]");

  const descClass = "text-center text-base sm:text-lg " + 
    (!prize.isWin ? "text-white" : "");

  const contentClass = "text-center p-3 sm:p-6 " + 
    (prize.isWin ? "animate-bounce" : "");

  // Create greeting message with fallback for empty name
  const userName = userData.name || 'Player';
  const prizeEmoji = getPrizeEmoji(prize.label);
  const greeting = prize.isWin 
    ? "Congratulations " + userName + "! You won a " + prize.label + "!"
    : "Hey " + userName + ", better luck next time!";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-4 sm:p-6 max-w-[90vw] md:max-w-[500px] w-[90vw] sm:w-auto">
        <DialogHeader>
          <DialogTitle className={titleClass}>
            {prize.isWin ? "🎉 Amazing! 🎉" : "💔 So Close! 💔"}
          </DialogTitle>
          <DialogDescription className={descClass}>
            {greeting}
          </DialogDescription>
        </DialogHeader>
        <div className={contentClass}>
          <p className="text-3xl sm:text-4xl md:text-5xl mb-2">{prizeEmoji}</p>
          <p className="text-xl sm:text-2xl md:text-3xl break-words font-bold">{prize.label}</p>
          {prize.isWin && (
            <p className="text-sm sm:text-base mt-3 text-gray-600">
              Contact our team to claim your prize!
            </p>
          )}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button 
            type="button" 
            variant="default" 
            onClick={onClose}
            className="w-full sm:w-auto bg-[#FEF7CD] hover:bg-[#f0e8be] text-[#1a807a] font-semibold"
          >
            {prize.isWin ? "Claim Your Prize!" : "Try Again Next Time!"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
