export const DICT_DE = {
  "meta": {
    "id": "base_default_de",
    "lang": "de-DE",
    "name": "Basisprofil",
    "version": "2.0.0",
    "author": "System Core",
    "description": "Erweitertes Wörterbuch für Produktivität, Aktivitätsrhythmen und Alltagsszenarien ohne Metaphern oder Esoterik.",
    "tts_prefix": "Tagesrhythmus-Zusammenfassung für heute."
  },
  "profiles": {
    "profile_async": {
      "title": "Introvertierter Rhythmus",
      "short_desc": "Höchste Konzentration in ruhiger Umgebung",
      "full_desc": "Ihre höchste Produktivität liegt in der Erneuerungsphase des Zyklus, wenn äußerer Informationslärm minimal ist."
    },
    "profile_waxing": {
      "title": "Aufbau-Rhythmus",
      "short_desc": "Schrittweiser Anlauf und stetiges Wachstum",
      "full_desc": "Sie erreichen Ihre beste Leistung in der ersten Zyklushälfte, indem Sie Tempo und Ressourcen aufbauen."
    },
    "profile_sync": {
      "title": "Extrovertierter Rhythmus",
      "short_desc": "Leistungsspitze im Einklang mit äußerem Schwung",
      "full_desc": "Ihre persönliche Aktivität fällt mit dem äußeren Zyklushoch zusammen und liefert Kraft für sichtbare Aufgaben."
    },
    "profile_waning": {
      "title": "Optimierungs-Rhythmus",
      "short_desc": "Fokus auf Analyse und Prozessabschluss",
      "full_desc": "Ihre größte Klarheit zeigt sich in der zweiten Zyklushälfte, wenn Ergebnisse strukturiert und abgeschlossen werden."
    }
  },
  "phases": {
    "phase_peak": {
      "title": "Maximale Ressource",
      "badge": "Hoch",
      "tempo": "Hohes Tempo",
      "action": "Schlüsselgespräche, Projektstarts, klare Entscheidungen",
      "tts_summary": "Heute ist die Phase maximaler Ressource. Ideale Zeit für Hauptprioritäten und entschlossenes Handeln."
    },
    "phase_decline": {
      "title": "Ruhiger Rhythmus",
      "badge": "Abstieg",
      "tempo": "Moderates Tempo",
      "action": "Begonnenes abschließen, Analyse, Dokumentation",
      "tts_summary": "Heute gilt ein ruhiger Rhythmus. Drosseln Sie das Tempo, sichern Sie Ergebnisse und schließen Sie Offenes ab."
    },
    "phase_minimum": {
      "title": "Erholungsmodus",
      "badge": "Minimum",
      "tempo": "Niedriges Tempo",
      "action": "Regeneration, leichte Routine, Überlastung vermeiden",
      "tts_summary": "Heute ist Erholungsmodus. Planen Sie keine anspruchsvollen Neustarts und priorisieren Sie Schlaf und Pause."
    },
    "phase_rise": {
      "title": "Tempoaufbau",
      "badge": "Anstieg",
      "tempo": "Wachsendes Tempo",
      "action": "Planung, Informationssammlung, strukturierte Vorbereitung",
      "tts_summary": "Heute ist die Aufbauphase. Gute Zeit für Planung, Datensammlung und einen ruhigen Arbeitsstart."
    }
  },
  "phase_day_notes": {
    "phase_peak": {
      "start": "Frühes Hoch: Bringen Sie Prioritätsprojekte in die aktive Umsetzung und sichern Sie Zusagen.",
      "middle": "Mitte des Hochs: Volle Kraft — lösen Sie komplexe Aufgaben und übernehmen Sie Verantwortung.",
      "end": "Ende des Hochs: Wandeln Sie Schwung in konkrete Resultate um, ohne kurzfristig Neues aufzuladen."
    },
    "phase_decline": {
      "start": "Beginn des Abstiegs: Verlagern Sie den Fokus von Neustarts auf Ausarbeitung und Begleitung.",
      "middle": "Mitte des Abstiegs: Ideale Balance aus ruhiger Konzentration für Berichte, Analyse und Ordnung.",
      "end": "Ende des Abstiegs: Schließen Sie Restpunkte ab, ziehen Sie Zwischenbilanz und senken Sie die Last."
    },
    "phase_minimum": {
      "start": "Beginn des Minimums: Streichen Sie unnötige Meetings, halten Sie nur Basisroutine und schützen Sie Ihren Fokus.",
      "middle": "Mitte des Minimums: Ruhiges Reset-Fenster. Leeren Sie den Kalender und gönnen Sie sich Pausen.",
      "end": "Ende des Minimums: Die Kräfte kehren zurück — skizzieren Sie ohne Eile erste Schritte für kommende Woche."
    },
    "phase_rise": {
      "start": "Beginn des Anstiegs: Wechseln Sie von Ruhe zu Struktur, testen Sie Ideen und sammeln Sie fehlende Fakten.",
      "middle": "Mitte des Anstiegs: Der Arbeitstonus steigt stetig — erweitern Sie Kontakte und praktische Umsetzung.",
      "end": "Ende des Anstiegs: Erreichen Sie volle Kapazität und bereiten Sie die Hauptentscheidungen vor."
    }
  },
  "roles": {
    "role_agile": {
      "title": "Sprint-Modus",
      "hint": "Fokus auf schnelle Kommunikation, kurze Aufgaben und Flexibilität."
    },
    "role_drive": {
      "title": "Durchbruch-Modus",
      "hint": "Eigeninitiative, direkter Zug zum Ziel und zügige Entscheidungen."
    },
    "role_diplomat": {
      "title": "Dialog-Modus",
      "hint": "Termine, Partnerschaft, Kompromissfindung und Teamarbeit."
    },
    "role_heavy": {
      "title": "Verantwortungs-Modus",
      "hint": "Systematische Arbeit, Standards, Fristen und große Aufgaben."
    },
    "role_autonomous": {
      "title": "Autonomer Modus",
      "hint": "Ruhiges Arbeiten, Planung und schonender Umgang mit Kräften."
    }
  },
  "age_classes": {
    "age_18_25": {
      "title": "Hohe Dynamik",
      "modifier_hint": "Schnelle Regeneration. Legen Sie rechtzeitig Pausen ein, um Übermüdung vorzubeugen."
    },
    "age_26_40": {
      "title": "Ausdauer-Balance",
      "modifier_hint": "Hohe soziale Belastung. Teilen Sie Ihre Kräfte gleichmäßig über den Tag ein."
    },
    "age_41_55": {
      "title": "Präzise Prioritäten",
      "modifier_hint": "Stützen Sie sich auf Erfahrung. Wählen Sie gezielte Schritte statt Hektik und schützen Sie Erholung."
    },
    "age_55_plus": {
      "title": "Komfortables Tempo",
      "modifier_hint": "Lebensqualität hat Vorrang. Gleichmäßiger Rhythmus ohne harte Spitzen und achtsamer Einsatz."
    }
  },
  "actors": {
    "actor_moon": {
      "title": "Stimmung & Anpassung",
      "domain": "Befinden, Alltagsaufgaben, Flexibilität im Gespräch"
    },
    "actor_mercury": {
      "title": "Kollegen, Nachrichten & Daten",
      "domain": "Telefonate, Dokumente, Lernen, kurze Wege"
    },
    "actor_venus": {
      "title": "Nahestehende, Partner & Komfort",
      "domain": "Beziehungen, Absprachen, Finanzen, Erholung"
    },
    "actor_mars": {
      "title": "Aktive Aufgaben & Wettbewerb",
      "domain": "Initiative, Debatten, Bewegung, Tempo"
    },
    "actor_jupiter": {
      "title": "Führung, Mentoren & Reichweite",
      "domain": "Karriere, Großprojekte, Weiterbildung, strategisches Wachstum"
    },
    "actor_saturn": {
      "title": "Regeln, Fristen & Kontrolle",
      "domain": "Verantwortung, Ordnung, Prüfungen, Termintreue"
    },
    "actor_outer": {
      "title": "Äußere Umstände & Wandel",
      "domain": "Planänderungen, Überraschungen, tiefgreifende Umstellung"
    }
  },
  "moon_trends": {
    "new": "Neumond",
    "waxing": "Zunehmender Mond",
    "full": "Vollmond",
    "waning": "Abnehmender Mond"
  },
  "moon_phase_names": {
    "new_moon": "Neumond",
    "waxing_crescent": "Zunehmende Sichel",
    "first_quarter": "Erstes Viertel",
    "waxing_gibbous": "Zunehmender Mond",
    "full_moon": "Vollmond",
    "waning_gibbous": "Abnehmender Mond",
    "last_quarter": "Letztes Viertel",
    "waning_crescent": "Abnehmende Sichel"
  },
  "zodiac_names": {
    "Овен": "Widder",
    "Телец": "Stier",
    "Близнецы": "Zwillinge",
    "Рак": "Krebs",
    "Лев": "Löwe",
    "Дева": "Jungfrau",
    "Весы": "Waage",
    "Скорпион": "Skorpion",
    "Стрелец": "Schütze",
    "Козерог": "Steinbock",
    "Водолей": "Wassermann",
    "Рыбы": "Fische"
  },
  "zodiac_hints": {
    "Овен": "schnelle Entscheidungen, Eigeninitiative und Aufgabenstarts",
    "Телец": "Praxisnähe, Finanzen und ruhiges Tempo",
    "Близнецы": "Verhandlungen, Schriftverkehr und Informationsaustausch",
    "Рак": "Wohlbefinden, Familie und innere Balance",
    "Лев": "Präsentationen, Führung und sichtbare Schritte",
    "Дева": "Ordnung, Analyse, Dokumente und Präzisionsarbeit",
    "Весы": "Partnerschaft, Diplomatie und Kompromisssuche",
    "Скорпион": "Tiefenanalyse, Strategie und Ressourcensteuerung",
    "Стрелец": "Reichweitenplanung, Lernen und neue Horizonte",
    "Козерог": "Disziplin, Fristen, Struktur und Systemaufgaben",
    "Водолей": "frische Ideen, Teamarbeit und neue Ansätze",
    "Рыбы": "kreative Aufgaben, Nachdenken und schonendes Tempo"
  },
  "lunar_days": {
    "1": "Tag der strategischen Planung. Formulieren Sie Monatsziele, ohne sofort hektisch zu starten.",
    "2": "Tag der Ressourcensammlung und praktischen Vorbereitung. Budgets prüfen, Listen schreiben, Werkzeuge bereitlegen.",
    "3": "Tag des kraftvollen Starts. Vom Nachdenken zur konkreten Tat übergehen und Prioritäten vertreten.",
    "4": "Tag abgewogener Entscheidungen und Risikoprüfung. Pläne an reale Ressourcen anpassen, Impulse bremsen.",
    "5": "Tag konsequenter Festigung. Begonnenes ausarbeiten, Zusagen einhalten und Kurs beibehalten.",
    "6": "Tag konstruktiver Kommunikation und Ideenaustausch. Ideal für sanfte Abstimmungen, Gespräche und Lernen.",
    "7": "Tag klarer Worte und präziser Formulierungen. Präsentationen halten, verhandeln und Zusagen schriftlich fixieren.",
    "8": "Tag der Erneuerung und flexiblen Neuausrichtung. Überholte Routinen anpassen und neue Formate testen.",
    "9": "Tag erhöhter Vorsicht bei Informationen. Fakten doppelt prüfen, fremde Konflikte meiden, nicht emotional entscheiden.",
    "10": "Tag stabiler Aufbauarbeit. Kraft in Familie, Teamaufgaben und langfristige Vorhaben investieren.",
    "11": "Tag hoher Konzentration und Willenskraft. Komplexe Aufgaben konsequent bis zu einem klaren Abschluss führen.",
    "12": "Tag der Diplomatie und gegenseitigen Unterstützung. Ruhiger Ton, Zuhören und Hilfsbereitschaft bringen beste Resultate.",
    "13": "Tag der Erfahrungsanalyse und Fehlerkorrektur. Alte Ideen neu prüfen und Pläne verfeinern.",
    "14": "Einer der produktivsten Tage des Zyklus. Ideal für mutige Schritte, Projektstarts und wichtige Gespräche.",
    "15": "Tag der Selbstkontrolle bei hoher Intensität. Fokus auf Wesentlichem halten, Grenzen wahren, ruhig bleiben.",
    "16": "Tag des Gleichgewichts und ruhigen Takts. Schreibtisch aufräumen, Dateien sortieren und Gedanken ordnen.",
    "17": "Tag lebendigen Austauschs und positiver Kooperation. Gut für Brainstorming, lockere Treffen und Kreatives.",
    "18": "Tag objektiven Feedbacks. Beobachten, wie Gewohnheiten und Tonfall auf andere wirken, und Details justieren.",
    "19": "Tag der Informationshygiene und Altlastenbereinigung. Kleine Pflichten schließen, Lärm filtern, Verträge prüfen.",
    "20": "Tag der Klarheit und Überwindung von Zweifeln. Stark für bewusste Entscheidungen und Abbau von Ballast.",
    "21": "Tag von Teamgeist und mutiger Initiative. Menschen um ein gemeinsames Ziel sammeln und Pläne vorantreiben.",
    "22": "Tag tiefer Analyse und Weiterbildung. Komplexe Daten auswerten, Fachliteratur lesen, neue Wege finden.",
    "23": "Tag klarer Grenzen und entschlossener Bereinigung. Überflüssiges streichen und zähe Streitpunkte klären.",
    "24": "Tag ruhiger Basisarbeit. Praktische Aufgaben, Reparaturen, Haushaltsordnung und Kernprozesse stärken.",
    "25": "Tag gelassener Beobachtung und Genauigkeit. Nichts überstürzen — nur sicher Geprüftes umsetzen.",
    "26": "Tag der Aufmerksamkeitsökonomie und Stille. Leerlauf meiden, Kalkulationen prüfen, Zeit schützen.",
    "27": "Tag der Synthese und intuitiven Ordnung. Verstreute Fakten zu einem Gesamtbild fügen und Recherchen schließen.",
    "28": "Tag der Wertschätzung und klaren Bilanz. Monatserfolge festhalten und letzte Feinheiten ruhig abschließen.",
    "29": "Tag des Abschlusses und Nullpunkts. Nichts Neues starten — Aufräumen, Ruhe und früher Schlaf sind ideal.",
    "30": "Tag des sanften Übergangs vor dem neuen Zyklus. Terminplan leeren, kleine Reibungen loslassen und erholen."
  },
  "aspect_dynamics": {
    "applying": "Der Einfluss nimmt zu — bestes Zeitfenster für vorausschauendes Handeln.",
    "exact": "Der Höhepunkt liegt genau heute — handeln Sie besonders bewusst.",
    "separating": "Der Höhepunkt ist überschritten, die Lage beruhigt sich — Ergebnisse sichern."
  },
  "maneuvers": {
    "edge_conjunction": {
      "title": "Volle Konzentration",
      "valence": "neutral",
      "advice": "Maximaler Fokus auf diesem Feld. Schrittweise vorgehen und nicht verzetteln."
    },
    "edge_sextile": {
      "title": "Günstige Gelegenheit",
      "valence": "positive",
      "advice": "Vorteilhaftes Fenster für Initiative. Machen Sie den ersten Schritt im Gespräch oder Projekt."
    },
    "edge_trine": {
      "title": "Leichtes Zusammenspiel",
      "valence": "positive",
      "advice": "Abläufe gelingen reibungslos. Nutzen Sie die Zeit für ruhige Abstimmung."
    },
    "edge_square": {
      "title": "Risiko von Hektik und Reibung",
      "valence": "warning",
      "advice": "Kleinere Reibungen möglich. Details prüfen, Tempo rausnehmen und scharfe Debatten meiden."
    },
    "edge_opposition": {
      "title": "Gegenpole, Balance suchen",
      "valence": "warning",
      "advice": "Grenzen wahren und Kompromiss suchen. Nicht um jeden Preis auf dem eigenen Standpunkt beharren."
    }
  },
  "actor_maneuver_matrix": {
    "actor_moon": {
      "edge_conjunction": "Die innere Wahrnehmung ist geschärft. Richten Sie den Tagesplan am realen Energiepegel aus.",
      "edge_sextile": "Alltagsabläufe laufen flexibel. Guter Moment, Termine günstig anzupassen.",
      "edge_trine": "Ausgeglichene, tragfähige Stimmung. Ruhige Familiengespräche gelingen problemlos.",
      "edge_square": "Stimmung kann schneller schwanken. Keine vorschnellen Alltagsentscheidungen, Puffer einplanen.",
      "edge_opposition": "Eigene Bedürfnisse kollidieren mit Erwartungen anderer. Grenzen ruhig benennen und Balance halten."
    },
    "actor_mercury": {
      "edge_conjunction": "Nachrichten, Anrufe und Ideen erreichen einen Höhepunkt. Wichtige Gedanken sofort notieren.",
      "edge_sextile": "Gutes Fenster für kurze Gespräche, Anträge und schnelle Kontakte.",
      "edge_trine": "Gedanken lassen sich klar formulieren. Ideal für Berichte, Lernen und Textabstimmung.",
      "edge_square": "Erhöhte Gefahr von Tippfehlern, Terminverwechslung und Unschärfen. Vor dem Senden gegenlesen.",
      "edge_opposition": "Im Dialog prallen gegensätzliche Ansichten aufeinander. Lieber nachfragen statt streiten."
    },
    "actor_venus": {
      "edge_conjunction": "Komfort, Ästhetik und herzliche Kontakte stehen vorn. Qualitätszeit für Erholung einplanen.",
      "edge_sextile": "Eine freundliche Geste schafft rasch Vertrauen und vorteilhafte Bedingungen.",
      "edge_trine": "Harmonische Zeit für kluge Käufe, Budgetabstimmung, Partnergespräche und Vertrauensaufbau.",
      "edge_square": "Mögliche Unzufriedenheit oder Impulskäufe. Größere Ausgaben auf morgen verschieben.",
      "edge_opposition": "Erwartungen Nahestehender und eigene Pläne weichen ab. Ruhig und ohne Vorwürfe vermitteln."
    },
    "actor_mars": {
      "edge_conjunction": "Starker Schub an Entschlossenheit. Energie gezielt in eine fordernde Aufgabe oder Sport lenken.",
      "edge_sextile": "Mutige Initiative bringt sichtbaren Fortschritt. Wichtige Anrufe nicht aufschieben.",
      "edge_trine": "Handlungen gelingen präzise und wirksam ohne Verkrampfung. Ideal für zügigen Abschluss.",
      "edge_square": "Erhöhtes Risiko für Härte, Eile und unnötigen Wettkampf. Vor Reaktionen durchatmen.",
      "edge_opposition": "Interessenkonflikt verlangt Klarheit ohne Aggression. Streit auf Fakten und Kriterien lenken."
    },
    "actor_jupiter": {
      "edge_conjunction": "Chancen für Wachstum und Rückhalt von Entscheidern entstehen. Große Ideen präsentieren.",
      "edge_sextile": "Ein guter Rat oder günstiger Zufall erweitert den Rahmen des aktuellen Projekts.",
      "edge_trine": "Positiver Hintergrund für Karrieregespräche, Weiterbildung und strategische Entwicklung.",
      "edge_square": "Neigung zur Selbstüberschätzung oder zu vielen Zusagen. Fristen und Budget realistisch prüfen.",
      "edge_opposition": "Eigene Ziele treffen auf äußere Regeln oder Leitungsvorgaben. Umfang mit Zahlen belegen."
    },
    "actor_saturn": {
      "edge_conjunction": "Höchste Verlässlichkeit und Disziplin sind gefragt. Systematik schlägt heute Improvisation.",
      "edge_sextile": "Guter Tag für Ordnung, Regelabstimmung und ruhige Arbeit bei Prüfungen.",
      "edge_trine": "Konsequenz und Erfahrung liefern belastbare Ergebnisse. Plan Schritt für Schritt abarbeiten.",
      "edge_square": "Strenge Fristen, Kontrollen oder Qualitätsauflagen möglich. Regeln genau einhalten.",
      "edge_opposition": "Äußerer Druck oder Kritik zeigt Schwachstellen im System. Ruhig beheben ohne Trotz."
    },
    "actor_outer": {
      "edge_conjunction": "Das äußere Umfeld verlangt rasches Umdenken bei Routinen. Flexibilität ist wichtiger als Starrheit.",
      "edge_sextile": "Ein unerwartetes Angebot oder frischer Blick zeigt einen originellen Ausweg aus der Routine.",
      "edge_trine": "Tiefere Prozessänderungen laufen organisch ab. Gute Zeit für moderne Werkzeuge.",
      "edge_square": "Plötzliche Planwechsel möglich. Reserveplan bereithalten und ruhig bleiben.",
      "edge_opposition": "Äußerer Wandel drängt zum Abschied von ineffektiven Mustern. Klaren Kopf bewahren."
    }
  },
  "lifestyle_tips": {
    "phase_peak": {
      "morning": [
        "Trinken Sie nach dem Aufwachen ein Glas Wasser und notieren Sie drei Hauptziele.",
        "Gehen Sie in der ersten Stunde zehn Minuten ans helle Tageslicht, um den Rhythmus zu festigen.",
        "Starten Sie mit kurzer Schulter- und Rückenmobilisation vor dem Blick in Arbeitsschats."
      ],
      "day": [
        "Wasser trinken und alle neunzig Minuten kurz dehnen.",
        "In fokussierten 45-Minuten-Blöcken mit fünf Minuten Augenpause arbeiten.",
        "Nach dem Mittagessen zehn Minuten spazieren, um die Konzentration wachzuhalten."
      ],
      "evening": [
        "Anspruchsvolle Aufgaben spätestens zwei Stunden vor dem Schlaf beenden.",
        "Drei Tagesergebnisse notieren und die Arbeitsliste gedanklich schließen.",
        "Deckenlicht 90 Minuten vor dem Schlaf dimmen und ruhige Lektüre wählen."
      ]
    },
    "phase_decline": {
      "morning": [
        "Ohne Hektik starten: Zimmer lüften und offene Aufgaben sortieren.",
        "In Ruhe frühstücken ohne Nachrichten oder E-Mails am Tisch.",
        "Die ersten dreißig Minuten einer klaren Aufgabe widmen, die sich leicht abschließen lässt."
      ],
      "day": [
        "Gute Zeit für Ordnung, Postfachbereinigung und ruhigen Projektabschluss.",
        "Auf Nacken- und Sitzhaltung achten und mittags sanft dehnen.",
        "Stilles Wasser oder ungesüßten warmen Tee statt weiterer Stimulanzien wählen."
      ],
      "evening": [
        "Einen ruhigen Spaziergang ohne Smartphone machen.",
        "Warm duschen und den Schreibtisch für morgen früh freiräumen.",
        "Telefon eine Stunde vor dem Schlafengehen auf lautlos stellen."
      ]
    },
    "phase_minimum": {
      "morning": [
        "Den Morgen leicht halten: warmes Wasser und ein ruhiges Frühstück geben Stabilität.",
        "Fünfzehn Minuten extra für sanftes Aufwachen ohne sofortige Nachrichten einplanen.",
        "Eine ruhige Atemübung mit langem Ausatmen zum Spannungsabbau durchführen."
      ],
      "day": [
        "Schonendes Tempo wahren. Extra-Kaffee durch Wasser oder Kräutertee ersetzen.",
        "Unnötige Calls streichen und den Augen fünfzehn Minuten Pause ohne Bildschirm gönnen.",
        "In Ruhe zu Mittag essen, fern von Arbeitschats und Videos."
      ],
      "evening": [
        "Vierzig Minuten früher schlafen gehen und Bildschirme eine Stunde vorher weglegen.",
        "Schlafzimmer lüften und das Telefon außerhalb der Reichweite laden.",
        "Vor dem Schlaf ein paar sanfte Lockerungsübungen für Schultern und unteren Rücken machen."
      ]
    },
    "phase_rise": {
      "morning": [
        "Morgenlicht, ein Glas Wasser und leichte Bewegung helfen beim sanften Einstieg.",
        "Wochenplan prüfen und eine Schlüsselaufgabe für den Vormittag wählen.",
        "Fünf Minuten Gelenkmobilisation einbauen und bequeme Kleidung wählen."
      ],
      "day": [
        "Gute Phase für Recherche, Lernen und Projektvorbereitung.",
        "Mittags kurz an die frische Luft gehen, um die Aufmerksamkeit aufzufrischen.",
        "Über den Tag verteilt Wasser trinken und den Arbeitsplatz gut beleuchten."
      ],
      "evening": [
        "Ein Abendspaziergang ordnet Gedanken und bereitet auf morgen vor.",
        "Einen kurzen Drei-Punkte-Plan für morgen skizzieren und den Arbeitstag abschließen.",
        "Abends dreißig Minuten einem ruhigen Hobby ohne Arbeitsbenachrichtigungen widmen."
      ]
    }
  },
  "day_themes": {
    "Овен": {
      "title": "Direkter Start",
      "focus": "Ein zügiger erster Schritt zählt heute mehr als überlange Vorbereitung."
    },
    "Телец": {
      "title": "Stabiles Tempo",
      "focus": "Stetige Ergebnisse bringen heute mehr als ein Sprint; bleiben Sie geerdet."
    },
    "Близнецы": {
      "title": "Informationsfluss",
      "focus": "Viele Kontakte und kurze Aufgaben; achten Sie besonders auf kleine Zusagen."
    },
    "Рак": {
      "title": "Achtsamer Fokus",
      "focus": "Ruhiges Arbeiten ohne Hektik; Familie, Zuhause und Wohlbefinden stehen vorn."
    },
    "Лев": {
      "title": "Eigener Beitrag",
      "focus": "Am besten gelingen Aufgaben, bei denen Ihre Eigenleistung klar sichtbar wird."
    },
    "Дева": {
      "title": "Präzision & Ordnung",
      "focus": "Detailprüfung, Checklisten und Routine leisten heute mehr als unnötiges Risiko."
    },
    "Весы": {
      "title": "Abstimmung",
      "focus": "Wichtige Entscheidungen hängen heute von Absprachen ab; suchen Sie faire Kompromisse."
    },
    "Скорпион": {
      "title": "Tiefe & Kontrolle",
      "focus": "Günstig für Ursachenanalyse und Ressourcensteuerung; Oberflächliches reicht nicht."
    },
    "Стрелец": {
      "title": "Erweiterung",
      "focus": "Lernen, Unterwegssein und frische Kontakte erweitern den Rahmen Ihrer Aufgabe."
    },
    "Козерог": {
      "title": "Disziplin",
      "focus": "Fristen, klare Struktur und Systemtreue zählen heute mehr als spontane Impulse."
    },
    "Водолей": {
      "title": "Frischer Ansatz",
      "focus": "Unkonventionelle Ideen und Flexibilität wirken besser als starre Schablonen."
    },
    "Рыбы": {
      "title": "Ruhiger Fokus",
      "focus": "Kreatives Nachdenken und Erholung wiegen heute schwerer als Zusatzpflichten."
    }
  },
  "phase_variants": {
    "phase_peak": [
      "Heute ist Phase maximaler Ressource: ideale Zeit für Top-Prioritäten und entschlossenes Handeln.",
      "Heute haben Sie starken Arbeitstonus: konzentrieren Sie sich auf das Wesentliche ohne Verzettelung.",
      "Heute ist die Leistungsfähigkeit hoch: schaffen Sie mehr als üblich bei klarem Blick auf Fristen."
    ],
    "phase_decline": [
      "Heute gilt ein ruhiger Rhythmus: Tempo drosseln, Ergebnisse sichern und Laufendes abschließen.",
      "Heute passt moderate Last: Begonnenes fertigzustellen bringt mehr als neue Baustellen.",
      "Heute zählt der Abschluss: Details prüfen und offene Prozesse sauber beenden."
    ],
    "phase_minimum": [
      "Heute ist Erholungsmodus: keine harten Neustarts planen, Zeit für Schlaf und Pause reservieren.",
      "Heute braucht es ein schonendes Maß: Kräfte sparen und Unnötiges aus dem Plan streichen.",
      "Heute hilft ein leichter Zeitplan: Basisroutine halten und rechtzeitig ausruhen."
    ],
    "phase_rise": [
      "Heute ist Aufbauphase: gute Zeit für Planung, Datensammlung und einen geordneten Einstieg.",
      "Heute steht Vorbereitung vorn: Fakten sammeln und sichere Basis für nächste Schritte legen.",
      "Heute steigt der Tonus allmählich: mit klarer Schrittfolge starten statt Tempo erzwingen."
    ]
  },
  "role_tone": {
    "role_agile": {
      "phase_peak": "Voller Sprint-Takt: kurze Aufgabenfolgen mit regelmäßigem Blick auf das Hauptziel.",
      "phase_decline": "Leicht erhöhtes Tempo: kurze Restpunkte klären, ohne neue Zweige aufzumachen.",
      "phase_minimum": "Nur kurze, leichte Aufgabenpakete ohne Hektik oder Zusatzdruck.",
      "phase_rise": "Bauen Sie Schwung in kurzen Etappen auf, ohne sich zu verzetteln."
    },
    "role_drive": {
      "phase_peak": "Volle Eigeninitiative: Priorität übernehmen und Entscheidungen direkt voranbringen.",
      "phase_decline": "Dosierte Initiative: einen wichtigen Schritt setzen und unnötige Debatten meiden.",
      "phase_minimum": "Behutsame Initiative: kleine, sichere Schritte ohne abrupte Belastung.",
      "phase_rise": "Die Initiative wächst stetig: mit einem klaren, machbaren ersten Schritt beginnen."
    },
    "role_diplomat": {
      "phase_peak": "Aktive Verhandlungen: Kernpunkte abstimmen und Beteiligte auf ein Ziel ausrichten.",
      "phase_decline": "Ein gezieltes Gespräch und ruhige Klärung der letzten Details.",
      "phase_minimum": "Abstimmungen kurz und sachlich halten, lange Diskussionen vertagen.",
      "phase_rise": "Der Dialog nimmt Fahrt auf: kommende Pläne frühzeitig abgleichen."
    },
    "role_heavy": {
      "phase_peak": "Systematisches Arbeiten unter Volllast: Checklisten, Standards und Fristen nutzen.",
      "phase_decline": "Geordneter Prüfblock: Unterlagen kontrollieren und bestehende Pflichten abschließen.",
      "phase_minimum": "Ruhige Ordnung im Bestehenden halten, ohne schwere neue Zusagen einzugehen.",
      "phase_rise": "Strukturierte Vorarbeit: Rahmen aufbauen und Ausgangsdaten prüfen."
    },
    "role_autonomous": {
      "phase_peak": "Tiefe Einzelarbeit an Ihrer wichtigsten Aufgabe ohne Unterbrechungen.",
      "phase_decline": "Ein ruhiger Konzentrationsblock ohne unnötige Telefonate.",
      "phase_minimum": "Ruhiger, unaufgeregter Eigenrhythmus bei minimalen äußeren Anforderungen.",
      "phase_rise": "Stille Startvorbereitung und geordnetes Sortieren eigener Ideen."
    }
  },
  "window_focus": {
    "morning": [
      "Setzen Sie eine klare Hauptpriorität für heute",
      "Sammeln Sie die Kernfakten für Ihre wichtigste Aufgabe",
      "Kalender prüfen und Überflüssiges streichen",
      "Eine kleine organisatorische Sache direkt klären"
    ],
    "day": [
      "Kernzeitblock fest für die Prioritätsaufgabe reservieren",
      "Geplante Telefonate und Abstimmungen durchführen",
      "Unterlagen, Zahlen und laufende Fristen prüfen",
      "Eine praktische Aufgabe mit aktivem Einsatz lösen"
    ],
    "evening": [
      "Tagesbilanz ziehen und wichtigste Erkenntnisse festhalten",
      "Kleine Restpunkte schließen und Kurzplan für morgen notieren",
      "Ruhige Zeit für Zuhause und nahestehende Menschen einplanen",
      "In ruhige Erholung ohne Arbeitsbildschirme wechseln"
    ]
  },
  "ui_labels": {
    "app_title": "Tagesrhythmus",
    "app_subtitle": "Lunar Rhythm Navigator",
    "lunar_day_short": "M.T.",
    "lunar_day_full": "Mondtag",
    "moon_age_unit": "T.",
    "label_moonrise": "Aufgang",
    "label_moonset": "Untergang",
    "hero_moon_aria": "Mondphase",
    "hero_illumination_title": "Mondbeleuchtung",
    "hero_trend_title": "Mondzyklus-Trend",
    "hero_alarm_title": "Mondwecker",
    "hero_alarm_aria": "Wecker ausschalten und vorlesen",
    "btn_copy_prompt_title": "Prompt für externes KI-Modell kopieren",
    "btn_copy_prompt_aria": "KI-Prompt",
    "prompt_copied_toast": "KI-Prompt kopiert",
    "btn_speak_briefing": "Bericht vorlesen",
    "btn_stop_speech": "Sprachausgabe stoppen",
    "nav_today": "Heute",
    "nav_reminders": "Erinnerungen",
    "nav_settings": "Einstellungen",
    "label_today": "Heute",
    "btn_back_today": "Heute",
    "timeline_aria": "Mondtage-Zeitleiste",
    "timeline_has_reminder": "Erinnerung vorhanden",
    "day_note_title": "Notiz",
    "day_note_placeholder": "Erinnerung für diesen Tag hinzufügen...",
    "btn_save": "Speichern",
    "btn_cancel": "Abbrechen",
    "btn_close": "Schließen",
    "btn_speak": "Vorlesen",
    "btn_toggle_on": "Ein",
    "btn_toggle_off": "Aus",
    "btn_delete": "Löschen",
    "btn_clear": "Leeren",
    "btn_test_voice": "Stimme testen",
    "btn_download_template": "Vorlage laden",
    "btn_upload_dict": "Wörterbuch laden",
    "btn_add_reminder": "Neu",
    "tab_by_lunar_day": "Nach Mondtag",
    "tab_by_date": "Nach Datum",
    "reminders_heading": "Mondwecker",
    "label_lunar_day_range": "Mondtag-Nummer (1–30)",
    "label_repeat_monthly": "Jeden Mondmonat wiederholen",
    "label_calendar_date": "Kalenderdatum",
    "label_reminder_text": "Notiztext",
    "placeholder_reminder_text": "Was an diesem Tag wichtig ist...",
    "label_every_month": "monatlich",
    "label_nearest": "Nächster",
    "label_select_date_preview": "Datum wählen, um Mondtag und Phase zu berechnen.",
    "label_phase_prefix": "Phase",
    "reminders_empty": "Noch keine Erinnerungen. Fügen Sie einen Mondwecker oder eine Datumsnotiz hinzu.",
    "card_calendar_kicker": "Mondkalender",
    "card_moon_sign_label": "Mondzeichen",
    "card_transition_label": "Mondtag-Wechsel um",
    "card_course_kicker": "Tageskurs",
    "card_day_of_prefix": "Tag",
    "card_day_of_sep": "von",
    "card_focus_kicker": "Fokus & Mondtag",
    "card_weekly_bg": "Wochenhintergrund",
    "card_exact_peak_badge": "exakter Höhepunkt",
    "card_moon_in_sign": "Mond im Zeichen",
    "card_sign_mood": "Zeichen-Ton",
    "card_recovery_kicker": "Modus & Erholung",
    "valence_positive": "Günstig",
    "valence_warning": "Achtung",
    "valence_neutral": "Akzent",
    "today_course_heading": "Tageskurs",
    "today_guest_heading": "Mond-Tageskurs",
    "label_personal_resource": "Ihre Ressource",
    "label_calendar_backdrop": "Kalender-Hintergrund",
    "day_status_favorable": "Günstig",
    "day_status_caution": "Mit Vorsicht",
    "day_status_refrain": "Besser zurückhalten",
    "slot_morning": "Morgen",
    "slot_day": "Tag",
    "slot_evening": "Abend",
    "slot_morning_title": "🌅 Morgen",
    "slot_day_title": "☀️ Tag",
    "slot_evening_title": "🌙 Abend",
    "settings_rhythm_title": "Persönlicher Rhythmus",
    "settings_rhythm_desc": "Ohne Geburtsdatum arbeitet die App als präziser Mondkalender. Geben Sie Ihr Geburtsdatum für persönliche Phasen und Aspekte ein.",
    "label_birth_date": "Geburtsdatum",
    "placeholder_birth_date": "TT.MM.JJJJ",
    "btn_pick_date": "Datum im Kalender wählen",
    "label_birth_time": "Geburtszeit",
    "title_birth_time": "Geburtszeit (optional, Standard 12:00)",
    "label_birth_lunar_age": "Mondalter bei Geburt",
    "settings_notif_title": "Meldungen & Checkpoints",
    "settings_notif_daily_desc": "Tagesberichte",
    "settings_notif_alarm_push": "Popup-Benachrichtigungen für Mondwecker",
    "settings_voice_title": "Vorlesestimme (Speech Synthesis)",
    "settings_voice_desc": "Die Sprache wird automatisch nach meta.lang des aktiven Wörterbuchs gewählt, oder wählen Sie eine Stimme:",
    "label_voice_auto": "Auto",
    "settings_dict_title": "Wörterbücher & Themen",
    "label_builtin_lang": "Sprache von Oberfläche & Basiswörterbuch",
    "dict_mode_default": "Basiswörterbuch",
    "dict_mode_custom": "Benutzerdefiniert",
    "label_dict_lang": "Sprache",
    "dict_ai_hint": "Sie können die JSON-Basisvorlage herunterladen und jedes KI-Modell bitten, sie in Ihre Wunschsprache zu übersetzen (z. B. Italienisch mit \"it-IT\" in meta.lang) oder im gewünschten Stil (Autonavi, Seelotse, Raumschiff) umzuschreiben – bei strikter Beibehaltung der Schlüsselstruktur.",
    "btn_copy_raw_data": "Raw Data kopieren (JSON)",
    "raw_data_copied_toast": "Raw Data kopiert ✓",
    "msg_upload_custom_first": "Bitte laden Sie zuerst ein eigenes .json-Wörterbuch hoch.",
    "msg_dict_loaded": "Wörterbuch geladen",
    "msg_dict_error": "Dateifehler",
    "reminder_prefix_tts": "Erinnerung für den aktuellen Mondtag.",
    "harmony_bridge_minimum": "Das äußere Umfeld bringt Dynamik, doch Ihr persönlicher Takt steht auf Erholung — nutzen Sie diesen Impuls nur zum ruhigen Abschließen laufender Dinge ohne Neustarts.",
    "harmony_bridge_decline": "Das äußere Umfeld bringt Dynamik, doch Ihr persönlicher Takt geht in einen ruhigen Abstieg — lenken Sie den Schwung auf den Abschluss begonnener Aufgaben und Ordnung.",
    "ai_forecast_title": "Astrologische Tagesprognose",
    "settings_location_title": "Beobachter-Koordinaten",
    "settings_location_desc": "Standardmäßig werden die Koordinaten ohne GPS aus Ihrer Zeitzone abgeleitet. Geben Sie Breiten- und Längengrad manuell für exakten Mondauf- und -untergang ein.",
    "label_observer_lat": "Breitengrad",
    "placeholder_observer_lat": "Breite (z. B. 52.52)",
    "label_observer_lon": "Längengrad",
    "placeholder_observer_lon": "Länge (z. B. 13.41)",
    "location_status_auto": "Aktiv: Auto",
    "location_status_manual": "Aktiv: Manuell",
    "location_status_incomplete": "Bitte beide Werte eingeben: Breite (−90…90) und Länge (−180…180).",
    "btn_import_reminders": "Laden",
    "btn_export_reminders": "Speichern",
    "msg_reminders_export_empty": "Die Erinnerungsliste ist leer — nichts zu speichern.",
    "msg_reminders_exported": "In Downloads gespeichert",
    "msg_reminders_exported_docs": "In Dokumente gespeichert",
    "msg_reminders_exported_shared": "Datei geteilt",
    "msg_reminders_export_cancelled": "Speichern abgebrochen",
    "msg_reminders_export_clipboard": ".ics in Zwischenablage kopiert. Text unten sichern oder zum Wiederherstellen einfügen",
    "msg_reminders_exported_external": "Im App-Ordner gespeichert (Files)",
    "reminders_backup_toggle": "Text-Backup / .ics einfügen",
    "reminders_backup_title": "Backup (.ics / .json)",
    "reminders_backup_placeholder": "Exportiertes .ics erscheint hier, oder .ics / .json-Text zum Wiederherstellen einfügen...",
    "btn_copy_backup": "Kopieren",
    "btn_import_from_text": "Aus Text laden",
    "msg_backup_copied": ".ics-Text in Zwischenablage kopiert",
    "msg_reminders_imported": "Erinnerungen hinzugefügt",
    "msg_reminders_skipped_dups": "Duplikate übersprungen",
    "msg_reminders_none_added": "Keine neuen Erinnerungen gefunden (bereits vorhanden).",
    "msg_reminders_import_empty": "Keine gültigen Erinnerungen in der Datei gefunden (.ics / .json).",
    "msg_reminders_import_error": "Dateiimport-Fehler",
    "hero_personal_trend_title": "Persönlicher Rhythmusvektor",
    "settings_appearance_title": "Erscheinungsbild",
    "label_theme": "Design",
    "theme_dark": "Dunkel",
    "theme_light": "Hell",
    "label_font_size": "Schriftgröße",
    "font_size_normal": "Normal",
    "font_size_large": "Größer",
    "font_size_xlarge": "Sehr groß",
    "settings_help_title": "Hilfe & Theorie",
    "settings_help_desc": "Interaktiver Leitfaden: Mondbahn und Phasen, Auf- und Untergang, Mondtag-Versatz, persönlicher Rhythmus und wissenschaftlicher Hinweis.",
    "btn_open_help": "Hilfe öffnen",
    "solar_day_unit": "Std.",
    "solar_day_short": "Tag",
    "solar_night_short": "Nacht",
    "solar_polar_day_label": "Polartag",
    "solar_polar_night_short": "Polarnacht",
    "solar_transit_label": "Süd",
    "hero_sun_aria": "Sonnenmodus: tippen zum Wechseln zum Mond",
    "hero_toggle_to_solar_title": "Tippen für Sonnenmodus",
    "hero_solar_share_title": "Tageslichtanteil und Sonnenhöhe",
    "solar_trend_growing": "Tageslicht nimmt zu",
    "solar_trend_shrinking": "Tageslicht nimmt ab",
    "solar_trend_solstice_max": "Tageslicht-Maximum",
    "solar_trend_solstice_min": "Tageslicht-Minimum",
    "settings_support_title": "Projekt & Unterstützung",
    "settings_support_desc": "Der Quellcode ist auf GitHub verfügbar. Wenn Ihnen die App im Alltag hilft, können Sie die Weiterentwicklung unterstützen.",
    "btn_github_repo": "GitHub-Repository",
    "support_donate_label": "Projekt unterstützen",
    "support_copied_toast": "Kopiert ✓"
  },
  "help": {
    "page_title": "Dynamisches Handbuch · Lunar Rhythm Navigator",
    "back_btn": "← Zurück zur App",
    "footer_lead": "Dynamische Himmelsmechanik: Die Tabs oben zeigen, wie sich der Mond auf seiner Bahn und relativ zum Horizont bewegt.",
    "guest_mode": "Gastmodus",
    "coords_manual": "Koord.",
    "coords_auto": "Auto-Zeitzone",
    "tab_orbital": "Umlaufbahn & Phasen",
    "tab_horizon": "Auf- & Untergang",
    "tab_days": "Mondtage",
    "tab_personal": "Persönlicher Rhythmus",
    "tab_profiles": "Rhythmus-Profile",
    "tab_science": "Wissenschaft",
    "orbital_title": "Geometrie des Systems",
    "orbital_desc": "Die Sonne steht links fest, die Erde im Zentrum. Der Mond kreist gegen den Uhrzeigersinn. Elongation ist der Winkel zwischen den Richtungen zu Sonne und Mond.",
    "label_illum": "Beleuchtung:",
    "label_trend": "Trend:",
    "trend_waxing": "↗ zunehmend",
    "trend_waning": "↘ abnehmend",
    "trend_extremum": "Extremum",
    "label_elongation": "Elongation (Winkel)",
    "btn_play": "▶ Zyklus animieren",
    "btn_pause": "⏸ Pause",
    "btn_today": "Heute",
    "phase_sky_new_moon": "Nahe der Sonne, unsichtbar",
    "phase_sky_waxing_crescent": "Abends im Westen",
    "phase_sky_first_quarter": "Aufgang mittags, Untergang mitternachts",
    "phase_sky_waxing_gibbous": "Nachmittags und fast die ganze Nacht",
    "phase_sky_full_moon": "Aufgang bei Sonnenuntergang, Untergang bei Sonnenaufgang",
    "phase_sky_waning_gibbous": "Nachts und morgens im Westen",
    "phase_sky_last_quarter": "Aufgang mitternachts, Untergang mittags",
    "phase_sky_waning_crescent": "Morgens im Osten",
    "canvas_sun": "SONNE",
    "canvas_earth": "ERDE",
    "canvas_moon": "Mond",
    "horizon_title": "Blick von der Erde für Ihre Koordinaten",
    "horizon_desc": "Verschieben Sie die Tageszeit, um zu sehen, wie der Mond im Osten (links) aufgeht, über Süden zieht und im Westen (rechts) untergeht. Die Bögen folgen der realen Geometrie für die Breite des Beobachters.",
    "label_time_of_day": "Tageszeit",
    "label_phase_angle": "Phase (Elongation)",
    "horizon_today_prefix": "Heute",
    "horizon_rise_word": "Aufgang",
    "horizon_set_word": "Untergang",
    "horizon_tip": "Der Mond geht jeden Tag auf und unter, jedoch zu wechselnden Zeiten. Bei 0° (Neumond) geht er mit der Sonne auf und bleibt unsichtbar. Bei 180° (Vollmond) geht er bei Sonnenuntergang auf.",
    "canvas_east": "OSTEN",
    "canvas_west": "WESTEN",
    "canvas_moon_below": "Mond unter dem Horizont",
    "days_title": "Kalendertag vs. Mondtag",
    "days_desc": "Im Mittel geht der Mond etwa 50 Minuten später auf, doch die Verschiebung ist nicht konstant: sie reicht von wenigen Minuten bis anderthalb Stunden. Lunartage (Mondaufgang bis Mondaufgang) decken sich deshalb nicht mit Kalendertagen (Mitternacht bis Mitternacht). Der 1. Lunartag beginnt beim Neumond und endet beim ersten Mondaufgang, ist also kurz.",
    "label_cycle_day": "Zyklustag (ab Neumond)",
    "days_hint": "Balken = Lunartag von Mondaufgang zu Mondaufgang, Punkt = Mondaufgang, Raute = Neumond. Die Kalenderachse unten zeigt, in welchen Kalendertagen gar kein Mondaufgang liegt oder gleich zwei. Die Länge eines Lunartags schwankt zwischen 23 und 26 Stunden, deshalb ist auch die Verschiebung des Mondaufgangs nicht konstant.",
    "canvas_day_prefix": "Tag",
    "canvas_rise_prefix": "Aufg. ~",
    "personal_title": "Zwei Bezugspunkte",
    "personal_desc": "Der Mond am Himmel ist für alle gleich, doch Ihr Geburtsdatum setzt eine persönliche Verschiebung im 29,5-Tage-Zyklus. Unten sehen Sie Ihre Kurve und die Gegenphase.",
    "personal_profile_prefix": "Dein Profil",
    "personal_demo_note": "Gastmodus (kein Geburtsdatum — Demo-Wert 5.0 T.)",
    "label_current_cycle_day": "Aktueller Zyklustag",
    "label_user_a_birth": "Du (Mondalter bei Geburt)",
    "label_user_a_demo": "Nutzer A (Mondalter bei Geburt)",
    "label_user_b_anti": "Nutzer B (Gegenphase)",
    "canvas_user_a_short": "A",
    "canvas_user_b_short": "B",
    "canvas_cycle_days": "Zyklustage",
    "profiles_title": "4 Basis-Rhythmusprofile",
    "profiles_desc": "Anhand des Mondalters bei der Geburt ordnet die Engine eines von vier Basisprofilen zu:",
    "your_profile_badge": "Dein Profil",
    "profile_range_async": "≤ 3,7 oder ≥ 25,8 T. (Neumond)",
    "profile_range_waxing": "3,7 – 11,1 T. (Zunehmender Mond)",
    "profile_range_sync": "11,1 – 18,5 T. (Vollmond)",
    "profile_range_waning": "> 18,5 T. (Abnehmender Mond)",
    "modes_title": "5 angewandte Tagesmodi",
    "modes_desc": "Für die tägliche Kommunikations- und Arbeitsdynamik bewertet das Modell Transitaspekte in fünf Praxismodi:",
    "modes_decay_note": "Eine 2-Tage-Abklinghistorie mit Wiederholungsstrafe verhindert, dass Hinweise tagelang auf demselben Modus stehen bleiben.",
    "practice_title": "Praktische Arbeit mit dieser App",
    "practice_step1_title": "1. Himmelsphase und persönlichen Zyklus trennen",
    "practice_step1_body": "Nutzen Sie die echte Mondphase für den Schlafschutz: 3–5 Nächte vor Vollmond abends Licht dimmen und späten Koffein- sowie Bildschirmkonsum begrenzen. Nutzen Sie Ihre persönliche Phase (Anlauf → Peak → Abstieg → Minimum) für Aufgaben: Starts auf Anlauf und Peak, Routine und Abschlüsse auf Abstieg, Erholung auf Minimum.",
    "practice_step2_title": "2. Mondtage nach Tagesfenstern lesen",
    "practice_step2_body": "Verlassen Sie sich nicht blind auf eine Tagesnummer — prüfen Sie die Übergangszeit (Mondaufgang) und welches Zeitfenster (09:00, 14:00, 20:00) betroffen ist. Standardmäßig werden Koordinaten ohne GPS aus Ihrer Zeitzone geschätzt; exakte Werte lassen sich in den Einstellungen eintragen.",
    "practice_step3_title": "3. Modell 1–2 Monate kalibrieren",
    "practice_step3_body": "Die App liefert eine strukturierte Rhythmus-Hypothese, kein starres Naturgesetz. Notieren Sie über ein bis zwei Mondmonate Tage hoher Klarheit, Müdigkeit und Schlafqualität, um die Treffsicherheit für Ihren Alltag zu prüfen.",
    "science_ok_badge": "Durch Studien belegt",
    "science_light_title": "Nachtlicht und zirkadiane Rhythmen",
    "science_light_intro": "Vor dem elektrischen Licht war Mondlicht die einzige helle nächtliche Lichtquelle. Die Physiologie reagiert direkt auf Licht:",
    "science_light_p1": "3–5 Nächte vor Vollmond leuchtet der helle Mond früh abends und verschiebt das Einschlafen nach hinten.",
    "science_light_p2": "Studien zeigen im Schnitt 20–25 Minuten weniger Schlaf und geringeren Tiefschlafanteil (in Städten oft durch Kunstlicht und Bildschirme überdeckt).",
    "science_light_sources": "Quellen: Casiraghi et al., Science Advances (2021); Cajochen et al., Current Biology (2013).",
    "science_myth_badge": "Verbreiteter Mythos",
    "science_gravity_title": "Gravitation und «Körpergezeiten»",
    "science_gravity_p1": "Ozeangezeiten entstehen nur durch die planetare Ausdehnung großer Wassermassen.",
    "science_gravity_p2": "Im Maßstab eines menschlichen Körpers ist der Gezeitengradient des Mondes winzig — schwächer als die Anziehung eines nahen Gebäudes oder Autos.",
    "science_gravity_conclusion": "Fazit: Der physische Faktor ist Nachtlicht und Schlafrhythmus, nicht «Wasseranziehung».",
    "science_disclaimer_title": "Ehrlicher Hinweis zum Geburtsdatum",
    "science_disclaimer_body": "In der modernen Biologie gibt es keinen Beleg dafür, dass die Mondphase bei der Geburt Hormon- oder Energiezyklen Erwachsener programmiert. Hier dient das Geburtsdatum als praktischer Taktanker im 29,5-Tage-Plan, nicht als physikalisches Gesetz.",
    "canvas_south": "SÜD",
    "canvas_moon_hidden": "Mond (unsichtbar)",
    "canvas_culmination_prefix": "Süd ~",
    "canvas_set_prefix": "Unterg. ~",
    "canvas_timeline_24h": "Über Horizont (24 Std.)",
    "label_earth_view": "Erdansicht",
    "canvas_rise_exact_prefix": "Aufg. ",
    "canvas_culmination_exact_prefix": "Süd ",
    "canvas_set_exact_prefix": "Unterg. ",
    "canvas_sun_below": "Sonne unter Horizont",
    "horizon_live_mode": "Live (heute)",
    "horizon_model_mode": "Modell ~",
    "horizon_sun_label": "Sonne",
    "horizon_date_label": "Beobachtungsdatum",
    "horizon_fact_label": "Fakt",
    "horizon_next_event_label": "Nächstes Ereignis",
    "horizon_after_label": "in",
    "horizon_before_label": "vor",
    "horizon_no_more_events": "heute keine weiteren Ereignisse",
    "horizon_transit_word": "Kulmination",
    "horizon_below": "unter dem Horizont",
    "horizon_behind": "hinter uns (Norden)",
    "horizon_elong_word": "Elongation",
    "horizon_drift_title": "Tägliche Verschiebung des Mondaufgangs, Min/Tag",
    "horizon_phase_hint": "Der Phasenregler wählt das nächstgelegene Datum mit dieser Elongation: Der Himmel wird immer nach echten Daten gezeigt, ein gemitteltes Modell gibt es hier nicht.",
    "horizon_drift_tomorrow": "Morgen",
    "horizon_drift_avg": "Mittel",
    "horizon_drift_range": "Spanne",
    "horizon_drift_unit": "Min/Tag",
    "horizon_lunar_link_label": "Lunartag",
    "horizon_lunar_link_note": "Ein Lunartag endet beim nächsten Mondaufgang.",
    "coord_north": "N",
    "coord_east": "O",
    "dur_h": "Std",
    "dur_m": "Min",
    "days_summary_label": "Lunartag",
    "days_from_label": "von",
    "days_to_label": "bis",
    "days_duration_label": "Dauer",
    "days_step_label": "Verschiebung pro Tag",
    "days_today_prefix": "Heute",
    "days_today_is_selected": "Dieser Tag ist oben dargestellt.",
    "days_today_other": "Schieben Sie den Regler darauf.",
    "days_explain_label": "Verschiebung pro Tag in diesem Zyklus",
    "days_explain_avg": "im Mittel",
    "days_explain_cause": "Der Mond umkreist die Erde ungleichförmig (am Perigäum schneller), und seine Deklination ändert sich ungleichförmig: an den Stillständen bleibt der Mondaufgang fast stehen und springt dann anderthalb Stunden vor.",
    "days_no_rise": "kein Aufgang",
    "days_two_rises": "2 Aufgänge",
    "days_today": "heute",
    "days_legend": "Balken = Lunartag, Punkt = Mondaufgang, Raute = Neumond",
    "days_day_word": "Tag",
    "horizon_later_than": "nach der Sonne",
    "horizon_earlier_than": "vor der Sonne",
    "horizon_tomorrow_word": "morgen",
    "days_new_moon": "Neumond",
    "horizon_twilight_label": "Dämmerung (Sonne unter −6°)",
    "horizon_next_rise": "Nächster Mondaufgang:",
    "canvas_you": "Sie",
    "horizon_col_rise": "Aufgang",
    "horizon_col_culm": "Kulmination",
    "horizon_col_set": "Untergang",
    "horizon_summary_card_title": "Übersicht für das gewählte Datum",
    "horizon_next_card_title": "Nächstes Ereignis",
    "horizon_lunar_card_title": "Bezug zum Lunartag",
    "horizon_tip_card_title": "Vergleich von Sonne und Mond",
    "horizon_drift_tomorrow_label": "Morgen",
    "horizon_drift_avg_label": "7-Tage-Mittel",
    "horizon_drift_range_label": "Spanne",
    "days_selected_card_title": "Ausgewählter Lunartag",
    "days_today_card_title": "Aktueller Lunartag",
    "days_explain_card_title": "Warum die Verschiebung im Zyklus schwankt",
    "days_selected_badge": "Im Diagramm",
    "phase_short_new_moon": "neumond",
    "phase_short_waxing_crescent": "zunehmende sichel",
    "phase_short_first_quarter": "erstes viertel",
    "phase_short_waxing_gibbous": "zunehmend",
    "phase_short_full_moon": "vollmond",
    "phase_short_waning_gibbous": "abnehmend",
    "phase_short_last_quarter": "letztes viertel",
    "phase_short_waning_crescent": "abnehmende sichel",
    "horizon_diff_prefix": "",
    "days_legend_bar": "Lunartag",
    "days_legend_rise": "Aufgang",
    "days_selected_heading_tpl": "Ausgewählter {day}. Lunartag",
    "days_today_heading_tpl": "Heute: {day}. Lunartag"
  }
};
