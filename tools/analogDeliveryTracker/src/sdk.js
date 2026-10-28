/**
 * L'SDK AWS, diviso in chunk locali che Vite carica al primo collegamento.
 *
 * Arriva al primo collegamento e non prima: chi apre la pagina e non si connette
 * non scarica niente. Un `import()` ripetuto sullo stesso URL non riscarica, e
 * la promessa qui accanto fa sì che due chiamate in parallelo non chiedano due
 * volte.
 *
 * I pacchetti npm ufficiali sono fissati nel lockfile; Vite risolve la
 * condizione browser, quindi usa `@smithy/fetch-http-handler` e non il gestore
 * HTTP di Node. In produzione i chunk sono serviti dalla stessa origine.
 */

let loading = null;

/**
 * I due pacchetti, ognuno nel suo namespace.
 *
 * Fonderli in un oggetto solo sarebbe più comodo e sbagliato: hanno 19 nomi in
 * comune — `ResourceNotFoundException`, `ThrottlingException`,
 * `LimitExceededException` fra gli altri — e sono classi *diverse* nei due
 * servizi. L'ultimo caricato vincerebbe, e un `instanceof` guarderebbe la
 * classe del servizio sbagliato senza dirlo a nessuno.
 */
export function sdk() {
  loading ??= Promise.all([
    import("@aws-sdk/client-dynamodb"),
    import("@aws-sdk/client-cloudwatch-logs"),
  ]).then(([dynamodb, cloudwatch]) => ({ dynamodb, cloudwatch }));
  return loading;
}

/**
 * I due client che il tracker usa.
 *
 * Le credenziali si passano come oggetto, scavalcando la catena dei provider:
 * nel browser andrebbe a cercare variabili d'ambiente e file che non esistono.
 */
export async function clients(credentials, region) {
  const { dynamodb, cloudwatch } = await sdk();
  return {
    ddb: new dynamodb.DynamoDBClient({ region, credentials }),
    logs: new cloudwatch.CloudWatchLogsClient({ region, credentials }),
  };
}
