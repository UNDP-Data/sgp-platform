export type GlossaryTranslationRow = [string, string, string, string, string, string, string];

// Authoritative terminology from “SGP Glossary Translations - Translation Glossary.csv”.
// Column order follows the application locale order: en, pt, fr, es, ru, zh, ar.
export const GLOSSARY_TRANSLATION_ROWS: GlossaryTranslationRow[] = [
  ["SGP", "SGP", "PMF", "PPD", "ПМГ", "SGP", "SGP"],
  ["GEF", "GEF", "FEM", "FMAM", "ГЭФ", "GEF", "GEF"],
  ["UNDP", "PNUD", "PNUD", "PNUD", "ПРООН", "UNDP", "UNDP"],
  ["FAO", "FAO", "FAO", "FAO", "ФАО", "粮农组织", "الفاو"],
  ["CI", "CI", "CI", "CI", "CI", "CI", "CI"],

  ["SGP (Small Grants Programme)", "SGP (Programa de Pequenas Subvenções)", "PMF (Programme de microfinancements)", "PPD (Programa de Pequeñas Donaciones)", "ПМГ (Программа малых грантов)", "SGP（小额赠款计划）", "SGP (برنامج المنح الصغيرة)"],
  ["GEF (Global Environment Facility)", "GEF (Fundo Global para o Meio Ambiente)", "FEM (Fonds pour l’environnement mondial)", "FMAM (Fondo para el Medio Ambiente Mundial)", "ГЭФ (Глобальный экологический фонд)", "GEF（全球环境基金）", "GEF (مرفق البيئة العالمية)"],
  ["CSO (Civil society organization)", "OSC (Organização da sociedade civil)", "OSC (Organisation de la société civile)", "OSC (Organización de la sociedad civil)", "ОГО (Организация гражданского общества)", "CSO（民间社会组织）", "CSO (منظمة من منظمات المجتمع المدني)"],
  ["NSC (National Steering Committee)", "CDN (Comité Director Nacional)", "CNP (Comité national de pilotage)", "CDN (Comité Directivo Nacional)", "НКК (Национальный координационный комитет)", "NSC（国家指导委员会）", "NSC (اللجنة التوجيهية الوطنية)"],
  ["UNDP (United Nations Development Programme)", "PNUD (Programa das Nações Unidas para o Desenvolvimento)", "PNUD (Programme des Nations Unies pour le développement)", "PNUD (Programa de las Naciones Unidas para el Desarrollo)", "ПРООН (Программа развития ООН)", "UNDP（联合国开发计划署）", "UNDP (برنامج الأمم المتحدة الإنمائي)"],
  ["FAO (Food and Agriculture Organization of the United Nations)", "FAO (Organização das Nações Unidas para a Alimentação e a Agricultura)", "FAO (Organisation des Nations Unies pour l’alimentation et l’agriculture)", "FAO (Organización de las Naciones Unidas para la Alimentación y la Agricultura)", "ФАО (Продовольственная и сельскохозяйственная организация ООН)", "粮农组织（联合国粮食及农业组织）", "الفاو (منظمة الأغذية والزراعة للأمم المتحدة)"],
  ["CI (Conservation International)", "CI (Conservação Internacional)", "CI (Conservation International)", "CI (Conservación Internacional)", "CI (Conservation International)", "CI（保护国际基金会）", "CI (منظمة الحفظ الدولية)"],
  ["NGO (Non-governmental organization)", "ONG (Organização não governamental)", "ONG (Organisation non gouvernementale)", "ONG (Organización no gubernamental)", "НПО (Неправительственная организация)", "NGO（非政府组织）", "NGO (منظمة غير حكومية)"],
  ["CBO (Community-based organization)", "OBC (Organização de base comunitária)", "OCB (Organisation communautaire de base)", "OCB (Organización comunitaria de base)", "CBO (Организация местного сообщества)", "CBO（社区组织）", "CBO (منظمة مجتمعية)"],
  ["CPMT (Central Programme Management Team)", "CPMT (Equipa Central de Gestão do Programa)", "CPMT (Équipe centrale de gestion du programme)", "CPMT (Equipo Central de Gestión del Programa)", "CPMT (Центральная группа управления программой)", "CPMT（中央项目管理团队）", "CPMT (فريق الإدارة المركزية للبرنامج)"],
  ["KM (Knowledge Management)", "GC (Gestão do conhecimento)", "GC (Gestion des connaissances)", "GC (Gestión del conocimiento)", "УЗ (Управление знаниями)", "KM（知识管理）", "KM (إدارة المعرفة)"],
  ["CPS (Country Programme Strategy)", "CPS (Estratégia Nacional do Programa)", "SPP (Stratégie du programme pays)", "EPP (Estrategia del Programa País)", "ССП (Стратегия страновой программы)", "CPS（国家方案战略）", "CPS (استراتيجية البرنامج القطري)"],
  ["MEA (Multilateral environmental agreement)", "MEA (Acordo multilateral sobre o meio ambiente)", "AME (Accord multilatéral sur l’environnement)", "AMUMA (Acuerdo multilateral sobre el medio ambiente)", "МПС (Многостороннее природоохранное соглашение)", "MEA（多边环境协定）", "MEA (اتفاق بيئي متعدد الأطراف)"],
  ["IUCN (International Union for Conservation of Nature)", "UICN (União Internacional para a Conservação da Natureza)", "UICN (Union internationale pour la conservation de la nature)", "UICN (Unión Internacional para la Conservación de la Naturaleza)", "МСОП (Международный союз охраны природы)", "IUCN（世界自然保护联盟）", "IUCN (الاتحاد الدولي لحفظ الطبيعة)"],

  ["GEF SGP Knowledge and Learning Platform", "Plataforma de Conhecimento e Aprendizagem do SGP do GEF", "Plateforme de connaissances et d’apprentissage du PMF du FEM", "Plataforma de Conocimiento y Aprendizaje del PPD del FMAM", "Платформа знаний и обучения ПМГ ГЭФ", "全球环境基金小额赠款计划知识与学习平台", "منصة المعرفة والتعلم لبرنامج المنح الصغيرة التابع لمرفق البيئة العالمية"],
  ["GEF Secretariat", "Secretariado do GEF", "Secrétariat du FEM", "Secretaría del FMAM", "Секретариат ГЭФ", "全球环境基金秘书处", "أمانة مرفق البيئة العالمية"],
  ["GEF CSO Network", "Rede de OSC do GEF", "Réseau des OSC du FEM", "Red de OSC del FMAM", "Сеть ОГО ГЭФ", "全球环境基金民间社会组织网络", "شبكة منظمات المجتمع المدني التابعة لمرفق البيئة العالمية"],
  ["GEF Agency", "Agência do GEF", "Agence du FEM", "Agencia del FMAM", "Агентство ГЭФ", "全球环境基金机构", "وكالة مرفق البيئة العالمية"],
  ["SGP Country Team", "Equipa nacional do SGP", "Équipe nationale du PMF", "Equipo de país del PPD", "Страновая команда ПМГ ГЭФ", "小额赠款计划国家团队", "الفريق القطري لبرنامج المنح الصغيرة"],
  ["Country Programme", "Programa nacional", "Programme pays", "Programa País", "Страновая программа", "国家方案", "البرنامج القطري"],
  ["National Coordinator", "Coordenador nacional / Coordenadora nacional", "Coordonnateur national / Coordonnatrice nationale", "Coordinador nacional / Coordinadora nacional", "Национальный координатор", "国家协调员", "المنسق الوطني"],
  ["Programme Assistant", "Assistente de programa", "Assistant de programme / Assistante de programme", "Asistente de programa", "Ассистент программы", "项目助理", "مساعد البرنامج"],
  ["CSO Grantee Partner", "OSC parceira/beneficiária de uma subvenção", "OSC partenaire/bénéficiaire d’une subvention", "OSC socia/beneficiaria de una donación", "ОГО — партнёр-грантополучатель", "民间社会组织合作伙伴/受赠方", "منظمة مجتمع مدني شريكة/مستفيدة من منحة"],
  ["PPG (Project Preparation Grant)", "PPG (Subvenção para a preparação do projeto)", "PPG (don pour la préparation du projet)", "DPP (Donación para la preparación del proyecto)", "PPG (Грант на подготовку проекта)", "PPG（项目编制赠款）", "PPG (منحة إعداد المشروع)"],
  ["GEF focal areas", "Áreas focais do GEF", "Domaines d’intervention du FEM", "Áreas focales del FMAM", "Тематические направления ГЭФ", "全球环境基金重点领域", "مجالات التركيز لمرفق البيئة العالمية"],
  ["GEF Programming Directions", "Orientações de programação do GEF", "Orientations de programmation du FEM", "Orientaciones de programación del FMAM", "Программные направления ГЭФ", "全球环境基金规划方向", "توجيهات البرمجة لمرفق البيئة العالمية"],
  ["Operational Phase", "Fase operacional (OP)", "Phase opérationnelle (OP)", "Fase operativa (OP)", "Операционная фаза (ОФ)", "执行阶段（OP）", "المرحلة التشغيلية (OP)"],
  ["SGP Innovation Library", "Biblioteca de Inovação do SGP", "Bibliothèque de l’innovation du PMF", "Biblioteca de Innovación del PPD", "Библиотека инноваций ПМГ", "小额赠款计划创新资料库", "مكتبة الابتكار لبرنامج المنح الصغيرة"],
];
