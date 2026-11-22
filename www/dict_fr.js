export const DICT_FR = {
  "meta": {
    "id": "base_default_fr",
    "lang": "fr-FR",
    "name": "Profil de Base (Étendu v2.0)",
    "version": "2.0.0",
    "author": "System Core",
    "description": "Dictionnaire étendu de productivité, de rythmes d'activité et de scénarios quotidiens sans métaphores ni ésotérisme.",
    "tts_prefix": "Synthèse du rythme du jour."
  },
  "profiles": {
    "profile_async": {
      "title": "Rythme Introverti",
      "short_desc": "Pic de concentration dans un cadre calme",
      "full_desc": "Votre productivité maximale survient durant la phase de renouveau du cycle, lorsque le bruit informationnel externe est minimal."
    },
    "profile_waxing": {
      "title": "Rythme d'Accumulation",
      "short_desc": "Montée en puissance progressive et croissance",
      "full_desc": "Vous atteignez votre meilleure efficacité dans la première moitié du cycle en développant rythme et ressources."
    },
    "profile_sync": {
      "title": "Rythme Extraverti",
      "short_desc": "Pic d'activité aligné sur l'élan extérieur",
      "full_desc": "Votre énergie personnelle coïncide avec le pic du cycle externe, offrant un élan maximal pour les tâches visibles."
    },
    "profile_waning": {
      "title": "Rythme d'Optimisation",
      "short_desc": "Priorité à l'analyse et à la clôture",
      "full_desc": "Votre plus grande clarté apparaît dans la seconde moitié du cycle, idéale pour structurer et finaliser les acquis."
    }
  },
  "phases": {
    "phase_peak": {
      "title": "Ressource Maximale",
      "badge": "Pic",
      "tempo": "Rythme élevé",
      "action": "Négociations clés, lancements de projets, décisions nettes",
      "tts_summary": "Aujourd'hui est la phase de ressource maximale. Moment idéal pour les priorités clés et l'action décisive."
    },
    "phase_decline": {
      "title": "Rythme Calme",
      "badge": "Déclin",
      "tempo": "Rythme modéré",
      "action": "Finalisation des tâches, analyse, documentation",
      "tts_summary": "Aujourd'hui suit un rythme calme. Réduisez la cadence, consignez les résultats et bouclez les dossiers en cours."
    },
    "phase_minimum": {
      "title": "Mode Repos",
      "badge": "Minimum",
      "tempo": "Rythme bas",
      "action": "Récupération, routine légère, éviter la surcharge",
      "tts_summary": "Aujourd'hui est en mode repos. Évitez les nouveaux démarrages exigeants et privilégiez le sommeil et la récupération."
    },
    "phase_rise": {
      "title": "Montée en Cadence",
      "badge": "Essor",
      "tempo": "Rythme croissant",
      "action": "Planification, collecte d'informations, préparation",
      "tts_summary": "Aujourd'hui est la phase d'essor. Bon créneau pour planifier, réunir des données et entrer doucement dans le rythme."
    }
  },
  "phase_day_notes": {
    "phase_peak": {
      "start": "Début du pic : passez les projets prioritaires en phase active et consolidez les accords.",
      "middle": "Milieu du pic : ressource au plus haut — traitez les tâches complexes et prenez les responsabilités clés.",
      "end": "Fin du pic : transformez l'élan en résultats concrets sans ajouter d'engagements de dernière minute."
    },
    "phase_decline": {
      "start": "Début du déclin : passez du lancement de nouveautés au suivi et au peaufinage de l'existant.",
      "middle": "Milieu du déclin : équilibre optimal de concentration calme pour bilans, analyses et rangement.",
      "end": "Fin du déclin : bouclez les derniers détails, dressez un bilan intermédiaire et allégez la charge."
    },
    "phase_minimum": {
      "start": "Début du minimum : supprimez les réunions superflues, gardez la routine de base et préservez votre attention.",
      "middle": "Milieu du minimum : fenêtre calme de réinitialisation. Libérez l'agenda et multipliez les pauses.",
      "end": "Fin du minimum : l'énergie revient — esquissez sans hâte les premières étapes de la semaine à venir."
    },
    "phase_rise": {
      "start": "Début de l'essor : passez du repos à la structure, testez vos idées et collectez les données manquantes.",
      "middle": "Milieu de l'essor : le tonus augmente régulièrement — élargissez vos contacts et l'action pratique.",
      "end": "Fin de l'essor : atteignez la pleine capacité opérationnelle et préparez les décisions de la phase suivante."
    }
  },
  "roles": {
    "role_agile": {
      "title": "Mode Sprint",
      "hint": "Priorité aux échanges rapides, tâches courtes et agilité."
    },
    "role_drive": {
      "title": "Mode Percée",
      "hint": "Initiative personnelle, élan direct et décisions rapides."
    },
    "role_diplomat": {
      "title": "Mode Dialogue",
      "hint": "Réunions, partenariats, recherche de compromis et travail d'équipe."
    },
    "role_heavy": {
      "title": "Mode Haute Responsabilité",
      "hint": "Travail méthodique, règles, échéances et livrables majeurs."
    },
    "role_autonomous": {
      "title": "Mode Autonome",
      "hint": "Travail au calme, planification et gestion économe de l'énergie."
    }
  },
  "age_classes": {
    "age_18_25": {
      "title": "Haute Dynamique",
      "modifier_hint": "Récupération rapide. Prenez des pauses à temps pour éviter l'épuisement."
    },
    "age_26_40": {
      "title": "Équilibre d'Endurance",
      "modifier_hint": "Forte sollicitation sociale. Répartissez vos efforts régulièrement sur la journée."
    },
    "age_41_55": {
      "title": "Précision des Priorités",
      "modifier_hint": "Appuyez-vous sur l'expérience. Privilégiez les actions ciblées à la précipitation et protégez le repos."
    },
    "age_55_plus": {
      "title": "Rythme Confortable",
      "modifier_hint": "La qualité de vie prime. Rythme fluide sans à-coups et gestion attentive de votre énergie."
    }
  },
  "actors": {
    "actor_moon": {
      "title": "Humeur et Adaptation",
      "domain": "bien-être, affaires courantes, souplesse dans les échanges"
    },
    "actor_mercury": {
      "title": "Collègues, Messages et Données",
      "domain": "appels, documents, apprentissage, courts trajets"
    },
    "actor_venus": {
      "title": "Proches, Partenaires et Confort",
      "domain": "relations personnelles, accords, finances, détente"
    },
    "actor_mars": {
      "title": "Tâches Actives et Compétition",
      "domain": "initiative, débats, activité physique, rapidité"
    },
    "actor_jupiter": {
      "title": "Direction, Mentors et Envergure",
      "domain": "carrière, grands projets, formation, croissance stratégique"
    },
    "actor_saturn": {
      "title": "Règles, Échéances et Contrôle",
      "domain": "responsabilité, ordre, vérifications, respect du planning"
    },
    "actor_outer": {
      "title": "Événements Externes et Changements",
      "domain": "changements de plans, imprévus, refonte en profondeur"
    }
  },
  "moon_trends": {
    "new": "Nouvelle Lune",
    "waxing": "Lune Croissante",
    "full": "Pleine Lune",
    "waning": "Lune Décroissante"
  },
  "moon_phase_names": {
    "new_moon": "Nouvelle Lune",
    "waxing_crescent": "Premier Croissant",
    "first_quarter": "Premier Quartier",
    "waxing_gibbous": "Lune Gibbeuse Croissante",
    "full_moon": "Pleine Lune",
    "waning_gibbous": "Lune Gibbeuse Décroissante",
    "last_quarter": "Dernier Quartier",
    "waning_crescent": "Dernier Croissant"
  },
  "zodiac_names": {
    "Овен": "Bélier",
    "Телец": "Taureau",
    "Близнецы": "Gémeaux",
    "Рак": "Cancer",
    "Лев": "Lion",
    "Дева": "Vierge",
    "Весы": "Balance",
    "Скорпион": "Scorpion",
    "Стрелец": "Sagittaire",
    "Козерог": "Capricorne",
    "Водолей": "Verseau",
    "Рыбы": "Poissons"
  },
  "zodiac_hints": {
    "Овен": "les décisions rapides, l'initiative personnelle et le lancement de tâches",
    "Телец": "le sens pratique, les finances et un rythme posé",
    "Близнецы": "les négociations, les messages et l'échange d'informations",
    "Рак": "le confort, la vie familiale et l'équilibre intérieur",
    "Лев": "les présentations, le leadership et les démarches visibles",
    "Дева": "l'ordre, l'analyse, les dossiers et le travail de précision",
    "Весы": "le partenariat, la diplomatie et la recherche de compromis",
    "Скорпион": "l'analyse approfondie, la stratégie et la gestion des ressources",
    "Стрелец": "la planification d'envergure, l'étude et les nouveaux horizons",
    "Козерог": "la discipline, les délais, la structure et les tâches méthodiques",
    "Водолей": "les idées neuves, le travail d'équipe et le renouveau des méthodes",
    "Рыбы": "les tâches créatives, la réflexion et un rythme ménagé"
  },
  "lunar_days": {
    "1": "Jour de planification stratégique. Formulez vos grands objectifs du mois sans précipiter les lancements.",
    "2": "Jour d'accumulation de ressources et de préparation pratique. Vérifiez budgets, listes et outils.",
    "3": "Jour de départ énergique. Passez de la réflexion à l'action concrète et affirmez vos priorités.",
    "4": "Jour de décisions mesurées et d'évaluation des risques. Confrontez vos plans au réel et évitez l'impulsivité.",
    "5": "Jour de consolidation régulière. Peaufinez l'existant, tenez parole et gardez le cap choisi.",
    "6": "Jour de communication constructive et de partage d'idées. Bon créneau pour accords souples et apprentissage.",
    "7": "Jour de parole claire et de formulations nettes. Présentez, négociez et consignez les accords par écrit.",
    "8": "Jour de renouveau et d'ajustement souple. Corrigez les routines datées et testez de nouveaux formats.",
    "9": "Jour de prudence face aux informations. Vérifiez les faits, évitez les conflits d'autrui et les choix à chaud.",
    "10": "Jour d'effort constructif durable. Orientez vos forces vers la famille, l'équipe et le long terme.",
    "11": "Jour de haute concentration et de volonté. Si vous attaquez une tâche difficile, menez-la à un palier net.",
    "12": "Jour de diplomatie et d'entraide. Un ton posé, l'écoute et le soutien aux collègues donnent le meilleur fruit.",
    "13": "Jour d'analyse d'expérience et de correction d'erreurs. Revenez sur d'anciennes idées et ajustez vos plans.",
    "14": "L'un des jours les plus productifs du cycle. Idéal pour les pas décisifs, lancements et grandes discussions.",
    "15": "Jour de maîtrise de soi sous forte intensité. Gardez le cap sur l'essentiel et tenez vos limites.",
    "16": "Jour d'équilibre et de rythme apaisé. Rangez votre bureau, classez vos fichiers et clarifiez vos pensées.",
    "17": "Jour d'échanges vivants et de coopération positive. Adapté au remue-méninges et aux tâches créatives.",
    "18": "Jour de retour objectif. Observez l'impact de vos habitudes sur l'entourage et ajustez les détails.",
    "19": "Jour d'hygiène informationnelle et de tri. Soldez les petites dettes, coupez le bruit et vérifiez les contrats.",
    "20": "Jour de clarté et de dépassement des doutes. Excellent pour un choix engagé et pour alléger ce qui freine.",
    "21": "Jour d'esprit d'équipe et d'initiatives audacieuses. Fédérez autour d'un but commun et avancez avec ambition.",
    "22": "Jour d'analyse profonde et d'étude. Traitez des données complexes et cherchez des solutions originales.",
    "23": "Jour de limites fermes et de désencombrement. Coupez le superflu et réglez les désaccords qui traînent.",
    "24": "Jour d'appui pratique solide. Traitez les réparations, l'organisation domestique et les processus de fond.",
    "25": "Jour d'observation posée et d'exactitude. Ne forcez rien — n'agissez que là où vous êtes pleinement sûr.",
    "26": "Jour d'économie d'attention et de calme. Évitez le bavardage, vérifiez les devis et protégez votre temps.",
    "27": "Jour de synthèse et d'ordre intuitif. Reliez les faits épars en une vue d'ensemble et bouclez vos recherches.",
    "28": "Jour de gratitude et de bilan lucide. Résumez les acquis du mois et terminez calmement les finitions.",
    "29": "Jour d'achèvement et de remise à zéro. Ne lancez rien de neuf — rangez, restez au calme et dormez tôt.",
    "30": "Jour de clôture douce avant le nouveau cycle. Allégez l'agenda, laissez passer les petits accrocs et reposez-vous."
  },
  "aspect_dynamics": {
    "applying": "L'influence monte en puissance — meilleur créneau pour anticiper.",
    "exact": "Le pic tombe aujourd'hui même — agissez avec une attention consciente.",
    "separating": "Le pic est passé et la situation se stabilise — figez les acquis."
  },
  "maneuvers": {
    "edge_conjunction": {
      "title": "Engagement total",
      "valence": "neutral",
      "advice": "Concentration maximale dans ce domaine. Agissez par étapes sans vous disperser."
    },
    "edge_sextile": {
      "title": "Opportunité favorable",
      "valence": "positive",
      "advice": "Créneau propice à l'initiative. Faites le premier pas dans un échange ou une tâche."
    },
    "edge_trine": {
      "title": "Accord fluide",
      "valence": "positive",
      "advice": "Les démarches avancent sans résistance. Profitez-en pour coordonner calmement."
    },
    "edge_square": {
      "title": "Risque de hâte et de friction",
      "valence": "warning",
      "advice": "Petits blocages possibles. Revérifiez les détails, ralentissez et évitez les débats vifs."
    },
    "edge_opposition": {
      "title": "Points de vue opposés, équilibre à trouver",
      "valence": "warning",
      "advice": "Préservez vos limites et cherchez un compromis sans vouloir imposer à tout prix."
    }
  },
  "actor_maneuver_matrix": {
    "actor_moon": {
      "edge_conjunction": "Votre ressenti intérieur est aiguisé. Adaptez votre programme à votre niveau réel d'énergie.",
      "edge_sextile": "Le quotidien s'ajuste avec souplesse. Bon moment pour réorganiser votre emploi du temps.",
      "edge_trine": "L'ambiance émotionnelle est stable et bienveillante. Les discussions familiales passent en douceur.",
      "edge_square": "L'humeur peut varier vite. Évitez les décisions hâtives et gardez une marge entre deux tâches.",
      "edge_opposition": "Vos besoins se heurtent aux attentes d'autrui. Posez vos limites calmement et cherchez l'équilibre."
    },
    "actor_mercury": {
      "edge_conjunction": "Messages, appels et idées culminent. Notez l'essentiel par écrit pour ne rien perdre dans la hâte.",
      "edge_sextile": "Bon créneau pour négociations courtes, démarches administratives et contacts ciblés.",
      "edge_trine": "Les idées s'expriment avec clarté. Parfait pour rédiger des bilans, étudier et relire des textes.",
      "edge_square": "Risque accru de coquilles, confusion de dates ou formules floues. Relisez avant d'envoyer.",
      "edge_opposition": "Des logiques opposées peuvent émerger. Posez des questions de clarification plutôt que débattre."
    },
    "actor_venus": {
      "edge_conjunction": "Confort, esthétique et relations chaleureuses priment. Accordez-vous du repos de qualité.",
      "edge_sextile": "Un geste attentionné ou un ton cordial noue vite le contact et débloque des conditions favorables.",
      "edge_trine": "Moment harmonieux pour achats réfléchis, accords budgétaires et confiance partagée.",
      "edge_square": "Insatisfaction possible ou achats impulsifs. Reportez les dépenses importantes à demain.",
      "edge_opposition": "Vos plans et ceux des proches peuvent diverger. Négociez en douceur sans reproches."
    },
    "actor_mars": {
      "edge_conjunction": "Forte poussée de détermination. Canalisez cet élan dans une tâche exigeante ou du sport.",
      "edge_sextile": "Une initiative audacieuse et un premier pas rapide paient vite. Passez l'appel décisif.",
      "edge_trine": "L'action est précise et efficace sans crispation. Idéal pour boucler ce qui demande du rythme.",
      "edge_square": "Risque élevé de brusquerie, hâte ou rivalité inutile. Respirez avant de répondre aux critiques.",
      "edge_opposition": "Des intérêts divergents exigent de la fermeté sans agressivité. Revenez aux faits et critères."
    },
    "actor_jupiter": {
      "edge_conjunction": "Des perspectives d'évolution et des appuis influents se dessinent. Présentez vos projets d'ampleur.",
      "edge_sextile": "Un conseil avisé ou un concours de circonstances élargit le cadre de votre projet actuel.",
      "edge_trine": "Contexte porteur pour entretiens de carrière, formation et croissance stratégique sans frein.",
      "edge_square": "Tendance à surestimer vos forces ou multiplier les promesses. Vérifiez délais et budgets.",
      "edge_opposition": "Vos ambitions rencontrent des règles externes ou la direction. Chiffrez concrètement l'envergure."
    },
    "actor_saturn": {
      "edge_conjunction": "Rigueur et fiabilité maximales exigées. Aujourd'hui la discipline l'emporte sur l'improvisation.",
      "edge_sextile": "Bonne journée pour renforcer l'ordre, valider des protocoles et gérer les contrôles.",
      "edge_trine": "Constance et expérience donnent un résultat solide. Suivez le plan étape par étape.",
      "edge_square": "Échéances strictes ou contrôles qualité probables. Respectez les règles sans raccourcis.",
      "edge_opposition": "Une pression ou critique révèle des points faibles du système. Corrigez-les posément."
    },
    "actor_outer": {
      "edge_conjunction": "Le contexte extérieur invite à revoir vite vos habitudes. L'adaptabilité vaut mieux que la rigidité.",
      "edge_sextile": "Une proposition inattendue ou un regard neuf ouvre une issue originale hors de la routine.",
      "edge_trine": "Des évolutions profondes de méthode se font naturellement. Bon moment pour moderniser vos outils.",
      "edge_square": "Imprévus de planning possibles. Gardez un plan B et restez serein.",
      "edge_opposition": "Les circonstances poussent à quitter des habitudes inefficaces. Gardez l'esprit clair."
    }
  },
  "lifestyle_tips": {
    "phase_peak": {
      "morning": [
        "Buvez un verre d'eau au réveil et notez vos trois priorités du jour.",
        "Exposez-vous dix minutes à la lumière du jour dans l'heure suivant le lever.",
        "Faites quelques étirements d'épaules et du dos avant d'ouvrir les messageries."
      ],
      "day": [
        "Hydratez-vous et étirez-vous brièvement toutes les quatre-vingt-dix minutes.",
        "Travaillez par blocs de quarante-cinq minutes suivis de cinq minutes de pause visuelle.",
        "Marchez dix minutes après le déjeuner pour garder l'esprit alerte."
      ],
      "evening": [
        "Terminez les tâches exigeantes au moins deux heures avant le coucher.",
        "Notez trois acquis du jour et refermez votre liste de travail avant le repos.",
        "Tamisez les lumières vives quatre-vingt-dix minutes avant de dormir."
      ]
    },
    "phase_decline": {
      "morning": [
        "Démarrez sans hâte : aérez la pièce et passez en revue les tâches ouvertes.",
        "Prenez un petit-déjeuner calme sans consulter actualités ni e-mails à table.",
        "Consacrez les trente premières minutes à une tâche simple à mener jusqu'au bout."
      ],
      "day": [
        "Bon moment pour ranger vos dossiers, traiter les courriels et conclure calmement.",
        "Surveillez votre posture et détendez la nuque à la mi-journée.",
        "Préférez l'eau pure ou une tisane tiède plutôt qu'un stimulant supplémentaire."
      ],
      "evening": [
        "Faites une promenade paisible sans téléphone.",
        "Prenez une douche tiède et dégagez votre bureau pour demain matin.",
        "Passez votre téléphone en mode silencieux une heure avant de dormir."
      ]
    },
    "phase_minimum": {
      "morning": [
        "Allégez la matinée : eau tiède et petit-déjeuner calme donnent un ton stable.",
        "Accordez-vous quinze minutes supplémentaires pour émerger avant d'ouvrir les messages.",
        "Pratiquez une respiration lente avec longue expiration pour relâcher la tension."
      ],
      "day": [
        "Gardez un rythme protecteur. Remplacez un café en trop par de l'eau ou une infusion.",
        "Allégez l'agenda des appels non essentiels et reposez vos yeux quinze minutes sans écran.",
        "Déjeunez au calme, loin des discussions professionnelles et des vidéos."
      ],
      "evening": [
        "Couchez-vous quarante minutes plus tôt et éloignez les écrans une heure avant le sommeil.",
        "Aérez la chambre et laissez le téléphone charger hors de portée de main.",
        "Faites quelques étirements doux des épaules et des lombaires avant de dormir."
      ]
    },
    "phase_rise": {
      "morning": [
        "Lumière matinale, verre d'eau et mobilisation douce facilitent la reprise du rythme.",
        "Parcourez votre plan hebdomadaire et choisissez une tâche clé avant midi.",
        "Faites cinq minutes d'échauffement articulaire et portez une tenue confortable."
      ],
      "day": [
        "Créneau favorable pour la recherche, l'apprentissage et la préparation de projets.",
        "Sortez prendre l'air quelques minutes à la mi-journée pour rafraîchir votre attention.",
        "Buvez par petites gorgées tout au long de la journée dans un espace bien éclairé."
      ],
      "evening": [
        "Une marche en plein air aide à structurer vos idées pour demain.",
        "Esquissez un plan court en trois points pour demain et clôturez la journée.",
        "Accordez trente minutes le soir à un loisir calme sans notifications."
      ]
    }
  },
  "day_themes": {
    "Овен": {
      "title": "Démarrage direct",
      "focus": "Faire un premier pas rapide compte plus aujourd'hui que trop peaufiner la préparation."
    },
    "Телец": {
      "title": "Rythme stable",
      "focus": "La régularité rapporte plus qu'un sprint brutal ; restez ancré sans vous disperser."
    },
    "Близнецы": {
      "title": "Flux d'informations",
      "focus": "Nombreux échanges et tâches courtes ; suivez de près vos petits engagements."
    },
    "Рак": {
      "title": "Attention ménagée",
      "focus": "Travail calme sans hâte ; priorité au foyer, aux proches et au confort personnel."
    },
    "Лев": {
      "title": "Apport personnel",
      "focus": "Vous réussissez là où votre initiative personnelle et un résultat visible comptent."
    },
    "Дева": {
      "title": "Précision et ordre",
      "focus": "Vérifications, listes et routine régulière payent mieux que la prise de risque."
    },
    "Весы": {
      "title": "Concertation",
      "focus": "Les choix clés dépendent d'un accord aujourd'hui ; cherchez un terrain d'entente."
    },
    "Скорпион": {
      "title": "Profondeur et maîtrise",
      "focus": "Propice à l'analyse de fond et aux ressources ; les réponses superficielles ne suffisent pas."
    },
    "Стрелец": {
      "title": "Élargissement",
      "focus": "Formation, déplacements et nouveaux contacts aident à élargir la portée du travail."
    },
    "Козерог": {
      "title": "Discipline",
      "focus": "Délais, structure et méthode pèsent plus lourd aujourd'hui que les élans spontanés."
    },
    "Водолей": {
      "title": "Approche neuve",
      "focus": "Les solutions originales et la souplesse fonctionnent mieux que les cadres rigides."
    },
    "Рыбы": {
      "title": "Calme créatif",
      "focus": "La réflexion posée et la récupération comptent plus aujourd'hui que de nouveaux engagements."
    }
  },
  "phase_variants": {
    "phase_peak": [
      "Aujourd'hui est la phase de ressource maximale : créneau idéal pour vos priorités et une action nette.",
      "Votre tonus est au plus haut : concentrez-vous sur l'essentiel sans disperser votre attention.",
      "Capacité de réalisation élevée aujourd'hui : avancez davantage tout en gardant le cap sur vos délais."
    ],
    "phase_decline": [
      "Rythme calme aujourd'hui : ralentissez la cadence, consignez les résultats et bouclez l'en-cours.",
      "Charge modérée conseillée : achever l'existant rapporte plus que lancer de nouveaux chantiers.",
      "Journée orientée clôture : vérifiez les détails et menez les dossiers actifs à leur terme."
    ],
    "phase_minimum": [
      "Mode repos aujourd'hui : évitez les démarrages exigeants et préservez du temps pour dormir et récupérer.",
      "Journée à ménager : vos réserves sont mesurées, allégez votre agenda du superflu.",
      "Mieux vaut simplifier le programme, garder une routine légère et vous reposer à temps."
    ],
    "phase_rise": [
      "Phase d'essor aujourd'hui : bon moment pour planifier, réunir des données et entrer doucement en action.",
      "Priorité à la préparation : collectez les faits et posez des bases solides pour la suite.",
      "L'élan monte progressivement : commencez par une structure étape par étape sans forcer la cadence."
    ]
  },
  "role_tone": {
    "role_agile": {
      "phase_peak": "Cadence sprint à plein régime : séquences courtes avec retour régulier sur l'objectif clé.",
      "phase_decline": "Rythme un peu vif : réglez les petits reliquats sans ouvrir de nouvelles pistes.",
      "phase_minimum": "Uniquement de courtes séries légères, sans précipitation ni pression inutile.",
      "phase_rise": "Prenez de l'élan par courtes touches sans éparpiller votre attention."
    },
    "role_drive": {
      "phase_peak": "Initiative maximale : prenez la priorité en main et faites avancer les décisions.",
      "phase_decline": "Initiative mesurée : posez un acte décisif et évitez les débats superflus.",
      "phase_minimum": "Initiative posée : petits pas sûrs sans à-coups ni surcharge.",
      "phase_rise": "L'initiative monte régulièrement : démarrez par un premier pas clair et accessible."
    },
    "role_diplomat": {
      "phase_peak": "Négociations actives : alignez les termes clés et fédérez autour du résultat.",
      "phase_decline": "Un échange ciblé et un recalage calme des derniers détails.",
      "phase_minimum": "Gardez la coordination brève et neutre, sans longues discussions.",
      "phase_rise": "Le dialogue prend forme : partagez vos plans et accordez les attentes tôt."
    },
    "role_heavy": {
      "phase_peak": "Travail méthodique à plein rendement : appuyez-vous sur listes, normes et échéances.",
      "phase_decline": "Bloc ordonné de révision : contrôlez les dossiers et bouclez les engagements.",
      "phase_minimum": "Maintenez un ordre calme dans l'existant sans ajouter de lourdes obligations.",
      "phase_rise": "Préparation structurée : organisez votre cadre et vérifiez les données de départ."
    },
    "role_autonomous": {
      "phase_peak": "Travail de fond en solo sur votre livrable majeur, sans interruptions.",
      "phase_decline": "Un créneau calme de concentration sans appels superflus.",
      "phase_minimum": "Rythme solitaire doux et posé avec un minimum de sollicitations.",
      "phase_rise": "Préparation silencieuse avant lancement et mise en ordre sereine des idées."
    }
  },
  "window_focus": {
    "morning": [
      "Fixez une priorité claire pour la journée",
      "Rassemblez les faits clés de votre tâche principale",
      "Relisez votre planning et retirez le superflu",
      "Réglez un petit point d'organisation simple"
    ],
    "day": [
      "Consacrez votre créneau central à la tâche prioritaire",
      "Traitez les appels et validations prévus",
      "Vérifiez documents, chiffres et délais en cours",
      "Avancez sur une tâche concrète demandant une action directe"
    ],
    "evening": [
      "Faites le bilan du jour et notez l'essentiel",
      "Clôturez les petits points ouverts et préparez demain",
      "Accordez un moment calme au foyer et aux proches",
      "Passez à un repos tranquille loin des écrans professionnels"
    ]
  },
  "ui_labels": {
    "app_title": "Rythme du Jour",
    "app_subtitle": "Lunar Rhythm Navigator",
    "lunar_day_short": "j.l.",
    "lunar_day_full": "jour lunaire",
    "moon_age_unit": "j.",
    "label_moonrise": "Lever",
    "label_moonset": "Coucher",
    "hero_moon_aria": "Phase de la Lune",
    "hero_illumination_title": "Illumination lunaire",
    "hero_trend_title": "Tendance du cycle lunaire",
    "hero_alarm_title": "Réveil lunaire",
    "hero_alarm_aria": "Couper et lire le réveil",
    "btn_copy_prompt_title": "Copier le prompt pour un modèle IA externe",
    "btn_copy_prompt_aria": "Prompt IA",
    "prompt_copied_toast": "Prompt IA copié",
    "btn_speak_briefing": "Lire la synthèse",
    "btn_stop_speech": "Arrêter la lecture",
    "nav_today": "Aujourd'hui",
    "nav_reminders": "Rappels",
    "nav_settings": "Paramètres",
    "label_today": "Aujourd'hui",
    "btn_back_today": "Aujourd'hui",
    "timeline_aria": "Frise des jours lunaires",
    "timeline_has_reminder": "Contient un rappel",
    "day_note_title": "Note",
    "day_note_placeholder": "Ajouter un rappel pour ce jour...",
    "btn_save": "Enregistrer",
    "btn_cancel": "Annuler",
    "btn_close": "Fermer",
    "btn_speak": "Lire",
    "btn_toggle_on": "Activer",
    "btn_toggle_off": "Couper",
    "btn_delete": "Supprimer",
    "btn_clear": "Effacer",
    "btn_test_voice": "Tester la voix",
    "btn_download_template": "Télécharger le modèle",
    "btn_upload_dict": "Importer un dictionnaire",
    "btn_add_reminder": "Ajouter un rappel",
    "tab_by_lunar_day": "Par jour lunaire",
    "tab_by_date": "Par date",
    "reminders_heading": "Réveil Lunaire",
    "label_lunar_day_range": "Numéro du jour lunaire (1–30)",
    "label_repeat_monthly": "Répéter chaque mois lunaire",
    "label_calendar_date": "Date du calendrier",
    "label_reminder_text": "Texte de la note",
    "placeholder_reminder_text": "Ce qu'il est important de faire ou retenir ce jour...",
    "label_every_month": "chaque mois",
    "label_nearest": "Prochain",
    "label_select_date_preview": "Choisissez une date pour calculer le jour lunaire et la phase.",
    "label_phase_prefix": "Phase",
    "reminders_empty": "Aucun rappel pour le moment. Ajoutez un réveil lunaire ou une note datée.",
    "card_calendar_kicker": "Calendrier Lunaire",
    "card_moon_sign_label": "Signe Lunaire",
    "card_transition_label": "Changement de jour lunaire à",
    "card_course_kicker": "Cap du Jour",
    "card_day_of_prefix": "jour",
    "card_day_of_sep": "sur",
    "card_focus_kicker": "Focus et Jour Lunaire",
    "card_weekly_bg": "Toile de Fond Hebdo",
    "card_exact_peak_badge": "pic exact",
    "card_moon_in_sign": "Lune en",
    "card_sign_mood": "Ton du signe",
    "card_recovery_kicker": "Rythme et Récupération",
    "valence_positive": "Favorable",
    "valence_warning": "Vigilance",
    "valence_neutral": "Accent",
    "today_course_heading": "Cap du jour",
    "today_guest_heading": "Cap lunaire du jour",
    "label_personal_resource": "Votre Ressource",
    "label_calendar_backdrop": "Contexte du Calendrier",
    "day_status_favorable": "Favorable",
    "day_status_caution": "Avec prudence",
    "day_status_refrain": "Mieux vaut s'abstenir",
    "slot_morning": "Matin",
    "slot_day": "Jour",
    "slot_evening": "Soir",
    "slot_morning_title": "🌅 Matin",
    "slot_day_title": "☀️ Jour",
    "slot_evening_title": "🌙 Soir",
    "settings_rhythm_title": "Rythme Personnel (État B)",
    "settings_rhythm_desc": "Sans date de naissance, l'extension agit comme un calendrier lunaire précis. Indiquez votre date de naissance pour calculer vos phases et aspects.",
    "label_birth_date": "Date de naissance",
    "placeholder_birth_date": "jj.mm.aaaa",
    "btn_pick_date": "Choisir une date dans le calendrier",
    "label_birth_time": "Heure de naissance",
    "title_birth_time": "Heure de naissance (facultative, 12:00 par défaut)",
    "label_birth_lunar_age": "âge lunaire natal",
    "settings_notif_title": "Notifications et jalons",
    "settings_notif_daily_desc": "Synthèses quotidiennes",
    "settings_notif_alarm_push": "Notifications contextuelles pour le réveil lunaire",
    "settings_voice_title": "Voix de lecture (Speech Synthesis)",
    "settings_voice_desc": "La langue est choisie automatiquement via meta.lang du dictionnaire actif, ou sélectionnez une voix :",
    "label_voice_auto": "Auto",
    "settings_dict_title": "Dictionnaires et thèmes",
    "label_builtin_lang": "Langue de l'interface et du dictionnaire de base",
    "dict_mode_default": "Dictionnaire de base",
    "dict_mode_custom": "Personnalisé",
    "label_dict_lang": "Langue",
    "dict_ai_hint": "Vous pouvez télécharger le modèle JSON de base et demander à n'importe quelle IA de le traduire dans votre langue (par exemple en italien en indiquant \"it-IT\" dans meta.lang) ou de le réécrire dans le style souhaité (GPS auto, pilote maritime, vaisseau spatial), tout en conservant strictement la structure des clés.",
    "btn_copy_raw_data": "Copier les Raw Data (JSON)",
    "raw_data_copied_toast": "Raw Data copiées ✓",
    "msg_upload_custom_first": "Veuillez d'abord importer un dictionnaire .json personnalisé.",
    "msg_dict_loaded": "Dictionnaire chargé",
    "msg_dict_error": "Erreur de fichier",
    "reminder_prefix_tts": "Rappel pour le jour lunaire en cours.",
    "harmony_bridge_minimum": "Le contexte extérieur apporte du dynamisme, mais votre rythme personnel vise la récupération — utilisez cet élan uniquement pour clore les tâches en cours sans nouveau départ.",
    "harmony_bridge_decline": "Le contexte extérieur apporte du dynamisme, mais votre rythme personnel est en déclin calme — orientez cet élan vers l'achèvement et la mise en ordre."
  }
};
