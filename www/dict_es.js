export const DICT_ES = {
  "meta": {
    "id": "base_default_es",
    "lang": "es-ES",
    "name": "Perfil Base",
    "version": "2.0.0",
    "author": "System Core",
    "description": "Diccionario extendido de productividad, ritmos de actividad y escenarios diarios sin metáforas ni esoterismo.",
    "tts_prefix": "Resumen del ritmo para hoy."
  },
  "profiles": {
    "profile_async": {
      "title": "Ritmo Introvertido",
      "short_desc": "Pico de concentración en un entorno tranquilo",
      "full_desc": "Tu máxima productividad llega en la fase de renovación del ciclo, cuando el ruido informativo externo es mínimo."
    },
    "profile_waxing": {
      "title": "Ritmo de Acumulación",
      "short_desc": "Impulso gradual y crecimiento constante",
      "full_desc": "Alcanzas tu mayor eficacia en la primera mitad del ciclo, aumentando progresivamente el ritmo y los recursos."
    },
    "profile_sync": {
      "title": "Ritmo Extrovertido",
      "short_desc": "Máxima actividad alineada con el impulso externo",
      "full_desc": "Tu energía personal coincide con el pico del ciclo externo, dando máxima fuerza para tareas públicas y de gran escala."
    },
    "profile_waning": {
      "title": "Ritmo de Optimización",
      "short_desc": "Enfoque en análisis y cierre de procesos",
      "full_desc": "Tu mayor claridad aparece en la segunda mitad del ciclo, cuando toca estructurar y consolidar resultados."
    }
  },
  "phases": {
    "phase_peak": {
      "title": "Recurso Máximo",
      "badge": "Pico",
      "tempo": "Ritmo alto",
      "action": "Negociaciones clave, lanzamiento de proyectos, decisiones firmes",
      "tts_summary": "Hoy es la fase de recurso máximo. Excelente momento para prioridades clave y acción decidida."
    },
    "phase_decline": {
      "title": "Ritmo Tranquilo",
      "badge": "Descenso",
      "tempo": "Ritmo moderado",
      "action": "Cierre de tareas iniciadas, análisis, documentación",
      "tts_summary": "Hoy predomina un ritmo tranquilo. Baja la marcha, registra resultados y cierra tareas pendientes."
    },
    "phase_minimum": {
      "title": "Modo Descanso",
      "badge": "Mínimo",
      "tempo": "Ritmo bajo",
      "action": "Recuperación de fuerzas, rutina ligera, evitar sobrecargas",
      "tts_summary": "Hoy estás en modo descanso. Evita nuevos comienzos exigentes y prioriza el sueño y la recuperación."
    },
    "phase_rise": {
      "title": "Impulso Inicial",
      "badge": "Ascenso",
      "tempo": "Ritmo creciente",
      "action": "Planificación, recopilación de datos, preparación ordenada",
      "tts_summary": "Hoy es fase de impulso inicial. Buen momento para planificar, reunir datos y entrar en ritmo gradualmente."
    }
  },
  "phase_day_notes": {
    "phase_peak": {
      "start": "Inicio del pico: lleva los proyectos prioritarios a ejecución activa y fija acuerdos.",
      "middle": "Mitad del pico: recurso al máximo — resuelve las tareas más complejas y asume el liderazgo clave.",
      "end": "Final del pico: convierte la actividad en entregables concretos sin sumar compromisos de última hora."
    },
    "phase_decline": {
      "start": "Inicio del descenso: pasa de lanzar cosas nuevas a pulir y acompañar los procesos en curso.",
      "middle": "Mitad del descenso: equilibrio ideal de calma y foco para informes, análisis y orden.",
      "end": "Final del descenso: cierra cabos sueltos, resume resultados parciales y reduce la carga gradualmente."
    },
    "phase_minimum": {
      "start": "Inicio del mínimo: recorta reuniones prescindibles, quédate con la rutina básica y protege tu atención.",
      "middle": "Mitad del mínimo: pausa silenciosa de reinicio. Despeja la agenda y date más respiros.",
      "end": "Final del mínimo: la energía empieza a volver — esboza los primeros pasos de la próxima semana sin prisa."
    },
    "phase_rise": {
      "start": "Inicio del ascenso: pasa del descanso a la estructura, prueba ideas y reúne los datos que faltan.",
      "middle": "Mitad del ascenso: el tono laboral sube de forma estable — amplía contactos y ejecución práctica.",
      "end": "Final del ascenso: alcanza plena capacidad operativa y prepara el terreno para las decisiones de la siguiente fase."
    }
  },
  "roles": {
    "role_agile": {
      "title": "Modo Sprint",
      "hint": "Enfoque en comunicación rápida, tareas breves y flexibilidad."
    },
    "role_drive": {
      "title": "Modo Avance",
      "hint": "Iniciativa personal, empuje directo y decisiones ágiles."
    },
    "role_diplomat": {
      "title": "Modo Diálogo",
      "hint": "Reuniones, colaboración, búsqueda de acuerdos y trabajo en equipo."
    },
    "role_heavy": {
      "title": "Modo Alta Responsabilidad",
      "hint": "Trabajo sistemático, normas, plazos y grandes entregables."
    },
    "role_autonomous": {
      "title": "Modo Autónomo",
      "hint": "Trabajo tranquilo en solitario, planificación y uso cuidadoso de la energía."
    }
  },
  "age_classes": {
    "age_18_25": {
      "title": "Alta Dinámica",
      "modifier_hint": "Recuperación rápida. Haz pausas a tiempo para evitar el agotamiento."
    },
    "age_26_40": {
      "title": "Equilibrio de Fondo",
      "modifier_hint": "Alta carga social. Reparte tus esfuerzos de forma uniforme durante el día."
    },
    "age_41_55": {
      "title": "Precisión de Prioridades",
      "modifier_hint": "Apóyate en la experiencia. Elige acciones puntuales en lugar de prisas y cuida el descanso."
    },
    "age_55_plus": {
      "title": "Ritmo Confortable",
      "modifier_hint": "Prioridad a la calidad de vida. Ritmo suave sin sobrecargas bruscas y uso consciente del recurso."
    }
  },
  "actors": {
    "actor_moon": {
      "title": "Ánimo y Adaptación",
      "domain": "bienestar, asuntos cotidianos, flexibilidad al conversar"
    },
    "actor_mercury": {
      "title": "Colegas, Mensajes e Información",
      "domain": "llamadas, documentos, aprendizaje, trayectos cortos"
    },
    "actor_venus": {
      "title": "Cercanos, Socios y Confort",
      "domain": "relaciones personales, acuerdos, finanzas, descanso"
    },
    "actor_mars": {
      "title": "Tareas Activas y Competencia",
      "domain": "iniciativa, debates, actividad física, velocidad"
    },
    "actor_jupiter": {
      "title": "Dirección, Mentores y Alcance",
      "domain": "carrera, grandes proyectos, formación, crecimiento estratégico"
    },
    "actor_saturn": {
      "title": "Reglas, Plazos y Control",
      "domain": "responsabilidad, orden, revisiones, cumplimiento de agenda"
    },
    "actor_outer": {
      "title": "Cambios y Circunstancias Externas",
      "domain": "giros de planes, imprevistos, reestructuración profunda"
    }
  },
  "moon_trends": {
    "new": "Luna Nueva",
    "waxing": "Luna Creciente",
    "full": "Luna Llena",
    "waning": "Luna Menguante"
  },
  "moon_phase_names": {
    "new_moon": "Luna Nueva",
    "waxing_crescent": "Luna Creciente Nueva",
    "first_quarter": "Cuarto Creciente",
    "waxing_gibbous": "Gibosa Creciente",
    "full_moon": "Luna Llena",
    "waning_gibbous": "Gibosa Menguante",
    "last_quarter": "Cuarto Menguante",
    "waning_crescent": "Luna Menguante Vieja"
  },
  "zodiac_names": {
    "Овен": "Aries",
    "Телец": "Tauro",
    "Близнецы": "Géminis",
    "Рак": "Cáncer",
    "Лев": "Leo",
    "Дева": "Virgo",
    "Весы": "Libra",
    "Скорпион": "Escorpio",
    "Стрелец": "Sagitario",
    "Козерог": "Capricornio",
    "Водолей": "Acuario",
    "Рыбы": "Piscis"
  },
  "zodiac_hints": {
    "Овен": "decisiones rápidas, iniciativa personal e inicio de tareas",
    "Телец": "enfoque práctico, finanzas y ritmo sereno",
    "Близнецы": "negociaciones, mensajería e intercambio de información",
    "Рак": "confort, cercanía familiar y equilibrio interior",
    "Лев": "presentaciones, liderazgo y pasos visibles",
    "Дева": "orden, análisis, documentos y trabajo de precisión",
    "Весы": "colaboración, diplomacia y búsqueda de acuerdos",
    "Скорпион": "análisis profundo, estrategia y gestión de recursos",
    "Стрелец": "planificación de alcance, estudio y nuevos horizontes",
    "Козерог": "disciplina, plazos, estructura y tareas sistemáticas",
    "Водолей": "ideas originales, trabajo en equipo y renovación de métodos",
    "Рыбы": "tareas creativas, reflexión y ritmo cuidadoso"
  },
  "lunar_days": {
    "1": "Día de planificación estratégica. Define tus metas principales del mes sin apresurar arranques intensos.",
    "2": "Día de acumulación de recursos y preparación práctica. Revisa presupuestos, crea listas y prepara herramientas.",
    "3": "Día de arranque enérgico. Pasa de la reflexión a la acción concreta y defiende tus prioridades.",
    "4": "Día de criterio ponderado y evaluación de riesgos. Contrasta tus planes con la capacidad real y evita impulsos.",
    "5": "Día de consolidación constante. Mejora lo empezado, cumple tu palabra y mantén el rumbo elegido.",
    "6": "Día de comunicación constructiva e intercambio de ideas. Buen momento para acuerdos suaves, charlas y estudio.",
    "7": "Día de palabra clara y precisión. Presenta propuestas, negocia y deja los acuerdos por escrito.",
    "8": "Día de renovación y ajuste flexible. Actualiza métodos antiguos y prueba formatos de trabajo frescos.",
    "9": "Día de cautela informativa. Verifica dos veces los datos, evita conflictos ajenos y no decidas en caliente.",
    "10": "Día de labor constructiva estable. Orienta el esfuerzo hacia la familia, el equipo y proyectos a largo plazo.",
    "11": "Día de alta concentración y voluntad. Si asumes una tarea exigente, llévala a un hito claro sin dispersarte.",
    "12": "Día de diplomacia y apoyo mutuo. Un tono sereno, escucha activa y ayuda al equipo darán el mejor fruto.",
    "13": "Día de revisión de experiencia y corrección de fallos. Retoma ideas previas y ajusta tus planes.",
    "14": "Uno de los días más productivos del ciclo. Ideal para pasos firmes, lanzamientos y negociaciones clave.",
    "15": "Día de autocontrol e intensidad alta. Mantén el foco en lo esencial, cuida tus límites e ignora provocaciones.",
    "16": "Día de equilibrio y ritmo calmo. Ordena tu escritorio, organiza archivos y equilibra tus pensamientos.",
    "17": "Día de intercambio vivo y cooperación positiva. Adecuado para lluvias de ideas, encuentros y tareas creativas.",
    "18": "Día de retroalimentación objetiva. Observa cómo influyen tus hábitos y estilo en otros y ajusta detalles.",
    "19": "Día de higiene informativa y limpieza de pendientes. Cierra pequeñas deudas, filtra ruido y revisa contratos.",
    "20": "Día de claridad y superación de dudas. Excelente momento para elegir con firmeza y soltar lo que frena.",
    "21": "Día de espíritu de equipo e iniciativas audaces. Une a las personas bajo un objetivo común e impulsa planes.",
    "22": "Día de análisis profundo y aprendizaje. Procesa datos complejos, lee material técnico y busca soluciones nuevas.",
    "23": "Día de límites firmes y limpieza decidida. Recorta tareas superfluas y resuelve disputas prolongadas.",
    "24": "Día de base práctica sólida. Ocúpate de tareas manuales, reparaciones, organización doméstica y procesos clave.",
    "25": "Día de observación pausada y exactitud. No fuerces los hechos — haz solo aquello de lo que estés seguro.",
    "26": "Día de ahorro de atención y silencio. Evita charlas vacías, revisa presupuestos y protege tu tiempo.",
    "27": "Día de síntesis y orden intuitivo. Conecta datos dispersos en una visión global y cierra investigaciones.",
    "28": "Día de gratitud y balance claro. Resume los logros del mes y completa con calma los últimos retoques.",
    "29": "Día de cierre y reinicio de agenda. No empieces nada nuevo — prioriza limpieza, calma y descanso temprano.",
    "30": "Día de cierre suave antes del nuevo ciclo. Despeja la agenda, deja atrás roces menores y descansa."
  },
  "aspect_dynamics": {
    "applying": "La influencia va en aumento — mejor ventana para actuar con antelación.",
    "exact": "El punto máximo cae hoy mismo — actúa con plena atención.",
    "separating": "El pico ya pasó y la situación se estabiliza — hora de fijar resultados."
  },
  "maneuvers": {
    "edge_conjunction": {
      "title": "Implicación plena",
      "valence": "neutral",
      "advice": "Máxima concentración en este ámbito. Actúa paso a paso y evita dispersarte."
    },
    "edge_sextile": {
      "title": "Buena oportunidad",
      "valence": "positive",
      "advice": "Ventana favorable para tomar la iniciativa. Da el primer paso en una charla o tarea."
    },
    "edge_trine": {
      "title": "Entendimiento fluido",
      "valence": "positive",
      "advice": "Los procesos avanzan sin roces. Aprovecha para coordinar asuntos con calma."
    },
    "edge_square": {
      "title": "Riesgo de prisa y malentendidos",
      "valence": "warning",
      "advice": "Posibles trabas o fricciones. Revisa los detalles, baja la prisa y evita discusiones bruscas."
    },
    "edge_opposition": {
      "title": "Posturas opuestas, búsqueda de equilibrio",
      "valence": "warning",
      "advice": "Respeta los límites personales y busca consenso. No impongas tu criterio a toda costa."
    }
  },
  "actor_maneuver_matrix": {
    "actor_moon": {
      "edge_conjunction": "Tu sensibilidad interna está afinada hoy. Escucha tu nivel de energía y adapta el horario.",
      "edge_sextile": "Los asuntos diarios fluyen con flexibilidad. Buen momento para ajustar la agenda a tu favor.",
      "edge_trine": "El tono emocional es estable y amable. Funcionan bien las charlas familiares tranquilas.",
      "edge_square": "El ánimo puede cambiar rápido. Evita decisiones domésticas impulsivas y deja margen entre tareas.",
      "edge_opposition": "Tus necesidades chocan con expectativas ajenas. Marca límites con calma y busca equilibrio justo."
    },
    "actor_mercury": {
      "edge_conjunction": "Correos, llamadas e ideas alcanzan su máximo. Anota lo clave para no perder detalles con la prisa.",
      "edge_sextile": "Buena ventana para negociaciones breves, trámites y localizar rápido a los contactos clave.",
      "edge_trine": "Las ideas se expresan con claridad y peso. Ideal para redactar informes, estudiar y revisar textos.",
      "edge_square": "Mayor riesgo de erratas, confusión de fechas o mensajes imprecisos. Relee antes de enviar.",
      "edge_opposition": "En el diálogo puede surgir lógica opuesta. Haz preguntas aclaratorias en vez de discutir detalles."
    },
    "actor_venus": {
      "edge_conjunction": "Prioridad al bienestar personal, la estética y el trato cálido. Dedica tiempo al descanso de calidad.",
      "edge_sextile": "Un gesto amable o tono cordial facilita contactos rápidos y condiciones favorables.",
      "edge_trine": "Momento armónico para compras acertadas, revisar presupuestos, reuniones y fortalecer confianza.",
      "edge_square": "Posible insatisfacción o gasto impulsivo. Pospón compras importantes hasta mañana.",
      "edge_opposition": "Las expectativas cercanas y tus planes pueden divergir. Dialoga un punto medio sin reproches."
    },
    "actor_mars": {
      "edge_conjunction": "Fuerte empuje de decisión y resistencia. Canaliza la energía en una tarea exigente o ejercicio.",
      "edge_sextile": "Una iniciativa valiente y un primer paso ágil traen avance claro. Haz la llamada clave pendiente.",
      "edge_trine": "La ejecución sale precisa y eficaz sin tensión extra. Ideal para cerrar tareas que exigen ritmo.",
      "edge_square": "Riesgo alto de brusquedad, prisa y rivalidad innecesaria. Haz una pausa antes de responder críticas.",
      "edge_opposition": "El choque de intereses pide firmeza sin agresividad. Lleva el debate a hechos y criterios claros."
    },
    "actor_jupiter": {
      "edge_conjunction": "Surgen opciones de crecimiento y respaldo de personas clave. Presenta ideas de mayor alcance.",
      "edge_sextile": "Un consejo oportuno o un giro favorable amplían el horizonte del proyecto actual.",
      "edge_trine": "Contexto favorable para charlas laborales, formación y avance estratégico sin resistencia.",
      "edge_square": "Tendencia a prometer de más o sobrestimar fuerzas. Revisa plazos y presupuestos con realismo.",
      "edge_opposition": "Tus ambiciones se miden frente a reglas externas o criterios directivos. Respalda el alcance con datos."
    },
    "actor_saturn": {
      "edge_conjunction": "Se requiere máxima concentración y rigor. Hoy la disciplina sistemática supera a la improvisación.",
      "edge_sextile": "Buen día para reforzar el orden, alinear normas y avanzar con calma en revisiones formales.",
      "edge_trine": "La constancia y la experiencia dan frutos sólidos. Sigue el plan paso a paso sin distracciones.",
      "edge_square": "Posibles plazos estrictos, auditorías o exigencias de calidad. Cumple las normas sin atajos.",
      "edge_opposition": "La presión externa o crítica señala puntos débiles del sistema. Corrígelos con calma."
    },
    "actor_outer": {
      "edge_conjunction": "El contexto externo exige revisar rápido la rutina habitual. Hoy la flexibilidad vale más que la rigidez.",
      "edge_sextile": "Una propuesta inesperada o mirada fresca abre una salida original de la rutina.",
      "edge_trine": "Los cambios profundos de procesos ocurren de forma natural. Buen momento para actualizar herramientas.",
      "edge_square": "Posibles giros bruscos de horario o condiciones. Ten un plan B y mantén la serenidad.",
      "edge_opposition": "Las circunstancias invitan a soltar métodos o vínculos ineficaces. Mantén la mente clara."
    }
  },
  "lifestyle_tips": {
    "phase_peak": {
      "morning": [
        "Bebe un vaso de agua al despertar y anota tus tres objetivos principales del día.",
        "Sal a la luz natural diez minutos en la primera hora tras levantarte para activar tu ritmo.",
        "Haz una breve movilidad de hombros y espalda antes de abrir los chats de trabajo."
      ],
      "day": [
        "Hidrátate y haz una pausa breve de estiramiento cada noventa minutos.",
        "Trabaja en bloques enfocados de cuarenta y cinco minutos con cinco de descanso visual.",
        "Camina diez minutos tras comer para mantener la atención despejada por la tarde."
      ],
      "evening": [
        "Termina las tareas exigentes al menos dos horas antes de dormir.",
        "Anota tres logros del día y cierra la lista laboral para liberar la mente antes del descanso.",
        "Atenúa las luces intensas noventa minutos antes de dormir y cambia noticias por lectura tranquila."
      ]
    },
    "phase_decline": {
      "morning": [
        "Empieza sin prisas: ventila la habitación y repasa tus tareas abiertas.",
        "Desayuna con calma, sin leer noticias ni revisar el correo en la mesa.",
        "Dedica los primeros treinta minutos a una tarea clara que puedas terminar por completo."
      ],
      "day": [
        "Buen momento para ordenar pendientes, responder correos y cerrar proyectos con calma.",
        "Cuida la postura del cuello y la espalda frente al escritorio y estira suavemente al mediodía.",
        "Bebe agua pura o té tibio sin azúcar en lugar de otro estimulante."
      ],
      "evening": [
        "Da un paseo pausado sin el teléfono.",
        "Toma una ducha tibia y deja el escritorio despejado para mañana por la mañana.",
        "Pon el móvil en silencio una hora antes de dormir para descansar mejor."
      ]
    },
    "phase_minimum": {
      "morning": [
        "No sobrecargues la mañana. Agua tibia y un desayuno tranquilo marcan un buen inicio.",
        "Date quince minutos extra para despertar con suavidad antes de entrar a mensajes.",
        "Haz un breve ejercicio de respiración con exhalación larga para bajar la tensión."
      ],
      "day": [
        "Mantén un ritmo cuidadoso. Cambia un café adicional por agua o infusión.",
        "Libera la agenda de llamadas prescindibles y descansa la vista quince minutos sin pantallas.",
        "Almuerza en silencio, lejos de chats laborales y vídeos."
      ],
      "evening": [
        "Acuéstate cuarenta minutos antes y aparta las pantallas una hora antes de dormir.",
        "Ventila el dormitorio y deja el teléfono cargando fuera del alcance de la mano.",
        "Haz unos estiramientos suaves de hombros y zona lumbar antes de acostarte."
      ]
    },
    "phase_rise": {
      "morning": [
        "Luz matinal, un vaso de agua y estiramiento ligero ayudan a retomar el ritmo.",
        "Revisa el plan semanal y elige una tarea clave para arrancar con calma antes del mediodía.",
        "Haz cinco minutos de movilidad articular y usa ropa cómoda."
      ],
      "day": [
        "Momento propicio para investigar, estudiar y preparar proyectos próximos.",
        "Sal al aire libre unos minutos al mediodía para despejar la atención.",
        "Bebe agua en sorbos pequeños durante el día y mantén tu espacio bien iluminado."
      ],
      "evening": [
        "Un paseo al aire libre ayuda a ordenar ideas y preparar la jornada de mañana.",
        "Esboza un plan breve de tres puntos para mañana y cierra la jornada laboral.",
        "Dedica treinta minutos nocturnos a una afición tranquila sin alertas de trabajo."
      ]
    }
  },
  "day_themes": {
    "Овен": {
      "title": "Arranque directo",
      "focus": "Dar un primer paso rápido hoy aporta más que pulir en exceso la preparación."
    },
    "Телец": {
      "title": "Ritmo estable",
      "focus": "La constancia rinde más que un impulso brusco; mantén firmeza sin dispersarte."
    },
    "Близнецы": {
      "title": "Flujo de información",
      "focus": "Habrá bastantes mensajes y tareas breves; cuida tus pequeños compromisos."
    },
    "Рак": {
      "title": "Enfoque cuidadoso",
      "focus": "Trabajo tranquilo sin prisas; prioriza el hogar, los cercanos y el bienestar."
    },
    "Лев": {
      "title": "Aporte personal",
      "focus": "Las tareas salen mejor donde importa tu criterio propio y un resultado visible."
    },
    "Дева": {
      "title": "Precisión y orden",
      "focus": "Revisar detalles, listas y rutinas rinde más hoy que asumir riesgos innecesarios."
    },
    "Весы": {
      "title": "Acuerdo y equilibrio",
      "focus": "Las decisiones clave dependen del diálogo hoy; busca opciones compartidas."
    },
    "Скорпион": {
      "title": "Profundidad y control",
      "focus": "Buen día para analizar a fondo y gestionar recursos; lo superficial no bastará."
    },
    "Стрелец": {
      "title": "Ampliación",
      "focus": "El estudio, los trayectos y nuevos contactos ayudan a ampliar el alcance de tus metas."
    },
    "Козерог": {
      "title": "Disciplina",
      "focus": "Los plazos, la estructura y el método valen más hoy que los impulsos sueltos."
    },
    "Водолей": {
      "title": "Enfoque fresco",
      "focus": "Las soluciones originales y la flexibilidad funcionan mejor que las reglas rígidas."
    },
    "Рыбы": {
      "title": "Calma creativa",
      "focus": "La reflexión serena y el descanso importan más hoy que sumar compromisos."
    }
  },
  "phase_variants": {
    "phase_peak": [
      "Hoy es la fase de recurso máximo: momento ideal para prioridades clave y avances firmes.",
      "Hoy cuentas con alto vigor laboral: céntrate en lo esencial sin dispersar tu atención.",
      "Hoy la capacidad de entrega es alta: avanza más de lo habitual cuidando tus plazos."
    ],
    "phase_decline": [
      "Hoy predomina un ritmo sereno: modera la marcha, registra avances y cierra pendientes.",
      "Hoy conviene una carga moderada: terminar lo iniciado rinde más que abrir frentes nuevos.",
      "Hoy favorece el cierre: revisa detalles y lleva los procesos activos a buen término."
    ],
    "phase_minimum": [
      "Hoy estás en modo descanso: evita arranques exigentes y reserva tiempo para dormir y reponerte.",
      "Hoy pide un trato suave: las reservas son justas, recorta lo prescindible de la agenda.",
      "Hoy funciona mejor aligerar el horario, mantener rutinas simples y descansar a tiempo."
    ],
    "phase_rise": [
      "Hoy es fase de impulso inicial: buen momento para planificar, investigar y arrancar con orden.",
      "Hoy gira en torno a preparar el terreno: reúne datos y consolida bases para próximos pasos.",
      "Hoy el tono activo sube poco a poco: empieza con estructura paso a paso sin forzar."
    ]
  },
  "role_tone": {
    "role_agile": {
      "phase_peak": "Sprint a pleno rendimiento: bloques breves encadenados volviendo al objetivo central.",
      "phase_decline": "Ritmo algo ágil: liquida cabos sueltos breves sin abrir nuevas ramas.",
      "phase_minimum": "Solo series cortas y ligeras de tareas, sin prisas ni presión extra.",
      "phase_rise": "Toma impulso en ráfagas breves sin dispersar tu foco."
    },
    "role_drive": {
      "phase_peak": "Iniciativa al máximo: lidera lo prioritario y resuelve decisiones de inmediato.",
      "phase_decline": "Iniciativa medida: da un paso decisivo y evita discusiones innecesarias.",
      "phase_minimum": "Iniciativa pausada: pasos pequeños y seguros sin acelerones bruscos.",
      "phase_rise": "La iniciativa crece paso a paso: comienza con un primer movimiento claro."
    },
    "role_diplomat": {
      "phase_peak": "Negociación activa: alinea condiciones clave y suma apoyos hacia un fin común.",
      "phase_decline": "Una charla bien medida y ajuste tranquilo de los detalles restantes.",
      "phase_minimum": "Solo coordinaciones breves y neutrales, sin debates largos.",
      "phase_rise": "El diálogo gana tracción: comenta planes próximos y alinea expectativas."
    },
    "role_heavy": {
      "phase_peak": "Trabajo metódico a plena capacidad: apoya tus pasos en listas, normas y plazos.",
      "phase_decline": "Bloque ordenado de revisión: verifica documentos y cierra compromisos.",
      "phase_minimum": "Mantén orden tranquilo en lo actual sin asumir nuevas cargas exigentes.",
      "phase_rise": "Base estructurada: organiza el marco de trabajo y verifica los datos de partida."
    },
    "role_autonomous": {
      "phase_peak": "Trabajo profundo en solitario sobre tu entregable más importante, sin cortes.",
      "phase_decline": "Un bloque sereno de concentración sin llamadas innecesarias.",
      "phase_minimum": "Ritmo tranquilo y autónomo, con exigencias externas mínimas.",
      "phase_rise": "Preparación silenciosa previa al lanzamiento y orden sereno de ideas."
    }
  },
  "window_focus": {
    "morning": [
      "Define una prioridad clara para el día",
      "Reúne los datos clave de tu tarea principal",
      "Revisa la agenda y descarta lo prescindible",
      "Resuelve un detalle organizativo sencillo"
    ],
    "day": [
      "Dedica el bloque central a la tarea prioritaria",
      "Atiende llamadas y acuerdos programados",
      "Verifica documentos, cifras y plazos activos",
      "Resuelve una tarea práctica que requiera acción directa"
    ],
    "evening": [
      "Haz balance del día y anota las conclusiones",
      "Cierra asuntos menores y deja un plan breve para mañana",
      "Dedica un rato tranquilo al hogar y a los tuyos",
      "Pasa a un descanso sereno lejos de pantallas laborales"
    ]
  },
  "ui_labels": {
    "app_title": "Ritmo del Día",
    "app_subtitle": "Lunar Rhythm Navigator",
    "lunar_day_short": "d.l.",
    "lunar_day_full": "día lunar",
    "moon_age_unit": "d.",
    "label_moonrise": "Salida",
    "label_moonset": "Puesta",
    "hero_moon_aria": "Fase lunar",
    "hero_illumination_title": "Iluminación lunar",
    "hero_trend_title": "Tendencia del ciclo lunar",
    "hero_alarm_title": "Alarma lunar",
    "hero_alarm_aria": "Desactivar y leer alarma",
    "btn_copy_prompt_title": "Copiar prompt para modelo de IA externo",
    "btn_copy_prompt_aria": "Prompt para IA",
    "prompt_copied_toast": "Prompt de IA copiado",
    "btn_speak_briefing": "Leer resumen",
    "btn_stop_speech": "Detener lectura",
    "nav_today": "Hoy",
    "nav_reminders": "Recordatorios",
    "nav_settings": "Ajustes",
    "label_today": "Hoy",
    "btn_back_today": "Hoy",
    "timeline_aria": "Línea de días lunares",
    "timeline_has_reminder": "Tiene recordatorio",
    "day_note_title": "Nota",
    "day_note_placeholder": "Añadir recordatorio para este día...",
    "btn_save": "Guardar",
    "btn_cancel": "Cancelar",
    "btn_close": "Cerrar",
    "btn_speak": "Leer",
    "btn_toggle_on": "Sí",
    "btn_toggle_off": "No",
    "btn_delete": "Eliminar",
    "btn_clear": "Limpiar",
    "btn_test_voice": "Probar voz",
    "btn_download_template": "Descargar plantilla",
    "btn_upload_dict": "Subir diccionario",
    "btn_add_reminder": "Añadir",
    "tab_by_lunar_day": "Por día lunar",
    "tab_by_date": "Por fecha",
    "reminders_heading": "Alarma Lunar",
    "label_lunar_day_range": "Número de día lunar (1–30)",
    "label_repeat_monthly": "Repetir cada mes lunar",
    "label_calendar_date": "Fecha del calendario",
    "label_reminder_text": "Texto de la nota",
    "placeholder_reminder_text": "Qué conviene hacer o recordar en este día...",
    "label_every_month": "cada mes",
    "label_nearest": "Próximo",
    "label_select_date_preview": "Elige una fecha para calcular el día lunar y la fase.",
    "label_phase_prefix": "Fase",
    "reminders_empty": "Aún no hay recordatorios. Añade una alarma lunar o una nota por fecha.",
    "card_calendar_kicker": "Calendario Lunar",
    "card_moon_sign_label": "Signo Lunar",
    "card_transition_label": "Cambio de día lunar a las",
    "card_course_kicker": "Rumbo del Día",
    "card_day_of_prefix": "día",
    "card_day_of_sep": "de",
    "card_focus_kicker": "Foco y Día Lunar",
    "card_weekly_bg": "Contexto Semanal",
    "card_exact_peak_badge": "pico exacto",
    "card_moon_in_sign": "Luna en",
    "card_sign_mood": "Tono del signo",
    "card_recovery_kicker": "Ritmo y Recuperación",
    "valence_positive": "Favorable",
    "valence_warning": "Atención",
    "valence_neutral": "Enfoque",
    "today_course_heading": "Rumbo del día",
    "today_guest_heading": "Guía lunar del día",
    "label_personal_resource": "Tu Recurso",
    "label_calendar_backdrop": "Contexto del Calendario",
    "day_status_favorable": "Favorable",
    "day_status_caution": "Con cautela",
    "day_status_refrain": "Mejor abstenerse",
    "slot_morning": "Mañana",
    "slot_day": "Día",
    "slot_evening": "Noche",
    "slot_morning_title": "🌅 Mañana",
    "slot_day_title": "☀️ Día",
    "slot_evening_title": "🌙 Noche",
    "settings_rhythm_title": "Ritmo Personal",
    "settings_rhythm_desc": "Sin fecha de nacimiento, la extensión funciona como un calendario lunar preciso. Indica tu fecha de nacimiento para calcular fases personales y aspectos.",
    "label_birth_date": "Fecha de nacimiento",
    "placeholder_birth_date": "dd.mm.aaaa",
    "btn_pick_date": "Elegir fecha en el calendario",
    "label_birth_time": "Hora de nacimiento",
    "title_birth_time": "Hora de nacimiento (opcional, por defecto 12:00)",
    "label_birth_lunar_age": "edad lunar natal",
    "settings_notif_title": "Notificaciones y avisos",
    "settings_notif_daily_desc": "Resúmenes diarios",
    "settings_notif_alarm_push": "Notificaciones emergentes para la alarma lunar",
    "settings_voice_title": "Voz de lectura (Speech Synthesis)",
    "settings_voice_desc": "El idioma se elige automáticamente según meta.lang del diccionario activo, o selecciona una voz:",
    "label_voice_auto": "Auto",
    "settings_dict_title": "Diccionarios y temas",
    "label_builtin_lang": "Idioma de interfaz y diccionario base",
    "dict_mode_default": "Diccionario base",
    "dict_mode_custom": "Personalizado",
    "label_dict_lang": "Idioma",
    "dict_ai_hint": "Puedes descargar la plantilla JSON base y pedirle a cualquier modelo de IA que la traduzca al idioma que prefieras (por ejemplo, italiano poniendo \"it-IT\" en meta.lang) o la reescriba en cualquier estilo (navegador de coche, piloto marítimo, nave espacial), manteniendo estrictamente la estructura de claves.",
    "btn_copy_raw_data": "Copiar Raw Data (JSON)",
    "raw_data_copied_toast": "Raw Data copiados ✓",
    "msg_upload_custom_first": "Primero sube un diccionario .json personalizado.",
    "msg_dict_loaded": "Diccionario cargado",
    "msg_dict_error": "Error de archivo",
    "reminder_prefix_tts": "Recordatorio para el día lunar actual.",
    "harmony_bridge_minimum": "El entorno externo aporta dinamismo, pero tu ritmo personal está enfocado en descansar — usa este impulso solo para cerrar tareas en curso sin abrir nuevas.",
    "harmony_bridge_decline": "El entorno externo aporta dinamismo, pero tu ritmo personal está en descenso sereno — dirige este empuje a concluir tareas iniciadas y ordenar pendientes.",
    "ai_forecast_title": "Pronóstico astrológico del día",
    "settings_location_title": "Coordenadas del observador",
    "settings_location_desc": "Por defecto, las coordenadas se calculan por tu zona horaria sin GPS. Indica latitud y longitud manualmente para ajustar la salida y puesta de la Luna.",
    "label_observer_lat": "Latitud",
    "placeholder_observer_lat": "Lat. (ej. 40.42)",
    "label_observer_lon": "Longitud",
    "placeholder_observer_lon": "Lon. (ej. -3.70)",
    "location_status_auto": "Actual: Auto",
    "location_status_manual": "Actual: Manual",
    "location_status_incomplete": "Introduce ambos valores: latitud (−90…90) y longitud (−180…180).",
    "btn_import_reminders": "Cargar",
    "btn_export_reminders": "Guardar",
    "msg_reminders_export_empty": "La lista está vacía — no hay nada que guardar.",
    "msg_reminders_exported": "Guardado en Descargas",
    "msg_reminders_exported_docs": "Guardado en Documentos",
    "msg_reminders_exported_shared": "Archivo compartido",
    "msg_reminders_export_cancelled": "Guardado cancelado",
    "msg_reminders_export_clipboard": ".ics copiado al portapapeles. Guarda el texto abajo o pégalo para restaurar",
    "msg_reminders_exported_external": "Guardado en carpeta de la app (Files)",
    "reminders_backup_toggle": "Copia / pegar .ics como texto",
    "reminders_backup_title": "Copia de seguridad (.ics / .json)",
    "reminders_backup_placeholder": "Aquí aparecerá el .ics exportado, o pega texto .ics / .json para restaurar...",
    "btn_copy_backup": "Copiar",
    "btn_import_from_text": "Cargar desde texto",
    "msg_backup_copied": "Texto .ics copiado al portapapeles",
    "msg_reminders_imported": "Recordatorios añadidos",
    "msg_reminders_skipped_dups": "duplicados omitidos",
    "msg_reminders_none_added": "No se encontraron recordatorios nuevos (ya existen).",
    "msg_reminders_import_empty": "No se encontraron recordatorios válidos en el archivo (.ics / .json).",
    "msg_reminders_import_error": "Error al cargar el archivo",
    "hero_personal_trend_title": "Vector de ritmo personal",
    "settings_appearance_title": "Apariencia",
    "label_theme": "Tema",
    "theme_dark": "Oscuro",
    "theme_light": "Claro",
    "label_font_size": "Tamaño de fuente",
    "font_size_normal": "Normal",
    "font_size_large": "Grande",
    "font_size_xlarge": "Muy grande",
    "settings_help_title": "Ayuda y teoría",
    "settings_help_desc": "Guía interactiva: órbita y fases lunares, salida y puesta, desfase de días lunares, ritmo personal y nota científica.",
    "btn_open_help": "Abrir ayuda",
    "solar_day_unit": "h",
    "solar_day_short": "día",
    "solar_night_short": "noche",
    "solar_polar_day_label": "Día polar",
    "solar_polar_night_short": "noche polar",
    "solar_transit_label": "Sur",
    "hero_sun_aria": "Modo solar: toca para cambiar a Luna",
    "hero_toggle_to_solar_title": "Toca para cambiar al modo solar",
    "hero_solar_share_title": "Proporción de luz diurna y altura solar",
    "solar_trend_growing": "La luz diurna aumenta",
    "solar_trend_shrinking": "La luz diurna disminuye",
    "solar_trend_solstice_max": "Máximo de luz diurna",
    "solar_trend_solstice_min": "Mínimo de luz diurna",
    "settings_support_title": "Proyecto y apoyo",
    "settings_support_desc": "El código fuente es abierto en GitHub. Si la app te ayuda a organizar tu ritmo diario, puedes apoyar su desarrollo.",
    "btn_github_repo": "Repositorio en GitHub",
    "support_donate_label": "Apoyar el proyecto",
    "support_copied_toast": "Copiado ✓"
  },
  "help": {
    "page_title": "Guía Dinámica · Lunar Rhythm Navigator",
    "back_btn": "← Volver a la app",
    "footer_lead": "Mecánica celeste dinámica: las pestañas superiores muestran cómo se mueve la Luna en su órbita y respecto al horizonte.",
    "guest_mode": "Modo invitado",
    "coords_manual": "Coords",
    "coords_auto": "Auto zona",
    "tab_orbital": "Órbita y fases",
    "tab_horizon": "Salida y puesta",
    "tab_days": "Días lunares",
    "tab_personal": "Ritmo personal",
    "tab_profiles": "Perfiles de ritmo",
    "tab_science": "Ciencia",
    "orbital_title": "Geometría del sistema",
    "orbital_desc": "El Sol permanece fijo a la izquierda y la Tierra en el centro. La Luna orbita en sentido antihorario. La elongación es el ángulo entre las direcciones al Sol y a la Luna.",
    "label_illum": "Iluminación:",
    "label_trend": "Tendencia:",
    "trend_waxing": "↗ creciente",
    "trend_waning": "↘ menguante",
    "trend_extremum": "extremo",
    "label_elongation": "Elongación (Ángulo)",
    "btn_play": "▶ Animar ciclo",
    "btn_pause": "⏸ Pausa",
    "btn_today": "Hoy",
    "phase_sky_new_moon": "Cerca del Sol, no visible",
    "phase_sky_waxing_crescent": "Por la tarde al oeste",
    "phase_sky_first_quarter": "Sale al mediodía, se pone a medianoche",
    "phase_sky_waxing_gibbous": "De tarde y casi toda la noche",
    "phase_sky_full_moon": "Sale al atardecer, se pone al alba",
    "phase_sky_waning_gibbous": "De noche y mañana al oeste",
    "phase_sky_last_quarter": "Sale a medianoche, se pone al mediodía",
    "phase_sky_waning_crescent": "De madrugada al este",
    "canvas_sun": "SOL",
    "canvas_earth": "TIERRA",
    "canvas_moon": "Luna",
    "horizon_title": "Vista desde la Tierra para sus coordenadas",
    "horizon_desc": "Mueva la hora del día para ver cómo sale la Luna por el este (izquierda), pasa por el sur y se pone por el oeste (derecha). Los arcos siguen la geometría real para la latitud del observador.",
    "label_time_of_day": "Hora del día",
    "label_phase_angle": "Fase (Elongación)",
    "horizon_today_prefix": "Hoy en el cielo",
    "horizon_rise_word": "salida",
    "horizon_set_word": "puesta",
    "horizon_tip": "La Luna sale y se pone cada día, cambiando de horario. Con 0° (luna nueva) sale junto al Sol y no se ve. Con 180° (luna llena) sale al atardecer.",
    "canvas_east": "ESTE",
    "canvas_west": "OESTE",
    "canvas_moon_below": "Luna bajo el horizonte",
    "days_title": "Días calendario y días lunares",
    "days_desc": "En promedio la Luna sale unos 50 minutos más tarde cada día, pero el desplazamiento no es constante: va de unos minutos a hora y media. Por eso los días lunares (de salida a salida) no coinciden con los días del calendario (de medianoche a medianoche). El día lunar 1 empieza en la Luna nueva y acaba en la primera salida, así que es corto.",
    "label_cycle_day": "Día del ciclo (desde luna nueva)",
    "days_hint": "La banda es el día lunar desde la salida de la Luna hasta la siguiente, el punto la salida, el rombo la luna nueva. El eje inferior es el calendario: se ve en qué días no hay ninguna salida de la Luna o hay dos. La duración del día lunar varía entre 23 y 26 horas, por eso el desplazamiento de la salida tampoco es constante.",
    "canvas_day_prefix": "Día",
    "canvas_rise_prefix": "Sal. ~",
    "personal_title": "Dos puntos de referencia",
    "personal_desc": "La Luna en el cielo es la misma para todos, pero tu fecha de nacimiento fija un desfase individual en el ciclo de 29,5 días. Abajo ves tu curva y la de alguien en antifase.",
    "personal_profile_prefix": "Tu perfil",
    "personal_demo_note": "Modo invitado (sin fecha de nacimiento — demo 5.0 d)",
    "label_current_cycle_day": "Día actual del ciclo",
    "label_user_a_birth": "Tú (edad lunar al nacer)",
    "label_user_a_demo": "Usuario A (edad lunar al nacer)",
    "label_user_b_anti": "Usuario B (antifase)",
    "canvas_user_a_short": "A",
    "canvas_user_b_short": "B",
    "canvas_cycle_days": "Días del ciclo",
    "profiles_title": "4 perfiles base de ritmo",
    "profiles_desc": "Según la edad lunar natal (fase en tu fecha de nacimiento), el motor asigna uno de los cuatro perfiles base de ritmo:",
    "your_profile_badge": "Tu perfil",
    "profile_range_async": "≤ 3,7 o ≥ 25,8 d (Luna Nueva)",
    "profile_range_waxing": "3,7 – 11,1 d (Cuarto Creciente)",
    "profile_range_sync": "11,1 – 18,5 d (Luna Llena)",
    "profile_range_waning": "> 18,5 d (Cuarto Menguante)",
    "modes_title": "5 modos diarios aplicados",
    "modes_desc": "Para evaluar la dinámica diaria de comunicación y tareas, el motor analiza aspectos de tránsito planetario y los traduce en cinco escenarios:",
    "modes_decay_note": "El algoritmo incluye un historial de atenuación de 2 días y penalización por repetición para que las sugerencias no se queden fijas varios días seguidos.",
    "practice_title": "Cómo trabajar de forma práctica con esta app",
    "practice_step1_title": "1. Separa el cielo real de tu ciclo personal",
    "practice_step1_body": "Usa la fase del cielo para cuidar el sueño: de 3 a 5 noches antes de la luna llena atenúa la luz nocturna y evita cafeína o pantallas tarde. Usa tu fase personal (Impulso → Pico → Descenso → Mínimo) para dosificar tareas: arranques y retos en Impulso y Pico; rutina y cierres en Descenso; descanso y carga mínima en Mínimo.",
    "practice_step2_title": "2. Consulta los días lunares por franjas horarias",
    "practice_step2_body": "No te guíes a ciegas por un número de día lunar: revisa la hora de transición (salida de la Luna) y qué día lunar rige en la franja que necesitas (09:00, 14:00, 20:00). Ten en cuenta tus coordenadas: por defecto se calculan por zona horaria sin GPS, pero puedes fijar latitud y longitud exactas en Ajustes.",
    "practice_step3_title": "3. Calibra el modelo en 1 o 2 meses",
    "practice_step3_body": "La app ofrece una hipótesis estructurada de ritmo, no una ley rígida. Anota durante uno o dos ciclos lunares los días de mayor claridad, cansancio y calidad de sueño para comprobar qué avisos encajan mejor con tu agenda real.",
    "science_ok_badge": "Respaldado por estudios",
    "science_light_title": "Luz nocturna y ritmos circadianos",
    "science_light_intro": "Antes de la luz eléctrica, la luz lunar era la principal fuente brillante nocturna. La fisiología reacciona justamente a esa iluminación:",
    "science_light_p1": "Entre 3 y 5 noches antes de la luna llena, la Luna brillante ilumina el anochecer tras la puesta del Sol y retrasa el inicio del sueño.",
    "science_light_p2": "Se observa una reducción media del sueño de 20–25 minutos y menor proporción de sueño profundo (en ciudad suele quedar enmascarado por luces artificiales y pantallas).",
    "science_light_sources": "Fuentes: Casiraghi et al., Science Advances (2021); Cajochen et al., Current Biology (2013).",
    "science_myth_badge": "Mito frecuente",
    "science_gravity_title": "Gravedad y «mareas en el cuerpo»",
    "science_gravity_p1": "Las mareas oceánicas existen solo por la enorme extensión planetaria de las masas de agua.",
    "science_gravity_p2": "A escala del cuerpo humano el gradiente gravitatorio lunar es despreciable, menor que la atracción de un edificio o vehículo cercano.",
    "science_gravity_conclusion": "Conclusión: el factor físico es la luz nocturna y el sueño, no la «atracción del agua».",
    "science_disclaimer_title": "Aclaración honesta sobre la fecha de nacimiento",
    "science_disclaimer_body": "La biología moderna no aporta pruebas de que la fase lunar al nacer programe físicamente los ciclos hormonales o de energía en adultos. Aquí la fecha de nacimiento funciona como ancla práctica de autoorganización en un ciclo de 29,5 días, no como ley física.",
    "canvas_south": "SUR",
    "canvas_moon_hidden": "Luna (oculta)",
    "canvas_culmination_prefix": "Sur ~",
    "canvas_set_prefix": "Puesta ~",
    "canvas_timeline_24h": "Sobre el horizonte (24 h)",
    "label_earth_view": "Vista terrestre",
    "canvas_rise_exact_prefix": "Salida ",
    "canvas_culmination_exact_prefix": "Sur ",
    "canvas_set_exact_prefix": "Puesta ",
    "canvas_sun_below": "Sol bajo el horizonte",
    "horizon_live_mode": "Real (hoy)",
    "horizon_model_mode": "Modelo ~",
    "horizon_sun_label": "Sol",
    "horizon_date_label": "Fecha de observación",
    "horizon_fact_label": "Hecho",
    "horizon_next_event_label": "Próximo evento",
    "horizon_after_label": "en",
    "horizon_before_label": "antes de",
    "horizon_no_more_events": "no hay más eventos hoy",
    "horizon_transit_word": "culminación",
    "horizon_below": "bajo el horizonte",
    "horizon_behind": "a la espalda (norte)",
    "horizon_elong_word": "elongación",
    "horizon_drift_title": "Desplazamiento diario de la salida de la Luna, min/día",
    "horizon_phase_hint": "El control de fase elige la fecha más cercana con esa elongación: el cielo se muestra siempre con datos reales, aquí no hay modelo promedio.",
    "horizon_drift_tomorrow": "Mañana",
    "horizon_drift_avg": "promedio",
    "horizon_drift_range": "rango",
    "horizon_drift_unit": "min/día",
    "horizon_lunar_link_label": "Día lunar",
    "horizon_lunar_link_note": "el día lunar termina en la siguiente salida de la Luna.",
    "coord_north": "N",
    "coord_east": "E",
    "dur_h": "h",
    "dur_m": "min",
    "days_summary_label": "Día lunar",
    "days_from_label": "desde",
    "days_to_label": "hasta",
    "days_duration_label": "duración",
    "days_step_label": "desplazamiento por día",
    "days_today_prefix": "Hoy",
    "days_today_is_selected": "Es el día mostrado en el gráfico.",
    "days_today_other": "Mueva el control hasta ese día.",
    "days_explain_label": "Desplazamiento por día en este ciclo",
    "days_explain_avg": "en promedio",
    "days_explain_cause": "La Luna orbita la Tierra de forma irregular (más rápido en el perigeo) y su declinación cambia de forma irregular: en las estaciones el orto apenas se mueve y luego salta hora y media.",
    "days_no_rise": "sin salida",
    "days_two_rises": "2 salidas",
    "days_today": "hoy",
    "days_legend": "banda = día lunar, punto = salida de la Luna, rombo = luna nueva",
    "days_day_word": "día",
    "horizon_later_than": "después del Sol",
    "horizon_earlier_than": "antes que el Sol",
    "horizon_tomorrow_word": "mañana",
    "days_new_moon": "luna nueva",
    "horizon_twilight_label": "crepúsculo (Sol bajo −6°)",
    "horizon_next_rise": "Próxima salida de la Luna:",
    "canvas_you": "Tú",
    "horizon_col_rise": "Salida",
    "horizon_col_culm": "Culminación",
    "horizon_col_set": "Puesta",
    "horizon_summary_card_title": "Resumen de la fecha seleccionada",
    "horizon_next_card_title": "Próximo evento",
    "horizon_lunar_card_title": "Relación con el día lunar",
    "horizon_tip_card_title": "Comparación entre Sol y Luna",
    "horizon_drift_tomorrow_label": "Mañana",
    "horizon_drift_avg_label": "Promedio 7 días",
    "horizon_drift_range_label": "Rango",
    "days_selected_card_title": "Día lunar seleccionado",
    "days_today_card_title": "Día lunar actual",
    "days_explain_card_title": "Por qué cambia el desplazamiento",
    "days_selected_badge": "En gráfico",
    "phase_short_new_moon": "luna nueva",
    "phase_short_waxing_crescent": "creciente",
    "phase_short_first_quarter": "cuarto creciente",
    "phase_short_waxing_gibbous": "gibosa creciente",
    "phase_short_full_moon": "luna llena",
    "phase_short_waning_gibbous": "gibosa menguante",
    "phase_short_last_quarter": "cuarto menguante",
    "phase_short_waning_crescent": "menguante",
    "horizon_diff_prefix": "",
    "days_legend_bar": "día lunar",
    "days_legend_rise": "salida",
    "days_selected_heading_tpl": "Día lunar {day} seleccionado",
    "days_today_heading_tpl": "Hoy: día lunar {day}"
  }
};
