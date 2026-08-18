import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MAX_LEAD_VALUE = 1_000_000;

export const parseLeadValue = (raw: string): { value: number | null; error: string | null } => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { value: null, error: "Informe um valor por lead" };

  if (!/^-?[\d.,]+$/.test(trimmed)) {
    return { value: null, error: "Use apenas números, vírgula ou ponto" };
  }

  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  const decimalPos = Math.max(lastComma, lastDot);

  let normalized: string;
  if (decimalPos === -1) {
    normalized = trimmed;
  } else {
    const intPart = trimmed.slice(0, decimalPos).replace(/[.,]/g, "");
    const decPart = trimmed.slice(decimalPos + 1);
    normalized = `${intPart}.${decPart}`;
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) return { value: null, error: "Valor inválido" };
  if (num < 0) return { value: null, error: "O valor não pode ser negativo" };
  if (num > MAX_LEAD_VALUE) {
    return { value: null, error: `O valor máximo é R$ ${MAX_LEAD_VALUE.toLocaleString("pt-BR")}` };
  }

  const rounded = Math.round(num * 100) / 100;
  return { value: rounded, error: null };
};
