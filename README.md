# Cobrei

App para pequenos negócios que cobram mensalidade (escolinhas, academias pequenas, professores
particulares, cursos, personal trainers) controlarem quem pagou e cobrarem os atrasados pelo
WhatsApp, com Pix copia e cola e QR Code no valor certo.

## O que o app faz (versão 1)

- **Painel do mês**: quanto já entrou, quanto está a vencer e quanto está atrasado, com a lista de
  clientes ordenada por urgência.
- **Clientes**: nome, WhatsApp, valor, dia do vencimento e observações. Mostra quantas mensalidades
  cada cliente tem em aberto.
- **Cobrar em um toque**: abre o WhatsApp do cliente com uma mensagem pronta, que pode ser
  personalizada e já leva o Pix copia e cola.
- **Pix sem intermediário**: gera o BR Code estático do Banco Central a partir da chave Pix do
  usuário. O dinheiro cai direto na conta dele e não há taxa nem cadastro em banco.
- **Histórico**: pagamentos por mês, com opção de desfazer, além de desativar ou excluir clientes.

Os dados ficam salvos no próprio aparelho (AsyncStorage). Ainda não há login nem servidor.

## Como rodar

```bash
npm install
npm start          # abre o Expo; escaneie o QR Code com o app Expo Go
npm test           # testes da lógica (Pix, cobranças, formatação, WhatsApp)
npm run typecheck
```

## Estrutura

```
src/app/            telas (Expo Router)
  (tabs)/index.tsx  painel do mês
  (tabs)/clientes   lista de clientes
  (tabs)/ajustes    chave Pix, dados do negócio e mensagem de cobrança
  cliente/          cadastro e detalhes do cliente
  cobrar.tsx        QR Code, copia e cola e envio pelo WhatsApp
src/lib/            regras de negócio puras e testadas
src/state/store.tsx estado global com persistência local
tests/              testes com o runner nativo do Node
```

## Plano de monetização

| Plano    | Preço sugerido | Limite                                                                   |
|----------|----------------|--------------------------------------------------------------------------|
| Grátis   | R$ 0           | até 10 clientes                                                          |
| Pro      | R$ 29,90/mês   | clientes ilimitados, backup na nuvem, relatórios                         |
| Negócio  | R$ 59,90/mês   | lembretes automáticos, Pix com baixa automática, vários usuários         |

## Próximos passos

1. **Backup e login** (Supabase): sem isso, quem troca de celular perde os dados, e é o principal
   motivo para pagar.
2. **Assinatura dentro do app** (RevenueCat, para Google Play e App Store) com o limite do plano
   grátis.
3. **Lembretes automáticos**: notificação local no dia do vencimento ("3 clientes vencem hoje").
4. **Pix com baixa automática** (Asaas, Mercado Pago ou Efí), em que o pagamento confirma sozinho.
5. **Relatórios**: inadimplência por mês e exportação em PDF/planilha.
6. Publicação com EAS Build (`npx eas-cli@latest build`).
