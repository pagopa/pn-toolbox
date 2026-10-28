# PN Toolbox

Strumenti web per SEND, pubblicati su GitHub Pages.

**🔗 [pagopa.github.io/pn-toolbox](https://pagopa.github.io/pn-toolbox/)**


Niente backend: ogni tool gira interamente nel browser.

| Tool | Cosa fa | Sorgente |
| --- | --- | --- |
| [Analog Delivery Tracker](https://pagopa.github.io/pn-toolbox/tools/analogDeliveryTracker/) | lo storico di una spedizione analogica, da IUN o `trackingId` | [`tools/analogDeliveryTracker`](tools/analogDeliveryTracker/) |

---

## Come è organizzato

```
tools/
├── home/                    la home e la build dell'intero sito
│   ├── index.html           template della home
│   └── build.js             costruisce _site/
└── <nome>/                  un tool
    ├── site-tool.json       nome e descrizione, per la home
    ├── public/              quello che viene pubblicato
    └── package.json         facoltativo: solo se il tool ha una build
```

**Ogni tool è indipendente** e contiene tutto quello che gli serve: codice,
dipendenze e configurazione di build. Può essere un progetto Node con una build
oppure una semplice cartella di file statici.

**Un tool viene pubblicato copiando la sua `public/`.** Si chiama così e sta
dentro la cartella del tool:

- **tool statico**, senza `package.json`: `public/` contiene i file da
  pubblicare ed è versionata;
- **tool con build**, con `package.json`: `npm run build` deve scrivere il
  risultato in `public/`, che va messa nel `.gitignore` del tool.

## Regola: ogni import esterno ha `integrity`

Ogni `<script src>` e ogni `<link>` che carica uno script o un foglio di stile
da fuori (un CDN) deve avere versione esatta e l'attributo `integrity`. È un
vincolo: **va rispettato da ogni tool** e la build non lo verifica, quindi
controllalo in review.

Non serve per i file del tool stesso, scritti a mano o generati dalla build:
sono serviti dalla stessa origine del sito.

Una libreria si può prendere da CDN solo se esiste come file unico da caricare
con `<script src>`, a versione esatta:

```html
<script src="https://cdn.jsdelivr.net/npm/<pacchetto>@<versione esatta>/<file>"
        integrity="sha384-…" crossorigin="anonymous"></script>
```

```sh
# calcolare l'hash
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

**Se una libreria non si può caricare così**, per esempio perché va importata
come modulo ES o non ha una build unica per il browser come l'SDK AWS, il tool
deve usare Node e un sistema di build come Vite. La libreria finisce nella build
del tool e l'HTML generato carica solo file locali.

## Aggiungere un tool

1. Crea `tools/<nome>/`. Il nome finisce nell'URL: usa lettere, cifre, `.`, `_`
   e `-`.
2. Aggiungi `tools/<nome>/site-tool.json`:

   ```json
   {
     "name": "Nome del tool",
     "description": "Una riga su cosa fa."
   }
   ```

   Senza questo file la cartella viene ignorata.
3. Prepara `public/index.html`:
   - **statico:** scrivilo a mano, con `integrity` su ogni import da CDN;
   - **con build:** aggiungi `package.json`, `package-lock.json` e lo script
     `build`, che deve scrivere in `public/`. Aggiungi `public/` e
     `node_modules/` al `.gitignore` del tool.
4. Usa percorsi relativi (`./…`) negli HTML. Il tool viene servito sotto
   `/pn-toolbox/tools/<nome>/`, quindi un percorso che inizia con `/` non trova i
   file.

Per un tool con Vite, parti dal
[`vite.config.js`](tools/analogDeliveryTracker/vite.config.js) del tracker,
che imposta già percorsi relativi (`base: "./"`) e build in `public/`.

È consigliato anche un `.npmrc` con `ignore-scripts=true`, che blocca gli script
di installazione dei pacchetti npm, e `save-exact=true`.

## Build del sito

```sh
node tools/home/build.js
```

Per ogni cartella di `tools/` che ha `site-tool.json`:

1. se c'è `package.json`, esegue `npm ci` e `npm run build`;
2. controlla che esista `public/index.html` e copia `public/` in
   `_site/tools/<nome>/`.

Poi genera `_site/index.html` dal template della home, con una card per ogni
tool. Si ferma al primo errore. `_site/` non va nel repository.

Per vedere il risultato:

```sh
npx serve _site
```

Per lavorare su un solo tool basta la sua cartella, per esempio `npm run dev`.