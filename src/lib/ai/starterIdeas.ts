import type { Locale } from "../../i18n";

type LocalizedStarterIdea = Readonly<Record<Locale, string>>;

const idea = (
  en: string,
  pt: string,
  fr: string,
  es: string,
  ru: string,
  zh: string,
  ar: string
): LocalizedStarterIdea => ({ en, pt, fr, es, ru, zh, ar });

export const ASSISTANT_STARTER_IDEAS: readonly LocalizedStarterIdea[] = [
  idea(
    "What lessons have SGP-supported grants generated on coastal resilience?",
    "Que lições as subvenções apoiadas pelo SGP geraram sobre resiliência costeira?",
    "Quels enseignements les subventions soutenues par le SGP ont-elles produits sur la résilience côtière ?",
    "¿Qué lecciones han generado las subvenciones apoyadas por el SGP sobre resiliencia costera?",
    "Какие уроки были извлечены из поддержанных SGP грантов в области устойчивости прибрежных районов?",
    "SGP 支持的赠款在沿海韧性方面带来了哪些经验？",
    "ما الدروس التي أسفرت عنها المنح المدعومة من برنامج المنح الصغيرة بشأن القدرة على الصمود الساحلي؟"
  ),
  idea(
    "Which SGP knowledge products discuss Indigenous Peoples and biodiversity?",
    "Que produtos de conhecimento do SGP abordam os Povos Indígenas e a biodiversidade?",
    "Quels produits de connaissance du SGP traitent des Peuples autochtones et de la biodiversité ?",
    "¿Qué productos de conocimiento del SGP abordan los Pueblos Indígenas y la biodiversidad?",
    "В каких информационных материалах SGP рассматриваются коренные народы и биоразнообразие?",
    "哪些 SGP 知识产品探讨了原住民与生物多样性？",
    "ما المنتجات المعرفية لبرنامج المنح الصغيرة التي تتناول الشعوب الأصلية والتنوع البيولوجي؟"
  ),
  idea(
    "What evidence do SGP publications provide on community-based adaptation?",
    "Que evidências as publicações do SGP apresentam sobre adaptação de base comunitária?",
    "Quelles données probantes les publications du SGP présentent-elles sur l’adaptation à base communautaire ?",
    "¿Qué evidencia aportan las publicaciones del SGP sobre adaptación basada en la comunidad?",
    "Какие данные приводятся в публикациях SGP об адаптации на уровне местных сообществ?",
    "SGP 出版物为社区适应提供了哪些证据？",
    "ما الأدلة التي تقدمها منشورات برنامج المنح الصغيرة بشأن التكيف القائم على المجتمع؟"
  ),
  idea(
    "How have women-led grantee initiatives strengthened environmental outcomes and local livelihoods?",
    "Como as iniciativas de beneficiários lideradas por mulheres fortaleceram os resultados ambientais e os meios de subsistência locais?",
    "Comment les initiatives de bénéficiaires dirigées par des femmes ont-elles renforcé les résultats environnementaux et les moyens de subsistance locaux ?",
    "¿Cómo han fortalecido las iniciativas de beneficiarios lideradas por mujeres los resultados ambientales y los medios de vida locales?",
    "Как инициативы грантополучателей под руководством женщин улучшили экологические результаты и местные источники средств к существованию?",
    "由妇女主导的受赠方倡议如何改善环境成果和当地生计？",
    "كيف عززت مبادرات الجهات المستفيدة التي تقودها النساء النتائج البيئية وسبل العيش المحلية؟"
  ),
  idea(
    "What roles have young people played in SGP-supported environmental initiatives?",
    "Que papéis os jovens desempenharam em iniciativas ambientais apoiadas pelo SGP?",
    "Quels rôles les jeunes ont-ils joués dans les initiatives environnementales soutenues par le SGP ?",
    "¿Qué funciones han desempeñado los jóvenes en las iniciativas ambientales apoyadas por el SGP?",
    "Какую роль молодёжь играла в природоохранных инициативах, поддержанных SGP?",
    "青年在 SGP 支持的环境倡议中发挥了哪些作用？",
    "ما الأدوار التي اضطلع بها الشباب في المبادرات البيئية المدعومة من برنامج المنح الصغيرة؟"
  ),
  idea(
    "How has traditional knowledge informed conservation decisions in SGP-supported grants?",
    "Como o conhecimento tradicional orientou decisões de conservação em subvenções apoiadas pelo SGP?",
    "Comment les savoirs traditionnels ont-ils éclairé les décisions de conservation dans les subventions soutenues par le SGP ?",
    "¿Cómo han orientado los conocimientos tradicionales las decisiones de conservación en las subvenciones apoyadas por el SGP?",
    "Как традиционные знания влияли на природоохранные решения в грантах, поддержанных SGP?",
    "传统知识如何为 SGP 支持的赠款中的保护决策提供依据？",
    "كيف أسهمت المعارف التقليدية في توجيه قرارات الحفظ ضمن المنح المدعومة من برنامج المنح الصغيرة؟"
  ),
  idea(
    "What approaches to ecosystem restoration appear across SGP publications?",
    "Que abordagens de restauração de ecossistemas aparecem nas publicações do SGP?",
    "Quelles approches de restauration des écosystèmes ressortent des publications du SGP ?",
    "¿Qué enfoques de restauración de ecosistemas aparecen en las publicaciones del SGP?",
    "Какие подходы к восстановлению экосистем представлены в публикациях SGP?",
    "SGP 出版物中介绍了哪些生态系统恢复方法？",
    "ما نُهج استعادة النظم الإيكولوجية الواردة في منشورات برنامج المنح الصغيرة؟"
  ),
  idea(
    "What community-level lessons have emerged on chemicals and waste management?",
    "Que lições em nível comunitário surgiram sobre a gestão de produtos químicos e resíduos?",
    "Quels enseignements au niveau communautaire se dégagent sur la gestion des produits chimiques et des déchets ?",
    "¿Qué lecciones a nivel comunitario han surgido sobre la gestión de productos químicos y residuos?",
    "Какие уроки на уровне местных сообществ были извлечены в области управления химическими веществами и отходами?",
    "在化学品和废物管理方面形成了哪些社区层面的经验？",
    "ما الدروس المستفادة على مستوى المجتمعات بشأن إدارة المواد الكيميائية والنفايات؟"
  ),
  idea(
    "How have SGP-supported grants contributed to sustainable land management?",
    "Como as subvenções apoiadas pelo SGP contribuíram para a gestão sustentável da terra?",
    "Comment les subventions soutenues par le SGP ont-elles contribué à la gestion durable des terres ?",
    "¿Cómo han contribuido las subvenciones apoyadas por el SGP a la gestión sostenible de la tierra?",
    "Как гранты, поддержанные SGP, способствовали устойчивому управлению земельными ресурсами?",
    "SGP 支持的赠款如何促进可持续土地管理？",
    "كيف أسهمت المنح المدعومة من برنامج المنح الصغيرة في الإدارة المستدامة للأراضي؟"
  ),
  idea(
    "What do SGP publications report about community renewable energy solutions?",
    "O que as publicações do SGP relatam sobre soluções comunitárias de energia renovável?",
    "Que rapportent les publications du SGP sur les solutions communautaires d’énergie renouvelable ?",
    "¿Qué informan las publicaciones del SGP sobre soluciones comunitarias de energía renovable?",
    "Что сообщается в публикациях SGP о решениях в области возобновляемой энергетики для местных сообществ?",
    "SGP 出版物对社区可再生能源解决方案有哪些介绍？",
    "ماذا تذكر منشورات برنامج المنح الصغيرة عن حلول الطاقة المتجددة المجتمعية؟"
  ),
  idea(
    "What trends are highlighted in SGP annual monitoring reports?",
    "Que tendências são destacadas nos relatórios anuais de monitoramento do SGP?",
    "Quelles tendances sont mises en évidence dans les rapports annuels de suivi du SGP ?",
    "¿Qué tendencias destacan los informes anuales de seguimiento del SGP?",
    "Какие тенденции отмечаются в ежегодных отчётах SGP по мониторингу?",
    "SGP 年度监测报告重点呈现了哪些趋势？",
    "ما الاتجاهات التي تبرزها تقارير الرصد السنوية لبرنامج المنح الصغيرة؟"
  ),
  idea(
    "How have SGP country programme strategies adapted global priorities to local contexts?",
    "Como as estratégias dos programas nacionais do SGP adaptaram prioridades globais aos contextos locais?",
    "Comment les stratégies des programmes nationaux du SGP ont-elles adapté les priorités mondiales aux contextes locaux ?",
    "¿Cómo han adaptado las estrategias de los programas nacionales del SGP las prioridades mundiales a los contextos locales?",
    "Как стратегии страновых программ SGP адаптировали глобальные приоритеты к местным условиям?",
    "SGP 国家方案战略如何使全球优先事项适应当地情况？",
    "كيف كيّفت استراتيجيات البرامج القطرية لبرنامج المنح الصغيرة الأولويات العالمية مع السياقات المحلية؟"
  ),
  idea(
    "What guidance exists for National Steering Committees on grant selection and oversight?",
    "Que orientações existem para os Comitês Diretivos Nacionais sobre seleção e supervisão de subvenções?",
    "Quelles orientations existent pour les comités directeurs nationaux sur la sélection et le suivi des subventions ?",
    "¿Qué orientaciones existen para los Comités Directivos Nacionales sobre la selección y supervisión de subvenciones?",
    "Какие рекомендации существуют для национальных руководящих комитетов по отбору и надзору за грантами?",
    "针对国家指导委员会的赠款遴选和监督工作有哪些指导？",
    "ما الإرشادات المتاحة للجان التوجيهية الوطنية بشأن اختيار المنح والإشراف عليها؟"
  ),
  idea(
    "Which monitoring indicators have been used to capture community and environmental results?",
    "Que indicadores de monitoramento foram usados para captar resultados comunitários e ambientais?",
    "Quels indicateurs de suivi ont été utilisés pour mesurer les résultats communautaires et environnementaux ?",
    "¿Qué indicadores de seguimiento se han utilizado para captar resultados comunitarios y ambientales?",
    "Какие показатели мониторинга использовались для оценки результатов для сообществ и окружающей среды?",
    "采用了哪些监测指标来反映社区和环境成果？",
    "ما مؤشرات الرصد التي استُخدمت لقياس النتائج المجتمعية والبيئية؟"
  ),
  idea(
    "What lessons have been documented on replicating or scaling successful grantee practices?",
    "Que lições foram documentadas sobre a replicação ou ampliação de práticas bem-sucedidas de beneficiários?",
    "Quels enseignements ont été documentés sur la reproduction ou le déploiement à plus grande échelle des pratiques réussies des bénéficiaires ?",
    "¿Qué lecciones se han documentado sobre la réplica o ampliación de prácticas exitosas de los beneficiarios?",
    "Какие уроки задокументированы в отношении тиражирования или масштабирования успешных практик грантополучателей?",
    "在复制或扩大受赠方成功实践方面记录了哪些经验？",
    "ما الدروس الموثقة بشأن تكرار ممارسات الجهات المستفيدة الناجحة أو توسيع نطاقها؟"
  ),
  idea(
    "How have partnerships and cofinancing supported the results of SGP-funded grants?",
    "Como as parcerias e o cofinanciamento apoiaram os resultados das subvenções financiadas pelo SGP?",
    "Comment les partenariats et le cofinancement ont-ils soutenu les résultats des subventions financées par le SGP ?",
    "¿Cómo han apoyado las alianzas y la cofinanciación los resultados de las subvenciones financiadas por el SGP?",
    "Как партнёрства и софинансирование поддержали результаты грантов, финансируемых SGP?",
    "伙伴关系和共同融资如何支持 SGP 资助赠款的成果？",
    "كيف دعمت الشراكات والتمويل المشترك نتائج المنح الممولة من برنامج المنح الصغيرة؟"
  ),
  idea(
    "What do SGP resources say about community conservation and ICCAs?",
    "O que os recursos do SGP dizem sobre conservação comunitária e ICCAs?",
    "Que disent les ressources du SGP sur la conservation communautaire et les APAC ?",
    "¿Qué dicen los recursos del SGP sobre la conservación comunitaria y los TICCA?",
    "Что говорится в материалах SGP об общинной охране природы и территориях ICCA?",
    "SGP 资源对社区保护和 ICCA 有哪些论述？",
    "ماذا تقول موارد برنامج المنح الصغيرة عن الحفظ المجتمعي ومناطق الشعوب الأصلية والمجتمعات المحلية؟"
  ),
  idea(
    "How have grantee initiatives linked watershed management with community water security?",
    "Como as iniciativas de beneficiários relacionaram a gestão de bacias hidrográficas com a segurança hídrica comunitária?",
    "Comment les initiatives des bénéficiaires ont-elles relié la gestion des bassins versants à la sécurité hydrique des communautés ?",
    "¿Cómo han vinculado las iniciativas de los beneficiarios la gestión de cuencas con la seguridad hídrica comunitaria?",
    "Как инициативы грантополучателей связывали управление водосборными бассейнами с водной безопасностью местных сообществ?",
    "受赠方倡议如何将流域管理与社区用水安全联系起来？",
    "كيف ربطت مبادرات الجهات المستفيدة بين إدارة مستجمعات المياه والأمن المائي للمجتمعات؟"
  ),
  idea(
    "What examples show climate adaptation and mitigation benefits being pursued together?",
    "Que exemplos mostram benefícios de adaptação e mitigação climática sendo buscados em conjunto?",
    "Quels exemples montrent que les bénéfices de l’adaptation et de l’atténuation climatiques ont été recherchés conjointement ?",
    "¿Qué ejemplos muestran beneficios de adaptación y mitigación climática perseguidos conjuntamente?",
    "Какие примеры показывают одновременное достижение выгод от адаптации к изменению климата и его смягчения?",
    "有哪些实例同时体现了气候适应和减缓效益？",
    "ما الأمثلة التي تُظهر السعي إلى تحقيق منافع التكيف مع تغير المناخ والتخفيف من آثاره معاً؟"
  ),
  idea(
    "What cross-country lessons emerge from SGP-supported grants working on similar environmental challenges?",
    "Que lições entre países surgem de subvenções apoiadas pelo SGP que atuam em desafios ambientais semelhantes?",
    "Quels enseignements comparatifs ressortent des subventions soutenues par le SGP face à des défis environnementaux similaires ?",
    "¿Qué lecciones entre países surgen de las subvenciones apoyadas por el SGP que abordan desafíos ambientales similares?",
    "Какие межстрановые уроки можно извлечь из поддержанных SGP грантов, направленных на схожие экологические проблемы?",
    "针对类似环境挑战的 SGP 支持赠款带来了哪些跨国经验？",
    "ما الدروس المشتركة بين البلدان المستخلصة من المنح المدعومة من برنامج المنح الصغيرة التي تعالج تحديات بيئية متشابهة؟"
  )
] as const;

export function starterIdeasForLocale(locale: Locale): string[] {
  return ASSISTANT_STARTER_IDEAS.map((item) => item[locale]);
}

export function selectStarterIdeas(
  locale: Locale,
  count = 3,
  random: () => number = Math.random
): string[] {
  const pool = starterIdeasForLocale(locale);
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.min(index, Math.floor(Math.max(0, random()) * (index + 1)));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}
