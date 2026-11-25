export const DICT_FR = {
  "meta": {
    "id": "base_default_fr",
    "lang": "fr-FR",
    "name": "Profil de Base",
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
    "btn_add_reminder": "Ajouter",
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
    "settings_rhythm_title": "Rythme Personnel",
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
    "harmony_bridge_decline": "Le contexte extérieur apporte du dynamisme, mais votre rythme personnel est en déclin calme — orientez cet élan vers l'achèvement et la mise en ordre.",
    "ai_forecast_title": "Prévision astrologique du jour",
    "settings_location_title": "Coordonnées de l'observateur",
    "settings_location_desc": "Par défaut, les coordonnées sont déduites de votre fuseau horaire sans GPS. Saisissez la latitude et la longitude manuellement pour le lever/coucher exact de la Lune.",
    "label_observer_lat": "Latitude",
    "placeholder_observer_lat": "Lat. (ex. 48.86)",
    "label_observer_lon": "Longitude",
    "placeholder_observer_lon": "Lon. (ex. 2.35)",
    "location_status_auto": "Actuel : Auto",
    "location_status_manual": "Actuel : Manuel",
    "location_status_incomplete": "Saisissez les deux valeurs : latitude (−90…90) et longitude (−180…180).",
    "btn_import_reminders": "Charger",
    "btn_export_reminders": "Sauver",
    "msg_reminders_export_empty": "La liste est vide — rien à enregistrer.",
    "msg_reminders_exported": "Enregistré dans Téléchargements",
    "msg_reminders_exported_docs": "Enregistré dans Documents",
    "msg_reminders_exported_shared": "Fichier partagé",
    "msg_reminders_export_cancelled": "Enregistrement annulé",
    "msg_reminders_export_clipboard": ".ics copié dans le presse-papiers. Enregistrez le texte ci-dessous ou collez-le pour restaurer",
    "msg_reminders_exported_external": "Enregistré dans le dossier de l’app (Files)",
    "reminders_backup_toggle": "Sauvegarde texte / coller .ics",
    "reminders_backup_title": "Sauvegarde (.ics / .json)",
    "reminders_backup_placeholder": "Le .ics exporté apparaît ici, ou collez du texte .ics / .json pour restaurer...",
    "btn_copy_backup": "Copier",
    "btn_import_from_text": "Charger depuis texte",
    "msg_backup_copied": "Texte .ics copié dans le presse-papiers",
    "msg_reminders_imported": "Rappels ajoutés",
    "msg_reminders_skipped_dups": "doublons ignorés",
    "msg_reminders_none_added": "Aucun nouveau rappel trouvé (tous existent déjà).",
    "msg_reminders_import_empty": "Aucun rappel valide trouvé dans le fichier (.ics / .json).",
    "msg_reminders_import_error": "Erreur lors du chargement",
    "hero_personal_trend_title": "Vecteur du rythme personnel",
    "settings_appearance_title": "Apparence",
    "label_theme": "Thème",
    "theme_dark": "Sombre",
    "theme_light": "Clair",
    "label_font_size": "Taille de police",
    "font_size_normal": "Normal",
    "font_size_large": "Grand",
    "font_size_xlarge": "Très grand",
    "settings_help_title": "Aide et théorie",
    "settings_help_desc": "Guide interactif : orbite et phases lunaires, lever et coucher, décalage des jours lunaires, rythme personnel et note scientifique.",
    "btn_open_help": "Ouvrir l’aide",
    "solar_day_unit": "h",
    "solar_day_short": "jour",
    "solar_night_short": "nuit",
    "solar_polar_day_label": "Jour polaire",
    "solar_polar_night_short": "nuit polaire",
    "solar_transit_label": "Midi",
    "hero_sun_aria": "Mode solaire : appuyer pour passer à la Lune",
    "hero_toggle_to_solar_title": "Appuyer pour passer en mode solaire",
    "hero_solar_share_title": "Part de jour et hauteur du Soleil",
    "solar_trend_growing": "La durée du jour augmente",
    "solar_trend_shrinking": "La durée du jour diminue",
    "solar_trend_solstice_max": "Maximum de lumière du jour",
    "solar_trend_solstice_min": "Minimum de lumière du jour"
  },
  "help": {
    "page_title": "Guide Dynamique · Lunar Rhythm Navigator",
    "back_btn": "← Retour à l’application",
    "footer_lead": "Mécanique céleste dynamique : les onglets ci-dessus montrent comment la Lune se déplace sur son orbite et par rapport à votre horizon.",
    "guest_mode": "Mode invité",
    "coords_manual": "Coords",
    "coords_auto": "Auto fuseau",
    "tab_orbital": "Orbite & phases",
    "tab_horizon": "Lever & coucher",
    "tab_days": "Jours lunaires",
    "tab_personal": "Rythme personnel",
    "tab_profiles": "Profils de rythme",
    "tab_science": "Science",
    "orbital_title": "Géométrie du système",
    "orbital_desc": "Le Soleil reste fixe à gauche et la Terre au centre. La Lune orbite dans le sens antihoraire. L’élongation est l’angle entre les directions du Soleil et de la Lune.",
    "label_illum": "Éclairement :",
    "label_trend": "Tendance :",
    "trend_waxing": "↗ croissante",
    "trend_waning": "↘ décroissante",
    "trend_extremum": "extrémum",
    "label_elongation": "Élongation (Angle)",
    "btn_play": "▶ Animer le cycle",
    "btn_pause": "⏸ Pause",
    "btn_today": "Aujourd’hui",
    "phase_sky_new_moon": "Près du Soleil, invisible",
    "phase_sky_waxing_crescent": "Le soir à l’ouest",
    "phase_sky_first_quarter": "Lever à midi, coucher à minuit",
    "phase_sky_waxing_gibbous": "L’après-midi et presque toute la nuit",
    "phase_sky_full_moon": "Lever au coucher du Soleil, coucher à l’aube",
    "phase_sky_waning_gibbous": "La nuit et le matin à l’ouest",
    "phase_sky_last_quarter": "Lever à minuit, coucher à midi",
    "phase_sky_waning_crescent": "Le matin à l’est",
    "canvas_sun": "SOLEIL",
    "canvas_earth": "TERRE",
    "canvas_moon": "Lune",
    "horizon_title": "Vue depuis la Terre pour vos coordonnées",
    "horizon_desc": "Déplacez l'heure pour voir la Lune se lever à l'est (gauche), passer au sud et se coucher à l'ouest (droite). Les arcs suivent la géométrie réelle pour la latitude de l'observateur.",
    "label_time_of_day": "Heure du jour",
    "label_phase_angle": "Phase (Élongation)",
    "horizon_today_prefix": "Aujourd’hui",
    "horizon_rise_word": "lever",
    "horizon_set_word": "coucher",
    "horizon_tip": "La Lune se lève et se couche chaque jour avec un décalage horaire. À 0° (nouvelle lune), elle suit le Soleil et reste invisible. À 180° (pleine lune), elle se lève au crépuscule.",
    "canvas_east": "EST",
    "canvas_west": "OUEST",
    "canvas_moon_below": "Lune sous l’horizon",
    "days_title": "Jours calendaires et jours lunaires",
    "days_desc": "En moyenne la Lune se lève environ 50 minutes plus tard chaque jour, mais le décalage n'est pas constant : il va de quelques minutes à une heure et demie. Les journées lunaires (d'un lever au suivant) ne coïncident donc pas avec les journées du calendrier (de minuit à minuit). La 1re journée lunaire commence à la nouvelle Lune et finit au premier lever : elle est courte.",
    "label_cycle_day": "Jour du cycle (depuis nouvelle lune)",
    "days_hint": "La barre est la journée lunaire d'un lever de Lune au suivant, le point le lever, le losange la nouvelle Lune. L'axe du bas est le calendrier : on voit les jours où il n'y a aucun lever de Lune, ou bien deux. La durée d'une journée lunaire varie de 23 à 26 heures, si bien que le décalage du lever n'est pas constant non plus.",
    "canvas_day_prefix": "Jour",
    "canvas_rise_prefix": "Lev. ~",
    "personal_title": "Deux points de repère",
    "personal_desc": "La Lune dans le ciel est la même pour tous, mais votre date de naissance définit un décalage personnel dans le cycle de 29,5 jours. Ci-dessous figurent votre courbe et une opposition de phase.",
    "personal_profile_prefix": "Votre profil",
    "personal_demo_note": "Mode invité (aucune date de naissance — démo 5.0 j)",
    "label_current_cycle_day": "Jour actuel du cycle",
    "label_user_a_birth": "Vous (âge lunaire à la naissance)",
    "label_user_a_demo": "Utilisateur A (âge lunaire à la naissance)",
    "label_user_b_anti": "Utilisateur B (opposition de phase)",
    "canvas_user_a_short": "A",
    "canvas_user_b_short": "B",
    "canvas_cycle_days": "Jours du cycle",
    "profiles_title": "4 profils de rythme de base",
    "profiles_desc": "Selon l’âge lunaire natal (phase à la naissance), le moteur associe l’un des quatre profils de rythme de base :",
    "your_profile_badge": "Votre profil",
    "profile_range_async": "≤ 3,7 ou ≥ 25,8 j (Nouvelle Lune)",
    "profile_range_waxing": "3,7 – 11,1 j (Lune Croissante)",
    "profile_range_sync": "11,1 – 18,5 j (Pleine Lune)",
    "profile_range_waning": "> 18,5 j (Lune Décroissante)",
    "modes_title": "5 modes quotidiens appliqués",
    "modes_desc": "Pour évaluer le climat d’échange et d’action du jour, le moteur analyse les aspects planétaires en transit selon cinq scénarios :",
    "modes_decay_note": "Un historique d’atténuation sur 2 jours et une pénalité de répétition évitent que les conseils ne restent figés plusieurs jours de suite.",
    "practice_title": "Comment utiliser concrètement cette application",
    "practice_step1_title": "1. Séparer l’état du ciel et le cycle personnel",
    "practice_step1_body": "Appuyez-vous sur la phase réelle pour protéger votre sommeil : 3 à 5 nuits avant la pleine lune, tamisez la lumière le soir et évitez caféine tardive ou écrans. Utilisez votre phase personnelle (Montée → Pic → Déclin → Minimum) pour répartir l’effort : lancements sur Montée et Pic ; routine et clôture sur Déclin ; récupération sur Minimum.",
    "practice_step2_title": "2. Lire les jours lunaires par créneaux horaires",
    "practice_step2_body": "Ne vous fiez pas aveuglément au numéro du jour lunaire : regardez l’heure de transition (lever de Lune) et le jour actif sur votre créneau (09:00, 14:00, 20:00). Par défaut les coordonnées sont déduites du fuseau horaire sans GPS, mais vous pouvez saisir latitude et longitude exactes dans les réglages.",
    "practice_step3_title": "3. Calibrer le modèle sur 1 à 2 mois",
    "practice_step3_body": "L’application propose une hypothèse structurée de rythme, pas une loi absolue. Notez sur un ou deux mois lunaires les journées de clarté mentale, de baisse d’énergie et la qualité du sommeil pour repérer les repères les plus justes pour vous.",
    "science_ok_badge": "Confirmé par la recherche",
    "science_light_title": "Lumière nocturne et rythmes circadiens",
    "science_light_intro": "Avant l’éclairage électrique, le clair de lune était la principale source lumineuse nocturne. La physiologie réagit précisément à la luminosité :",
    "science_light_p1": "3 à 5 nuits avant la pleine lune, la Lune brillante éclaire le début de soirée après le coucher du Soleil et retarde l’endormissement.",
    "science_light_p2": "Les études mesurent en moyenne 20 à 25 minutes de sommeil en moins et moins de sommeil profond (souvent masqué en ville par l’éclairage artificiel et les écrans).",
    "science_light_sources": "Sources : Casiraghi et al., Science Advances (2021) ; Cajochen et al., Current Biology (2013).",
    "science_myth_badge": "Idée reçue",
    "science_gravity_title": "Gravité et « marées dans le corps »",
    "science_gravity_p1": "Les marées océaniques existent uniquement en raison de l’échelle planétaire des masses d’eau.",
    "science_gravity_p2": "À l’échelle du corps humain, le gradient gravitationnel de la Lune est infime — plus faible que l’attraction d’un bâtiment ou d’une voiture voisine.",
    "science_gravity_conclusion": "Conclusion : le facteur physique est la lumière nocturne et le sommeil, pas « l’attraction de l’eau ».",
    "science_disclaimer_title": "Précision honnête sur la date de naissance",
    "science_disclaimer_body": "La biologie moderne n’apporte aucune preuve que la phase lunaire à la naissance programme physiquement les cycles hormonaux ou énergétiques d’un adulte. Ici, la date de naissance sert de repère pratique d’auto-organisation sur un cycle de 29,5 jours, et non de loi physique.",
    "canvas_south": "SUD",
    "canvas_moon_hidden": "Lune (cachée)",
    "canvas_culmination_prefix": "Sud ~",
    "canvas_set_prefix": "Couch. ~",
    "canvas_timeline_24h": "Sur l’horizon (24 h)",
    "label_earth_view": "Vue terrestre",
    "canvas_rise_exact_prefix": "Lev. ",
    "canvas_culmination_exact_prefix": "Sud ",
    "canvas_set_exact_prefix": "Couch. ",
    "canvas_sun_below": "Soleil sous l’horizon",
    "horizon_live_mode": "Réel (auj.)",
    "horizon_model_mode": "Modèle ~",
    "horizon_sun_label": "Soleil",
    "horizon_date_label": "Date d'observation",
    "horizon_fact_label": "Fait",
    "horizon_next_event_label": "Prochain événement",
    "horizon_after_label": "dans",
    "horizon_before_label": "avant",
    "horizon_no_more_events": "plus d'événement aujourd'hui",
    "horizon_transit_word": "culmination",
    "horizon_below": "sous l'horizon",
    "horizon_behind": "derrière (nord)",
    "horizon_elong_word": "élongation",
    "horizon_drift_title": "Décalage quotidien du lever de Lune, min/jour",
    "horizon_phase_hint": "Le curseur de phase choisit la date la plus proche ayant cette élongation : le ciel est toujours montré avec des données réelles, il n'y a pas de modèle moyen ici.",
    "horizon_drift_tomorrow": "Demain",
    "horizon_drift_avg": "moyenne",
    "horizon_drift_range": "amplitude",
    "horizon_drift_unit": "min/jour",
    "horizon_lunar_link_label": "Journée lunaire",
    "horizon_lunar_link_note": "une journée lunaire se termine au lever de Lune suivant.",
    "coord_north": "N",
    "coord_east": "E",
    "dur_h": "h",
    "dur_m": "min",
    "days_summary_label": "Journée lunaire",
    "days_from_label": "de",
    "days_to_label": "à",
    "days_duration_label": "durée",
    "days_step_label": "décalage par jour",
    "days_today_prefix": "Aujourd'hui",
    "days_today_is_selected": "C’est le jour affiché sur le graphique.",
    "days_today_other": "Déplacez le curseur jusqu’à ce jour.",
    "days_explain_label": "Décalage par jour dans ce cycle",
    "days_explain_avg": "en moyenne",
    "days_explain_cause": "La Lune orbite autour de la Terre irrégulièrement (plus vite au périgée) et sa déclinaison évolue irrégulièrement : lors des stations, le lever de Lune bouge à peine puis saute d'une heure et demie.",
    "days_no_rise": "aucun lever",
    "days_two_rises": "2 levers",
    "days_today": "aujourd'hui",
    "days_legend": "barre = journée lunaire, point = lever de Lune, losange = nouvelle Lune",
    "days_day_word": "jour",
    "horizon_later_than": "après le Soleil",
    "horizon_earlier_than": "avant le Soleil",
    "horizon_tomorrow_word": "demain",
    "days_new_moon": "nouvelle lune",
    "horizon_twilight_label": "crépuscule (Soleil sous −6°)",
    "horizon_next_rise": "Prochain lever de Lune :",
    "canvas_you": "Vous",
    "horizon_col_rise": "Lever",
    "horizon_col_culm": "Culmination",
    "horizon_col_set": "Coucher",
    "horizon_summary_card_title": "Résumé de la date sélectionnée",
    "horizon_next_card_title": "Prochain événement",
    "horizon_lunar_card_title": "Lien avec la journée lunaire",
    "horizon_tip_card_title": "Comparaison Soleil et Lune",
    "horizon_drift_tomorrow_label": "Demain",
    "horizon_drift_avg_label": "Moyenne 7 j",
    "horizon_drift_range_label": "Amplitude",
    "days_selected_card_title": "Journée lunaire sélectionnée",
    "days_today_card_title": "Journée lunaire actuelle",
    "days_explain_card_title": "Pourquoi le décalage varie",
    "days_selected_badge": "Affiché"
  }
};
