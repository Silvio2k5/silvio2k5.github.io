// ==============================================================
//  DEINE SPIELE
//  Für ein neues Spiel: HTML-Datei in den Ordner "spiele" legen
//  und unten einen neuen Eintrag hinzufügen (Vorlage kopieren).
//  Achte auf die Kommas zwischen den Einträgen!
// ==============================================================
//
//  VORLAGE zum Kopieren:
//
//  {
//    id: "mein-spiel",                    // eindeutig, nur a-z, 0-9 und -
//    titel: "Mein Spiel",
//    datei: "spiele/mein-spiel.html",     // Pfad zur Spieldatei
//    beschreibung: "Worum geht es?",
//    genre: "Arcade",
//    steuerung: "Pfeiltasten: bewegen",
//    symbol: "🎮",                         // Emoji für die Hülle (oder "")
//    farbe: 200,                          // Farbton der Hülle, 0 bis 359
//    titelbild: "",                       // optional, z. B. "bilder/mein-spiel.jpg"
//    datum: "2026-11-06"                  // Jahr-Monat-Tag
//  },

window.SPIELE = [
  {
    id: "neon-snake",
    titel: "Neon-Snake",
    datei: "spiele/neon-snake.html",
    beschreibung: "Der Klassiker in Neon: Friss die leuchtenden Punkte, werde länger und schneller – aber beiß dir nicht in den Schwanz.",
    genre: "Arcade",
    steuerung: "Pfeiltasten oder WASD: lenken\nLeertaste: Runde starten\nAm Handy: wischen",
    symbol: "🐍",
    farbe: 285,
    titelbild: "",
    datum: "2026-11-06"
  },
];
