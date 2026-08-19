import { CreditCard, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Organization } from "@/contexts/OrganizationContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SubscriptionTabProps {
  subscription: any;
  activeOrganization: Organization | null;
}

export function SubscriptionTab({ subscription, activeOrganization }: SubscriptionTabProps) {
  const { ambiguousSubscription } = useSubscription();

  return (
    <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" /> Assinatura da Organização
      </h2>
      
      {subscription ? (
        <>
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
            <h3 className="font-semibold text-foreground mb-2">Detalhes do Plano Pro</h3>
            <ul className="list-disc pl-5 space-y-1 text-muted-foreground mb-4">
              <li>Projetos e sites ilimitados</li>
              <li>Histórico de dados estendido de 365 dias</li>
              <li>10 Resumos Semanais com IA por mês</li>
              <li>Relatórios em PDF e Exportação CSV</li>
            </ul>
            <p className="text-foreground border-t border-border/50 pt-3 mt-3">
              Status:{" "}
              <span className="font-medium capitalize">
                {subscription.status === "trialing"
                  ? "Em período de teste"
                  : subscription.status === "active"
                    ? "Ativa"
                    : subscription.status === "canceled"
                      ? "Cancelada"
                      : subscription.status}
              </span>
            </p>
            {subscription.trial_end && subscription.status === "trialing" && (
              <p className="text-muted-foreground">
                Trial termina em{" "}
                {new Date(subscription.trial_end).toLocaleDateString("pt-BR")}
              </p>
            )}
            {subscription.current_period_end && (
              <p className="text-muted-foreground">
                {subscription.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}:{" "}
                {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Para cancelar a assinatura, atualizar o cartão ou ver suas faturas, acesse sua conta no Mercado Pago em <strong>Minhas assinaturas</strong>.
          </p>
          <Button
            variant="outline"
            className="w-full h-11"
            asChild
          >
            <a
              href="https://www.mercadopago.com.br/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Gerenciar no Mercado Pago
            </a>
          </Button>
        </>
      ) : ambiguousSubscription ? (
        <>
          <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Assinatura pendente de reconciliação</AlertTitle>
            <AlertDescription>
              Localizamos uma assinatura ativa no seu usuário, mas ela ainda não foi vinculada a esta organização. O faturamento e os limites da conta podem não ser refletidos corretamente até que isso seja ajustado. Por favor, entre em contato com o suporte.
            </AlertDescription>
          </Alert>
          <Button variant="outline" className="w-full h-11" disabled>
            Aguardando reconciliação
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            A organização <strong>{activeOrganization?.name}</strong> ainda não possui uma assinatura ativa.
          </p>
          <Button variant="outline" className="w-full h-11" asChild>
            <a href="/pricing">Ver planos e assinar</a>
          </Button>
        </>
      )}
    </div>
  );
}

