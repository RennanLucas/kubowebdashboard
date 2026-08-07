import { useEffect, useState } from "react";
import {
  getPlanPreview,
  setPlanPreview,
  subscribePlanPreview,
  type PreviewTier,
} from "@/lib/plan-preview";

/** Estado reativo da pré-visualização de plano. */
export function usePlanPreview() {
  const [preview, setPreview] = useState<PreviewTier>(() => getPlanPreview());

  useEffect(() => subscribePlanPreview(() => setPreview(getPlanPreview())), []);

  return { preview, setPreview: setPlanPreview };
}
