# Homologação do KUBOWEB sem cobrança

Este roteiro cria uma separação rígida entre teste e produção. Ele deve ser executado em um projeto Supabase de homologação e em uma prévia Vercel protegida. Nunca use as credenciais de produção neste ambiente.

## 1. Configuração obrigatória

### Prévia Vercel

- `VITE_SUPABASE_URL`: URL do Supabase de homologação.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: chave pública do Supabase de homologação.
- `VITE_PAYMENTS_ENVIRONMENT=sandbox`.

### Supabase de homologação

- `PAYMENTS_ENVIRONMENT=sandbox`.
- `MP_SANDBOX_ACCESS_TOKEN`: credencial de teste do Mercado Pago.
- `MP_SANDBOX_WEBHOOK_SECRET`: assinatura secreta do webhook de teste.
- `APP_URL` e `PUBLIC_APP_URL`: URL exata da prévia usada no teste.
- `ALLOWED_ORIGIN`: a mesma origem da prévia.
- `BREVO_API_KEY` e `BREVO_FROM_EMAIL`: necessários para testar convites e alertas por e-mail.
- `GEMINI_API_KEY`: necessária somente para validar IA no plano Pro.

Não crie variáveis `VITE_*` para chaves secretas. Tudo que começa por `VITE_` é entregue ao navegador.

## 2. Banco de homologação

Aplicar as migrações na ordem do repositório. Depois, no SQL Editor do projeto de homologação, fixar o universo de pagamentos:

```sql
ALTER DATABASE postgres SET app.settings.payment_environment TO 'sandbox';
```

Reconectar ao banco e conferir:

```sql
SELECT current_setting('app.settings.payment_environment', true);
```

O resultado esperado é `sandbox`. Em produção, o valor deve ser `live`.

## 3. Webhook de teste

Cadastrar no painel de testes do Mercado Pago:

```text
https://SEU-PROJETO-DE-HOMOLOGACAO.supabase.co/functions/v1/mp-webhook
```

Ativar notificações de `payment`, `preapproval` e `subscription_authorized_payment`. O segredo cadastrado no Mercado Pago precisa ser o mesmo de `MP_SANDBOX_WEBHOOK_SECRET`.

## 4. Cenário completo sem cobrança

1. Criar uma organização e um usuário proprietário exclusivos de teste.
2. Confirmar que o usuário começa no plano Gratuito e não acessa IA Pro.
3. Iniciar o checkout pela tela de preços.
4. Confirmar que a URL aberta pertence ao Mercado Pago e usa a conta/cartão de teste.
5. Concluir a aprovação no ambiente de testes.
6. Confirmar que o webhook criou uma única assinatura com `environment='sandbox'`, período final futuro e a organização correta.
7. Reenviar a mesma notificação e confirmar que não surgiu uma segunda assinatura.
8. Confirmar acesso ao Insights com IA e consumo do limite atômico do plano Pro.
9. Cancelar pela tela de assinatura; conferir a confirmação do Mercado Pago e a manutenção do acesso somente até o fim do período.
10. Confirmar que a mesma assinatura sandbox não concede Pro quando a aplicação está configurada como `live`.

## 5. Critérios de interrupção

Pare o teste e não publique se ocorrer qualquer um destes casos:

- a prévia apontar para o Supabase de produção;
- uma credencial live estiver presente na homologação;
- o frontend responder `live` enquanto o backend responder `sandbox`, ou o inverso;
- o webhook aceitar assinatura inválida;
- uma aprovação não possuir data final de acesso;
- o mesmo evento criar duas assinaturas;
- um usuário de outra organização conseguir ler ou alterar a assinatura;
- o cancelamento local ocorrer sem confirmação do Mercado Pago.

Referências: [testes do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/cards), [Webhooks do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks) e [e-mail transacional da Brevo](https://developers.brevo.com/reference/send-transac-email).

