# Messaggio proposto per il supporto Pi Network

Oggetto: Richiesta configurazione DNS per il dominio `iou4088.pi` collegato alla Pi App

Ciao team Pi Network,

sto completando l'integrazione del login Pi per l'app con App ID `iou4088.pi`. Il codice front-end e back-end dell'autenticazione è già operativo, ma l'SDK Pi non viene iniettato perché il dominio `iou4088.pi` non punta ancora al deploy su Vercel. Finché l'app viene servita da `https://logo-five-mu.vercel.app`, il Pi Browser mostra `SDK status: Waiting` e l'SDK non è disponibile.

Per risolvere il blocco, vi chiedo di configurare il dominio `iou4088.pi` verso il deploy Vercel con una delle seguenti opzioni (preferita: TXT per verifica Vercel):

1. **TXT record** per la verifica del dominio Vercel (fornirò il valore esatto non appena confermate la disponibilità a inserirlo).
2. **CNAME** verso il record fornito da Vercel per il dominio `iou4088.pi` (fornirò l'hostname completo appena ci date il via).
3. **A/ALIAS** verso l'indirizzo indicato da Vercel, se preferite un puntamento diretto.

**Perché è necessario:** il Pi Browser inietta `window.Pi` solo quando la pagina è caricata da `pi://<appId>.pi`. Senza un record DNS che punti `iou4088.pi` al deploy Vercel, l'app resta su un dominio esterno (`vercel.app`) e l'SDK non viene iniettato, impedendo il login. Una volta che `iou4088.pi` servirà l'app, l'SDK verrà iniettato automaticamente e l'autenticazione funzionerà con il codice già presente, senza ulteriori modifiche.

**Stato del codice:** l'implementazione dell'autenticazione Pi è completa e pronta; non sono richiesti cambiamenti aggiuntivi lato applicativo.

**Prossimi passi:** appena confermate di poter applicare un record DNS (TXT, CNAME o A/ALIAS), vi invierò immediatamente i valori esatti da impostare per la verifica e il puntamento verso Vercel.

Se preferite riesaminare l'app prima di procedere, fatemi sapere: posso fornirvi accesso al deploy corrente (`https://logo-five-mu.vercel.app`) e qualsiasi dettaglio tecnico utile. Non sono necessari adeguamenti al codice per abilitare l'SDK; serve solo l'aggancio DNS del dominio `iou4088.pi`.

Grazie per il supporto!
