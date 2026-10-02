# Caderninho

O caderno de fiado do comércio de bairro, sem papel. Feito para mercadinhos, padarias, açougues,
bares, lanchonetes e lojinhas que vendem "na caderneta".

## O problema

O fiado ainda é anotado num caderno de papel, e isso traz problemas conhecidos:
- "Eu não comprei isso!": sem registro que o cliente tenha visto, a palavra de um vale contra a do outro.
- Ninguém sabe ao certo quanto dinheiro está na rua, nem quem deve há mais tempo.
- Na hora de cobrar, é preciso somar tudo na mão, e dá vergonha de pedir.

## O que o Caderninho faz

- **Comprovante na hora**: cada compra anotada vai para o WhatsApp do cliente com o valor, os itens e
  o saldo atualizado. O cliente acompanha a própria conta e não sobra espaço para discussão.
- **Dinheiro na rua**: o total que os clientes devem, quantos estão devendo e o fiado e o recebido no mês.
- **Quem deve há mais tempo** aparece primeiro, em amarelo depois de 15 dias e em vermelho depois de 30.
- **Cobrança com Pix**: o extrato vai pelo WhatsApp com o Pix copia e cola no valor exato da conta, ou o
  QR Code aparece na tela para o cliente pagar no balcão. O dinheiro cai direto na conta do lojista, sem taxa.
- **Limite de fiado** por cliente, com aviso antes de passar do limite.
- **Pagamento parcial ou total**, com extrato e saldo após cada lançamento.

Os dados ficam salvos no próprio celular. Ainda não há login nem servidor.

## Instalar no celular (APK)

Baixe o arquivo `.apk` mais recente em
[Releases](https://github.com/antuneslibano/Mobile/releases/latest) pelo celular e abra-o. O app
avisa sozinho quando sai uma versão nova, e basta instalar por cima: os dados continuam salvos.

### Publicar uma nova versão

```bash
git tag v1.0.1 && git push origin v1.0.1
```

O workflow `.github/workflows/release-android.yml` compila o APK, assina e publica o Release.
Também dá para rodá-lo pela aba **Actions** em *Release Android*, em *Run workflow*.

O APK é assinado com a chave dos secrets `ANDROID_KEYSTORE_BASE64` e `ANDROID_KEYSTORE_PASSWORD`.
Guarde uma cópia dessa chave: sem ela, as próximas versões não instalam por cima da atual.

## Estrutura

```
src/app/            telas (Expo Router)
  (tabs)/index.tsx  caderno: dinheiro na rua e lista de clientes
  (tabs)/ajustes    nome da loja e chave Pix
  cliente/          cadastro e extrato do cliente
  lancar.tsx        anotar compra ou receber pagamento (+ comprovante)
  cobrar.tsx        QR Code, copia e cola e extrato pelo WhatsApp
src/lib/            regras de negócio puras e testadas
src/state/store.tsx estado global com persistência local
tests/              testes com o runner nativo do Node
```

## Plano de monetização

| Plano   | Preço sugerido | O que inclui                                                              |
|---------|----------------|---------------------------------------------------------------------------|
| Grátis  | R$ 0           | até 15 clientes                                                           |
| Loja    | R$ 19,90/mês   | clientes ilimitados, backup na nuvem, relatório mensal                    |
| Loja+   | R$ 39,90/mês   | vários celulares no mesmo caderno, link de extrato online para o cliente  |

## Próximos passos

1. **Backup na nuvem e login**: o caderno é o patrimônio da loja e não pode sumir com o celular.
2. **Link do extrato** que o cliente abre a qualquer hora, sem precisar pedir.
3. **Vários atendentes** no mesmo caderno, com sincronização entre celulares.
4. **Lembrete de cobrança** automático para quem deve há mais de X dias.
5. **Assinatura dentro do app** com o limite do plano grátis.
6. Publicação na Google Play.
