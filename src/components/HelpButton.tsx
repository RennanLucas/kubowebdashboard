import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startProductTour } from "@/lib/product-tour";
import { useNavigate, useLocation } from "react-router-dom";

export function HelpButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = async () => {
    // Tour funciona melhor no dashboard (onde os elementos da sidebar estão visíveis)
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
      // espera o DOM montar
      setTimeout(() => startProductTour(), 400);
    } else {
      startProductTour();
    }
  };

  return (
    <Button
      onClick={handleClick}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90"
      title="Tutorial: como usar o app"
      aria-label="Tutorial: como usar o app"
    >
      <HelpCircle className="h-5 w-5" />
    </Button>
  );
}
