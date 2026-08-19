import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlan } from "@/hooks/usePlan";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";

export function DebugSubscription() {
  const { user } = useAuth();
  const { activeOrganization, currentRole } = useOrganization();
  const { subscription, ambiguousSubscription, isActive, loading: subLoading } = useSubscription();
  const plan = usePlan();
  const { isAdmin } = useIsAdmin();

  if (!isAdmin) return <div className="p-12 text-center">Acesso negado. Apenas admin.</div>;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-8 space-y-6">
        <h1 className="text-2xl font-bold">Diagnóstico de Assinatura</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-slate-50 dark:bg-slate-900 space-y-2">
            <h2 className="font-bold border-b pb-2">Auth & Org</h2>
            <div className="text-sm space-y-1">
              <p><strong>user.id:</strong> {user?.id}</p>
              <p><strong>activeOrganization.id:</strong> {activeOrganization?.id}</p>
              <p><strong>currentRole:</strong> {currentRole}</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 dark:bg-slate-900 space-y-2">
            <h2 className="font-bold border-b pb-2">Plan Resolution</h2>
            <div className="text-sm space-y-1">
              <p><strong>isActive:</strong> {String(isActive)}</p>
              <p><strong>tier:</strong> {plan.tier}</p>
              <p><strong>isPro:</strong> {String(plan.isPro)}</p>
              <p><strong>isFree:</strong> {String(plan.isFree)}</p>
              <p><strong>plan.loading:</strong> {String(plan.loading)}</p>
              <p><strong>subLoading:</strong> {String(subLoading)}</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 dark:bg-slate-900 space-y-2">
            <h2 className="font-bold border-b pb-2">Org Subscription</h2>
            <div className="text-sm space-y-1">
              <p><strong>id:</strong> {subscription?.id || 'null'}</p>
              <p><strong>status:</strong> {subscription?.status}</p>
              <p><strong>plan_id:</strong> {subscription?.product_id || subscription?.price_id}</p>
              <p><strong>current_period_end:</strong> {subscription?.current_period_end}</p>
              <p><strong>organization_id:</strong> {subscription?.organization_id}</p>
            </div>
          </Card>

          <Card className="p-4 bg-slate-50 dark:bg-slate-900 space-y-2">
            <h2 className="font-bold border-b pb-2">Legacy (Ambiguous) Sub</h2>
            <div className="text-sm space-y-1">
              <p><strong>id:</strong> {ambiguousSubscription?.id || 'null'}</p>
              <p><strong>status:</strong> {ambiguousSubscription?.status}</p>
              <p><strong>current_period_end:</strong> {ambiguousSubscription?.current_period_end}</p>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
