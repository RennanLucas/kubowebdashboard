import { useState, useRef, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  loading?: boolean;
  onComplete: (code: string) => void;
  onResend: () => void;
  resendCooldown: number;
}

export function OTPInput({ 
  length = 6, 
  loading = false, 
  onComplete, 
  onResend, 
  resendCooldown 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus on the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Take only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-advance
    if (value && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    const code = newOtp.join("");
    if (code.length === length && !newOtp.includes("")) {
      onComplete(code);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Se estiver vazio e pressionar backspace, volta para o anterior e apaga
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length).trim();
    if (!/^\d+$/.test(pastedData)) return; // aceita apenas números

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < length) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);

    // Focus last filled or the very last input
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    const code = newOtp.join("");
    if (code.length === length && !newOtp.includes("")) {
      onComplete(code);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full">
      <div className="flex gap-2 justify-between w-full max-w-[280px] mx-auto">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={loading}
            className={cn(
              "w-10 h-12 sm:w-11 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-background border border-border rounded-lg shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all",
              digit ? "border-primary/50 text-foreground" : "text-muted-foreground",
              loading && "opacity-50 cursor-not-allowed"
            )}
            aria-label={`Dígito ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={resendCooldown > 0 || loading}
          onClick={onResend}
          className="text-muted-foreground hover:text-foreground text-sm h-8"
        >
          {resendCooldown > 0 
            ? `Reenviar código em ${resendCooldown}s` 
            : "Não recebeu? Reenviar código"}
        </Button>
      </div>
    </div>
  );
}
