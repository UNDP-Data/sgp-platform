import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { GLOSSARY_TRANSLATION_ROWS } from "./i18n-glossary";
import { INTERFACE_COMPLETION_ROWS } from "./i18n-interface-completion";
import { FUNCTIONAL_WORKFLOW_TRANSLATION_ROWS } from "./i18n-functional-workflows";
import { OPERATIONAL_WORKSPACE_TRANSLATION_ROWS } from "./i18n-operational-workspaces";
import { GRANT_WORKBENCH_TRANSLATION_ROWS } from "./i18n-grant-workbench";
import { LEARNING_TRANSLATION_ROWS } from "./i18n-learning";
import { readStoredValue, writeStoredValue } from "./lib/browser/storage";
import {
  navigateToLocale,
  readRouteLocale,
  ROUTE_LOCALES,
  type RouteLocale
} from "./lib/browser/navigation";

export type Locale = RouteLocale;

export const LANGUAGES: { code: Locale; short: string; label: string; nativeLabel: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", short: "EN", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "pt", short: "PT", label: "Portuguese", nativeLabel: "Português", dir: "ltr" },
  { code: "fr", short: "FR", label: "French", nativeLabel: "Français", dir: "ltr" },
  { code: "es", short: "ES", label: "Spanish", nativeLabel: "Español", dir: "ltr" },
  { code: "ru", short: "RU", label: "Russian", nativeLabel: "Русский", dir: "ltr" },
  { code: "zh", short: "中文", label: "Chinese", nativeLabel: "中文", dir: "ltr" },
  { code: "ar", short: "ع", label: "Arabic", nativeLabel: "العربية", dir: "rtl" }
];

export type LocalizedMessageRow = readonly [string, string, string, string, string, string, string];

export function createLocalizedMessages<const Catalog extends Record<string, LocalizedMessageRow>>(messages: Catalog) {
  return {
    get(locale: Locale, id: keyof Catalog & string, variables: Record<string, string> = {}) {
      const index = LANGUAGES.findIndex((language) => language.code === locale);
      let value: string = messages[id][index];
      for (const [key, replacement] of Object.entries(variables)) value = value.replaceAll(`{${key}}`, replacement);
      return value;
    },
    coverage() {
      return Object.entries(messages).map(([id, row]) => ({
        id,
        complete: row.length === LANGUAGES.length && row.every((value) => value.trim().length > 0)
      }));
    }
  };
}

type TranslationRow = [string, string, string, string, string, string, string];
const rows: TranslationRow[] = [
  ["Skip to main content","Ir para o conteúdo principal","Aller au contenu principal","Ir al contenido principal","Перейти к основному содержанию","跳至主要内容","انتقل إلى المحتوى الرئيسي"],
  ["Knowledge & Learning Platform","Plataforma de Conhecimento e Aprendizagem","Plateforme de connaissances et d’apprentissage","Plataforma de Conocimiento y Aprendizaje","Платформа знаний и обучения","知识与学习平台","منصة المعرفة والتعلّم"],
  ["Knowledge &","Conhecimento e","Connaissances et","Conocimiento y","Знания и","知识与","المعرفة و"],
  ["Learning Platform","Plataforma de Aprendizagem","Plateforme d’apprentissage","Plataforma de Aprendizaje","Платформа обучения","学习平台","منصة التعلّم"],
  ["Learning","Aprendizagem","Apprentissage","Aprendizaje","Обучение","学习","التعلّم"],
  ["Platform","Plataforma","Plateforme","Plataforma","Платформа","平台","المنصة"],
  ["Funding & Grants","Financiamento e subsídios","Financement et subventions","Financiación y subvenciones","Финансирование и гранты","资金与赠款","التمويل والمنح"],
  ["Grant Portfolio","Portfólio de subsídios","Portefeuille de subventions","Cartera de subvenciones","Портфель грантов","赠款组合","محفظة المنح"],
  ["Knowledge & AI","Conhecimento e IA","Connaissances et IA","Conocimiento e IA","Знания и ИИ","知识与人工智能","المعرفة والذكاء الاصطناعي"],
  ["Stories & Voices","Histórias e Vozes","Histoires et Voix","Historias y Voces","Истории и голоса","故事与声音","القصص والأصوات"],
  ["Community & Events","Comunidade e Eventos","Communauté et événements","Comunidad y eventos","Сообщество и события","社区与活动","المجتمع والفعاليات"],
  ["Help","Ajuda","Aide","Ayuda","Помощь","帮助","المساعدة"],
  ["Dashboard","Painel","Tableau de bord","Panel","Панель","仪表板","لوحة المعلومات"],
  ["Knowledge","Conhecimento","Connaissances","Conocimiento","Знания","知识","المعرفة"],
  ["Impact","Impacto","Impact","Impacto","Воздействие","影响","الأثر"],
  ["Events","Eventos","Événements","Eventos","События","活动","الفعاليات"],
  ["Search","Pesquisar","Rechercher","Buscar","Поиск","搜索","بحث"],
  ["Primary navigation","Navegação principal","Navigation principale","Navegación principal","Основная навигация","主导航","التنقل الرئيسي"],
  ["Select language","Selecionar idioma","Choisir la langue","Seleccionar idioma","Выбрать язык","选择语言","اختر اللغة"],
  ["Language","Idioma","Langue","Idioma","Язык","语言","اللغة"],
  ["Open account menu","Abrir menu da conta","Ouvrir le menu du compte","Abrir menú de cuenta","Открыть меню аккаунта","打开账户菜单","فتح قائمة الحساب"],
  ["Public visitor","Visitante público","Visiteur public","Visitante público","Публичный посетитель","公众访客","زائر عام"],
  ["Reviewer","Avaliador","Évaluateur","Revisor","Эксперт","审核员","المراجع"],
  ["Agency administrator","Administrador da agência","Administrateur de l’agence","Administrador de la agencia","Администратор агентства","机构管理员","مسؤول الوكالة"],
  ["Global KLP administrator","Administrador global da KLP","Administrateur mondial de la KLP","Administrador global de KLP","Глобальный администратор KLP","全球 KLP 管理员","مسؤول منصة KLP العالمي"],
  ["Account","Conta","Compte","Cuenta","Аккаунт","账户","الحساب"],
  ["Sign in","Entrar","Se connecter","Iniciar sesión","Войти","登录","تسجيل الدخول"],
  ["Sign in as test user","Entrar como usuário de teste","Se connecter comme utilisateur de test","Iniciar sesión como usuario de prueba","Войти как тестовый пользователь","以测试用户身份登录","تسجيل الدخول كمستخدم تجريبي"],
  ["Select user type","Selecionar tipo de usuário","Choisir le type d’utilisateur","Seleccionar tipo de usuario","Выбрать тип пользователя","选择用户类型","اختر نوع المستخدم"],
  ["Choose a test user to continue","Escolha um usuário de teste para continuar","Choisissez un utilisateur de test pour continuer","Elija un usuario de prueba para continuar","Выберите тестового пользователя, чтобы продолжить","选择测试用户以继续","اختر مستخدماً تجريبياً للمتابعة"],
  ["Log out","Sair","Se déconnecter","Cerrar sesión","Выйти","退出登录","تسجيل الخروج"],
  ["Return to the public experience","Voltar à experiência pública","Revenir à l’expérience publique","Volver a la experiencia pública","Вернуться к публичному режиму","返回公共体验","العودة إلى التجربة العامة"],
  ["2 unread updates","2 atualizações não lidas","2 mises à jour non lues","2 actualizaciones no leídas","2 непрочитанных обновления","2 条未读更新","تحديثان غير مقروءين"],
  ["Workspace access","Acesso ao espaço de trabalho","Accès à l’espace de travail","Acceso al espacio de trabajo","Доступ к рабочему пространству","工作区访问","الوصول إلى مساحة العمل"],
  ["Workspace","Espaço de trabalho","Espace de travail","Espacio de trabajo","Рабочее пространство","工作区","مساحة العمل"],
  ["Overview","Visão geral","Aperçu","Resumen","Обзор","概览","نظرة عامة"],
  ["Projects, applications and priorities","Projetos, candidaturas e prioridades","Projets, candidatures et priorités","Proyectos, solicitudes y prioridades","Проекты, заявки и приоритеты","项目、申请和优先事项","المشاريع والطلبات والأولويات"],
  ["Notifications","Notificações","Notifications","Notificaciones","Уведомления","通知","الإشعارات"],
  ["Saved items","Itens salvos","Éléments enregistrés","Elementos guardados","Сохранённые элементы","已保存项目","العناصر المحفوظة"],
  ["Your knowledge working set","Seu conjunto de conhecimentos","Votre sélection de connaissances","Tu conjunto de conocimientos","Ваша подборка знаний","您的知识工作集","مجموعة المعرفة الخاصة بك"],
  ["Profile & preferences","Perfil e preferências","Profil et préférences","Perfil y preferencias","Профиль и настройки","个人资料与偏好","الملف الشخصي والتفضيلات"],
  ["Language and account settings","Configurações de idioma e conta","Paramètres de langue et de compte","Configuración de idioma y cuenta","Настройки языка и аккаунта","语言和账户设置","إعدادات اللغة والحساب"],
  ["Follow Us","Siga-nos","Suivez-nous","Síguenos","Следите за нами","关注我们","تابعونا"],
  ["Who We Are","Quem somos","Qui sommes-nous","Quiénes somos","О нас","关于我们","من نحن"],
  ["Privacy","Privacidade","Confidentialité","Privacidad","Конфиденциальность","隐私","الخصوصية"],
  ["Accessibility","Acessibilidade","Accessibilité","Accesibilidad","Доступность","无障碍","إمكانية الوصول"],
  ["Legal","Jurídico","Mentions légales","Legal","Правовая информация","法律信息","الشؤون القانونية"],
  ["Contact Us","Fale conosco","Contactez-nous","Contáctenos","Связаться с нами","联系我们","اتصل بنا"],
  ["Knowledge and Learning Platform","Plataforma de Conhecimento e Aprendizagem","Plateforme de connaissances et d’apprentissage","Plataforma de Conocimiento y Aprendizaje","Платформа знаний и обучения","知识与学习平台","منصة المعرفة والتعلّم"],
  ["Find opportunities","Encontrar oportunidades","Trouver des opportunités","Encontrar oportunidades","Найти возможности","寻找机会","البحث عن فرص"],
  ["Explore the portfolio","Explorar o portfólio","Explorer le portefeuille","Explorar la cartera","Изучить портфель","探索项目组合","استكشاف المحفظة"],
  ["Browse the Innovation Library","Explorar a Biblioteca de Inovação","Parcourir la Bibliothèque de l’innovation","Explorar la Biblioteca de Innovación","Открыть библиотеку инноваций","浏览创新资料库","تصفح مكتبة الابتكار"],
  ["Choose a journey","Escolha um percurso","Choisissez un parcours","Elige un recorrido","Выберите путь","选择路径","اختر مساراً"],
  ["Welcome back","Bem-vindo de volta","Bienvenue","Bienvenido de nuevo","С возвращением","欢迎回来","مرحباً بعودتك"],
  ["My workspace","Meu espaço de trabalho","Mon espace de travail","Mi espacio de trabajo","Моё рабочее пространство","我的工作区","مساحة عملي"],
  ["Open workspace","Abrir espaço de trabalho","Ouvrir l’espace de travail","Abrir espacio de trabajo","Открыть рабочее пространство","打开工作区","فتح مساحة العمل"],
  ["Active work","Trabalho ativo","Travail en cours","Trabajo activo","Активная работа","当前工作","العمل النشط"],
  ["Projects and applications","Projetos e candidaturas","Projets et candidatures","Proyectos y solicitudes","Проекты и заявки","项目和申请","المشاريع والطلبات"],
  ["Priority queue","Fila de prioridades","File des priorités","Cola de prioridades","Очередь приоритетов","优先事项队列","قائمة الأولويات"],
  ["At a glance","Em resumo","En bref","De un vistazo","Кратко","概览","لمحة سريعة"],
  ["Unread notifications","Notificações não lidas","Notifications non lues","Notificaciones no leídas","Непрочитанные уведомления","未读通知","إشعارات غير مقروءة"],
  ["Saved knowledge items","Itens de conhecimento salvos","Éléments de connaissance enregistrés","Elementos de conocimiento guardados","Сохранённые материалы","已保存知识条目","عناصر المعرفة المحفوظة"],
  ["Platform journeys","Percursos da plataforma","Parcours de la plateforme","Recorridos de la plataforma","Маршруты платформы","平台路径","مسارات المنصة"],
  ["Continue exploring","Continuar explorando","Continuer l’exploration","Seguir explorando","Продолжить изучение","继续探索","متابعة الاستكشاف"],
  ["Eligibility & guidance","Elegibilidade e orientação","Éligibilité et conseils","Elegibilidad y orientación","Критерии и руководство","资格与指南","الأهلية والإرشادات"],
  ["How funding works","Como funciona o financiamento","Fonctionnement du financement","Cómo funciona la financiación","Как работает финансирование","资金机制","كيفية عمل التمويل"],
  ["Opportunity overview","Visão geral da oportunidade","Aperçu de l’opportunité","Resumen de la oportunidad","Обзор возможности","机会概览","نظرة عامة على الفرصة"],
  ["Templates & guidance","Modelos e orientação","Modèles et conseils","Plantillas y orientación","Шаблоны и руководство","模板与指南","النماذج والإرشادات"],
  ["Related guidance","Orientação relacionada","Conseils associés","Orientación relacionada","Связанные рекомендации","相关指南","إرشادات ذات صلة"],
  ["Grant Portfolio","Portfólio de subsídios","Portefeuille de subventions","Cartera de subvenciones","Портфель грантов","赠款组合","محفظة المنح"],
  ["Explore the live atlas","Explorar o atlas ao vivo","Explorer l’atlas interactif","Explorar el atlas interactivo","Открыть интерактивный атлас","探索实时地图集","استكشاف الأطلس التفاعلي"],
  ["Project explorer","Explorador de projetos","Explorateur de projets","Explorador de proyectos","Обзор проектов","项目浏览器","مستكشف المشاريع"],
  ["Country views","Visões por país","Vues par pays","Vistas por país","Обзоры стран","国家视图","عرض البلدان"],
  ["Thematic views","Visões temáticas","Vues thématiques","Vistas temáticas","Тематические обзоры","主题视图","العروض المواضيعية"],
  ["Explore interactively","Explorar interativamente","Explorer de façon interactive","Explorar de forma interactiva","Исследовать интерактивно","互动探索","استكشاف تفاعلي"],
  ["Knowledge Studio","Estúdio de Conhecimento","Studio de connaissances","Estudio de Conocimiento","Студия знаний","知识工作室","استوديو المعرفة"],
  ["Innovation Library","Biblioteca de Inovação","Bibliothèque de l’innovation","Biblioteca de Innovación","Библиотека инноваций","创新资料库","مكتبة الابتكار"],
  ["Project Knowledge Base","Base de Conhecimento de Projetos","Base de connaissances des projets","Base de Conocimiento de Proyectos","База знаний проектов","项目知识库","قاعدة معرفة المشاريع"],
  ["Search knowledge","Pesquisar conhecimento","Rechercher dans les connaissances","Buscar conocimiento","Поиск по знаниям","搜索知识","البحث في المعرفة"],
  ["Search project knowledge","Pesquisar conhecimento de projetos","Rechercher dans les connaissances des projets","Buscar conocimiento de proyectos","Поиск по знаниям проектов","搜索项目知识","البحث في معرفة المشاريع"],
  ["Search title, text, place or theme","Pesquisar título, texto, local ou tema","Rechercher un titre, un texte, un lieu ou un thème","Buscar título, texto, lugar o tema","Искать по названию, тексту, месту или теме","搜索标题、文本、地点或主题","البحث في العنوان أو النص أو المكان أو الموضوع"],
  ["Refine","Refinar","Affiner","Refinar","Уточнить","筛选","تحسين البحث"],
  ["Record type","Tipo de registro","Type de document","Tipo de registro","Тип записи","记录类型","نوع السجل"],
  ["Source","Fonte","Source","Fuente","Источник","来源","المصدر"],
  ["Status","Estado","Statut","Estado","Статус","状态","الحالة"],
  ["Year","Ano","Année","Año","Год","年份","السنة"],
  ["Save resource","Salvar recurso","Enregistrer la ressource","Guardar recurso","Сохранить материал","保存资源","حفظ المورد"],
  ["Remove from saved","Remover dos salvos","Retirer des éléments enregistrés","Quitar de guardados","Удалить из сохранённых","从收藏中移除","إزالة من المحفوظات"],
  ["Open canonical source","Abrir fonte canônica","Ouvrir la source canonique","Abrir fuente canónica","Открыть канонический источник","打开规范来源","فتح المصدر الأصلي"],
  ["Ask about this source","Perguntar sobre esta fonte","Interroger cette source","Preguntar sobre esta fuente","Спросить об этом источнике","询问此来源","اسأل عن هذا المصدر"],
  ["No matching records","Nenhum registro correspondente","Aucun résultat correspondant","No hay registros coincidentes","Совпадений не найдено","没有匹配记录","لا توجد سجلات مطابقة"],
  ["Saved knowledge","Conhecimento salvo","Connaissances enregistrées","Conocimiento guardado","Сохранённые знания","已保存知识","المعرفة المحفوظة"],
  ["No saved knowledge yet","Ainda não há conhecimento salvo","Aucune connaissance enregistrée","Aún no hay conocimiento guardado","Сохранённых материалов пока нет","尚无已保存知识","لا توجد معرفة محفوظة بعد"],
  ["Stories & Voices","Histórias e Vozes","Histoires et Voix","Historias y Voces","Истории и голоса","故事与声音","القصص والأصوات"],
  ["Stories","Histórias","Histoires","Historias","Истории","故事","القصص"],
  ["Voices","Vozes","Voix","Voces","Голоса","声音","الأصوات"],
  ["Photos","Fotos","Photos","Fotos","Фотографии","照片","الصور"],
  ["Publications","Publicações","Publications","Publicaciones","Публикации","出版物","المنشورات"],
  ["Search the editorial archive","Pesquisar no arquivo editorial","Rechercher dans les archives éditoriales","Buscar en el archivo editorial","Поиск по редакционному архиву","搜索编辑档案","البحث في الأرشيف التحريري"],
  ["Featured community story","História comunitária em destaque","Récit communautaire à la une","Historia comunitaria destacada","Избранная история сообщества","精选社区故事","قصة مجتمعية مميزة"],
  ["Community stories","Histórias comunitárias","Récits communautaires","Historias comunitarias","Истории сообществ","社区故事","قصص المجتمع"],
  ["Read the story","Ler a história","Lire le récit","Leer la historia","Читать историю","阅读故事","قراءة القصة"],
  ["Read story","Ler história","Lire le récit","Leer historia","Читать","阅读故事","قراءة القصة"],
  ["Show more stories","Mostrar mais histórias","Afficher plus de récits","Mostrar más historias","Показать больше историй","显示更多故事","عرض المزيد من القصص"],
  ["Watch and listen","Assistir e ouvir","Regarder et écouter","Ver y escuchar","Смотреть и слушать","观看与收听","شاهد واستمع"],
  ["SGP Voices","Vozes do SGP","Voix du SGP","Voces de SGP","Голоса SGP","SGP 之声","أصوات برنامج المنح الصغيرة"],
  ["Show more voices","Mostrar mais vozes","Afficher plus de voix","Mostrar más voces","Показать больше видео","显示更多声音","عرض المزيد من الأصوات"],
  ["More films","Mais filmes","Plus de films","Más películas","Больше фильмов","更多影片","المزيد من الأفلام"],
  ["Field photography","Fotografia de campo","Photographie de terrain","Fotografía de campo","Полевая фотография","实地摄影","التصوير الميداني"],
  ["Photo stories","Histórias fotográficas","Récits photographiques","Historias fotográficas","Фотоистории","图片故事","قصص مصورة"],
  ["Show more photography","Mostrar mais fotografias","Afficher plus de photos","Mostrar más fotografías","Показать больше фотографий","显示更多照片","عرض المزيد من الصور"],
  ["Evidence to use","Evidências para usar","Des ressources à utiliser","Evidencia para usar","Материалы для работы","可用证据","أدلة للاستخدام"],
  ["Publications and field resources","Publicações e recursos de campo","Publications et ressources de terrain","Publicaciones y recursos de campo","Публикации и полевые материалы","出版物与实地资源","المنشورات والموارد الميدانية"],
  ["Open resource","Abrir recurso","Ouvrir la ressource","Abrir recurso","Открыть материал","打开资源","فتح المورد"],
  ["Show more publications","Mostrar mais publicações","Afficher plus de publications","Mostrar más publicaciones","Показать больше публикаций","显示更多出版物","عرض المزيد من المنشورات"],
  ["Search the complete Innovation Library","Pesquisar toda a Biblioteca de Inovação","Rechercher dans toute la Bibliothèque de l’innovation","Buscar en toda la Biblioteca de Innovación","Искать во всей библиотеке инноваций","搜索完整创新资料库","البحث في مكتبة الابتكار الكاملة"],
  ["From the SGP archive","Do arquivo do SGP","Issu des archives du SGP","Del archivo de SGP","Из архива SGP","来自 SGP 档案","من أرشيف برنامج المنح الصغيرة"],
  ["Read the full story","Ler a história completa","Lire l'histoire complète","Leer la historia completa","Прочитать всю историю","阅读完整故事","قراءة القصة كاملة"],
  ["Ask SGP","Pergunte ao SGP","Interroger le SGP","Preguntar a SGP","Спросить SGP","询问 SGP","اسأل برنامج المنح الصغيرة"],
  ["Open SGP assistant","Abrir assistente do SGP","Ouvrir l’assistant SGP","Abrir asistente de SGP","Открыть помощника SGP","打开 SGP 助手","فتح مساعد برنامج المنح الصغيرة"],
  ["Close assistant","Fechar assistente","Fermer l’assistant","Cerrar asistente","Закрыть помощника","关闭助手","إغلاق المساعد"],
  ["SGP knowledge assistant","Assistente de conhecimento do SGP","Assistant de connaissances SGP","Asistente de conocimiento de SGP","Помощник по знаниям SGP","SGP 知识助手","مساعد معرفة برنامج المنح الصغيرة"],
  ["Knowledge service","Serviço de conhecimento","Service de connaissances","Servicio de conocimiento","Сервис знаний","知识服务","خدمة المعرفة"],
  ["Ask across SGP knowledge","Pergunte em todo o conhecimento do SGP","Interroger l’ensemble des connaissances SGP","Consultar todo el conocimiento de SGP","Поиск по всем знаниям SGP","查询全部 SGP 知识","اسأل عبر معرفة برنامج المنح الصغيرة"],
  ["Ask a question","Faça uma pergunta","Poser une question","Haz una pregunta","Задать вопрос","提出问题","اطرح سؤالاً"],
  ["Ask the SGP Innovation Library…","Consulte a Biblioteca de Inovação do SGP…","Interrogez la Bibliothèque de l’innovation du PMF…","Consulta la Biblioteca de Innovación del PPD…","Задайте вопрос Библиотеке инноваций ПМГ…","向小额赠款计划创新资料库提问…","اسأل مكتبة الابتكار لبرنامج المنح الصغيرة…"],
  ["Send question","Enviar pergunta","Envoyer la question","Enviar pregunta","Отправить вопрос","发送问题","إرسال السؤال"],
  ["Stop response","Parar resposta","Arrêter la réponse","Detener respuesta","Остановить ответ","停止回答","إيقاف الإجابة"],
  ["Retry","Tentar novamente","Réessayer","Reintentar","Повторить","重试","إعادة المحاولة"],
  ["Sources","Fontes","Sources","Fuentes","Источники","来源","المصادر"],
  ["Cited resources","Recursos citados","Ressources citées","Recursos citados","Цитируемые материалы","引用资源","الموارد المستشهد بها"],
  ["Suggested questions","Perguntas sugeridas","Questions suggérées","Preguntas sugeridas","Предлагаемые вопросы","建议问题","أسئلة مقترحة"],
  ["Knowledge source","Fonte de conhecimento","Source de connaissances","Fuente de conocimiento","Источник знаний","知识来源","مصدر المعرفة"],
  ["Prompts","Sugestões","Invites","Sugerencias","Подсказки","提示","المطالبات"],
  ["Start a new conversation","Iniciar nova conversa","Démarrer une nouvelle conversation","Iniciar una nueva conversación","Начать новый разговор","开始新对话","بدء محادثة جديدة"],
  ["Open Knowledge Studio","Abrir Estúdio de Conhecimento","Ouvrir le Studio de connaissances","Abrir Estudio de Conocimiento","Открыть Студию знаний","打开知识工作室","فتح استوديو المعرفة"],
  ["Answer evidence","Evidências da resposta","Éléments de réponse","Evidencia de la respuesta","Источники ответа","回答依据","أدلة الإجابة"],
  ["Inspect source","Inspecionar fonte","Examiner la source","Inspeccionar fuente","Изучить источник","查看来源","فحص المصدر"],
  ["Search source","Pesquisar fonte","Rechercher une source","Buscar fuente","Поиск источника","搜索来源","البحث في المصدر"],
  ["Document relevance scores","Pontuações de relevância dos documentos","Scores de pertinence des documents","Puntuaciones de relevancia documental","Оценки релевантности документов","文档相关性评分","درجات صلة المستندات"],
  ["Relevance map","Mapa de relevância","Carte de pertinence","Mapa de relevancia","Карта релевантности","相关性图","خريطة الصلة"],
  ["Lower","Menor","Plus faible","Menor","Ниже","较低","أقل"],
  ["Higher","Maior","Plus élevée","Mayor","Выше","较高","أعلى"],
  ["SGP Grant Portfolio","Portfólio de Subsídios do SGP","Portefeuille de subventions SGP","Cartera de subvenciones de SGP","Портфель грантов SGP","SGP 赠款组合","محفظة منح برنامج المنح الصغيرة"],
  ["Loading dashboard","Carregando painel","Chargement du tableau de bord","Cargando panel","Загрузка панели","正在加载仪表板","جارٍ تحميل لوحة المعلومات"],
  ["Loading SGP Grant Portfolio","Carregando o portfólio de subsídios do SGP","Chargement du portefeuille de subventions SGP","Cargando la cartera de subvenciones de SGP","Загрузка портфеля грантов SGP","正在加载 SGP 赠款组合","جارٍ تحميل محفظة منح البرنامج"],
  ["Portfolio filters","Filtros do portfólio","Filtres du portefeuille","Filtros de cartera","Фильтры портфеля","项目组合筛选","مرشحات المحفظة"],
  ["Active filters","Filtros ativos","Filtres actifs","Filtros activos","Активные фильтры","当前筛选","المرشحات النشطة"],
  ["Reset filters","Redefinir filtros","Réinitialiser les filtres","Restablecer filtros","Сбросить фильтры","重置筛选","إعادة ضبط المرشحات"],
  ["Apply","Aplicar","Appliquer","Aplicar","Применить","应用","تطبيق"],
  ["Cancel","Cancelar","Annuler","Cancelar","Отмена","取消","إلغاء"],
  ["Close","Fechar","Fermer","Cerrar","Закрыть","关闭","إغلاق"],
  ["All","Todos","Tous","Todos","Все","全部","الكل"],
  ["Country","País","Pays","País","Страна","国家","البلد"],
  ["Countries","Países","Pays","Países","Страны","国家","البلدان"],
  ["Region","Região","Région","Región","Регион","地区","المنطقة"],
  ["Regions","Regiões","Régions","Regiones","Регионы","地区","المناطق"],
  ["Focal area","Área focal","Domaine focal","Área focal","Тематическая область","重点领域","مجال التركيز"],
  ["Projects","Projetos","Projets","Proyectos","Проекты","项目","المشاريع"],
  ["Project","Projeto","Projet","Proyecto","Проект","项目","المشروع"],
  ["Grants","Subsídios","Subventions","Subvenciones","Гранты","赠款","المنح"],
  ["Grant","Subsídio","Subvention","Subvención","Грант","赠款","المنحة"],
  ["Grant amount","Valor do subsídio","Montant de la subvention","Monto de la subvención","Сумма гранта","赠款金额","قيمة المنحة"],
  ["Cofinancing","Cofinanciamento","Cofinancement","Cofinanciación","Софинансирование","共同融资","التمويل المشترك"],
  ["Cofinancing total","Total de cofinanciamento","Cofinancement total","Cofinanciación total","Общее софинансирование","共同融资总额","إجمالي التمويل المشترك"],
  ["Average grant","Subsídio médio","Subvention moyenne","Subvención promedio","Средний грант","平均赠款","متوسط المنحة"],
  ["Top country","Principal país","Premier pays","País principal","Ведущая страна","首要国家","البلد الأول"],
  ["Key performance indicators","Indicadores-chave de desempenho","Indicateurs clés de performance","Indicadores clave de rendimiento","Ключевые показатели","关键绩效指标","مؤشرات الأداء الرئيسية"],
  ["Geography","Geografia","Géographie","Geografía","География","地理","الجغرافيا"],
  ["Thematics","Temas","Thématiques","Temáticas","Тематика","主题","المواضيع"],
  ["Time and finance","Tempo e finanças","Temps et finances","Tiempo y finanzas","Время и финансы","时间与财务","الوقت والتمويل"],
  ["Partners","Parceiros","Partenaires","Socios","Партнёры","合作伙伴","الشركاء"],
  ["Records","Registros","Enregistrements","Registros","Записи","记录","السجلات"],
  ["Atlas controls","Controles do atlas","Commandes de l’atlas","Controles del atlas","Управление атласом","地图集控件","عناصر تحكم الأطلس"],
  ["Map tools","Ferramentas do mapa","Outils cartographiques","Herramientas del mapa","Инструменты карты","地图工具","أدوات الخريطة"],
  ["Map indicator","Indicador do mapa","Indicateur cartographique","Indicador del mapa","Показатель карты","地图指标","مؤشر الخريطة"],
  ["Zoom in","Ampliar","Zoom avant","Acercar","Увеличить","放大","تكبير"],
  ["Zoom out","Reduzir","Zoom arrière","Alejar","Уменьшить","缩小","تصغير"],
  ["High","Alto","Élevé","Alto","Высокий","高","مرتفع"],
  ["Low","Baixo","Faible","Bajo","Низкий","低","منخفض"],
  ["Advanced Filters","Filtros avançados","Filtres avancés","Filtros avanzados","Расширенные фильтры","高级筛选","مرشحات متقدمة"],
  ["Filter Studio","Estúdio de filtros","Studio de filtres","Estudio de filtros","Студия фильтров","筛选工作室","استوديو المرشحات"],
  ["Filter country","Filtrar país","Filtrer par pays","Filtrar país","Фильтр по стране","筛选国家","تصفية البلد"],
  ["Filter focal area","Filtrar área focal","Filtrer le domaine focal","Filtrar área focal","Фильтр по теме","筛选重点领域","تصفية مجال التركيز"],
  ["Start year","Ano inicial","Année de début","Año de inicio","Начальный год","开始年份","سنة البدء"],
  ["Export","Exportar","Exporter","Exportar","Экспорт","导出","تصدير"],
  ["Export dashboard","Exportar painel","Exporter le tableau de bord","Exportar panel","Экспорт панели","导出仪表板","تصدير لوحة المعلومات"],
  ["Download center","Central de downloads","Centre de téléchargement","Centro de descargas","Центр загрузок","下载中心","مركز التنزيل"],
  ["Country profile","Perfil do país","Profil du pays","Perfil del país","Профиль страны","国家概况","ملف البلد"],
  ["Stories","Histórias","Histoires","Historias","Истории","故事","القصص"],
  ["Voices","Vozes","Voix","Voces","Голоса","声音","الأصوات"],
  ["Contacts","Contatos","Contacts","Contactos","Контакты","联系人","جهات الاتصال"],
  ["Recent matching projects","Projetos correspondentes recentes","Projets correspondants récents","Proyectos coincidentes recientes","Недавние подходящие проекты","近期匹配项目","المشاريع المطابقة الحديثة"],
  ["Project detail drawer","Painel de detalhes do projeto","Volet de détails du projet","Panel de detalles del proyecto","Панель сведений о проекте","项目详情面板","لوحة تفاصيل المشروع"],
  ["Open SGP source","Abrir fonte do SGP","Ouvrir la source SGP","Abrir fuente de SGP","Открыть источник SGP","打开 SGP 来源","فتح مصدر البرنامج"],
  ["No thematic data in this view","Não há dados temáticos nesta visualização","Aucune donnée thématique dans cette vue","No hay datos temáticos en esta vista","В этом представлении нет тематических данных","此视图无主题数据","لا توجد بيانات مواضيعية في هذا العرض"],
  ["No dated projects in this view","Não há projetos datados nesta visualização","Aucun projet daté dans cette vue","No hay proyectos con fecha en esta vista","В этом представлении нет проектов с датами","此视图无注明日期的项目","لا توجد مشاريع مؤرخة في هذا العرض"],
  ["Page not found","Página não encontrada","Page introuvable","Página no encontrada","Страница не найдена","页面未找到","الصفحة غير موجودة"],
  ["Return home","Voltar ao início","Retour à l’accueil","Volver al inicio","На главную","返回首页","العودة إلى الرئيسية"],
  ["Loading records","Carregando registros","Chargement des enregistrements","Cargando registros","Загрузка записей","正在加载记录","جارٍ تحميل السجلات"],
  ["Show more","Mostrar mais","Afficher plus","Mostrar más","Показать больше","显示更多","عرض المزيد"],
  ["Remove","Remover","Retirer","Eliminar","Удалить","移除","إزالة"],
  ["Start","Iniciar","Démarrer","Iniciar","Начать","开始","بدء"],
  ["Next step","Próximo passo","Étape suivante","Siguiente paso","Следующий шаг","下一步","الخطوة التالية"],
  ["Support","Suporte","Assistance","Soporte","Поддержка","支持","الدعم"],
  ["Title","Título","Titre","Título","Название","标题","العنوان"],
  ["Summary","Resumo","Résumé","Resumen","Описание","摘要","الملخص"],
  ["Theme","Tema","Thème","Tema","Тема","主题","الموضوع"],
  ["Themes","Temas","Thèmes","Temas","Темы","主题","المواضيع"],
  ["Area","Área","Zone","Área","Область","区域","المنطقة"],
  ["Format","Formato","Format","Formato","Формат","格式","التنسيق"]
  ,["matching stories","histórias correspondentes","récits correspondants","historias coincidentes","подходящих историй","个匹配故事","قصة مطابقة"]
  ,["archive images","imagens de arquivo","images d’archives","imágenes de archivo","архивных изображений","张档案图片","صورة أرشيفية"]
  ,["references","referências","références","referencias","ссылок","条参考资料","مرجعاً"]
  ,["matching records","registros correspondentes","enregistrements correspondants","registros coincidentes","подходящих записей","条匹配记录","سجلاً مطابقاً"]
  ,["migrated records","registros migrados","enregistrements migrés","registros migrados","перенесённых записей","条已迁移记录","سجلاً منقولاً"]
  ,["results","resultados","résultats","resultados","результатов","个结果","نتائج"]
  ,["records","registros","enregistrements","registros","записей","条记录","سجلات"]
  ,["items to review","itens para revisar","éléments à examiner","elementos para revisar","элементов на проверку","项待审核","عناصر للمراجعة"]
  ,["SGP Knowledge and Learning Platform","Plataforma de Conhecimento e Aprendizagem do SGP","Plateforme de connaissances et d’apprentissage du PMF","Plataforma de Conocimiento y Aprendizaje del PPD","Платформа знаний и обучения ПМГ","SGP 知识与学习平台","منصة المعرفة والتعلّم لبرنامج المنح الصغيرة"]
  ,["Find funding, explore community-led impact, learn from programme evidence and reach the right agency context.","Encontre financiamento, explore o impacto liderado pelas comunidades, aprenda com as evidências do programa e acesse a agência correta.","Trouvez des financements, explorez l’impact porté par les communautés, apprenez des données du programme et accédez à l’agence compétente.","Encuentre financiación, explore el impacto liderado por las comunidades, aprenda de la evidencia del programa y acceda a la agencia adecuada.","Находите финансирование, изучайте влияние инициатив сообществ, используйте данные программы и обращайтесь в нужное агентство.","寻找资金，探索社区主导的影响，学习项目证据并联系合适的机构。","ابحث عن التمويل، واستكشف الأثر الذي تقوده المجتمعات، وتعلّم من أدلة البرنامج، وتواصل مع الوكالة المناسبة."]
  ,["Continue active work and address the next items in your queue.","Continue o trabalho ativo e trate dos próximos itens da sua fila.","Poursuivez votre travail en cours et traitez les prochains éléments de votre file.","Continúe el trabajo activo y atienda los próximos elementos de su cola.","Продолжайте текущую работу и займитесь следующими задачами в очереди.","继续当前工作并处理队列中的下一事项。","تابع العمل النشط وعالج العناصر التالية في قائمتك."]
  ,["Access funding","Acessar financiamento","Accéder au financement","Acceder a financiación","Получить финансирование","获取资金","الوصول إلى التمويل"]
  ,["Find calls, understand requirements and continue with the managing agency.","Encontre chamadas, entenda os requisitos e prossiga com a agência gestora.","Trouvez des appels, comprenez les exigences et poursuivez auprès de l’agence responsable.","Encuentre convocatorias, comprenda los requisitos y continúe con la agencia gestora.","Находите конкурсы, изучайте требования и продолжайте работу с управляющим агентством.","查找征集信息、了解要求并与管理机构继续办理。","اعثر على الدعوات، وافهم المتطلبات، وتابع مع الوكالة المديرة."]
  ,["View stories and voices","Ver histórias e vozes","Voir les histoires et les voix","Ver historias y voces","Посмотреть истории и голоса","查看故事与声音","عرض القصص والأصوات"]
  ,["Discover community-led impact through stories, voices, films and field photography.","Descubra o impacto liderado pelas comunidades por meio de histórias, vozes, filmes e fotografias de campo.","Découvrez l’impact porté par les communautés à travers des récits, des voix, des films et des photographies de terrain.","Descubra el impacto liderado por las comunidades a través de historias, voces, películas y fotografías de campo.","Узнавайте о результатах инициатив сообществ через истории, голоса, фильмы и полевые фотографии.","通过故事、声音、影片和实地摄影了解社区主导的影响。","اكتشف الأثر الذي تقوده المجتمعات من خلال القصص والأصوات والأفلام والتصوير الميداني."]
  ,["Learn from evidence","Aprender com evidências","Apprendre des données","Aprender de la evidencia","Учиться на данных","从证据中学习","التعلّم من الأدلة"]
  ,["Search resources and project knowledge or ask a cited question.","Pesquise recursos e conhecimento de projetos ou faça uma pergunta com fontes.","Recherchez des ressources et des connaissances sur les projets ou posez une question sourcée.","Busque recursos y conocimiento de proyectos o haga una pregunta con fuentes.","Ищите материалы и знания о проектах или задавайте вопросы с источниками.","搜索资源和项目知识，或提出带引用的问题。","ابحث في الموارد ومعرفة المشاريع أو اطرح سؤالاً موثقاً."]
  ,["See community events","Ver eventos comunitários","Voir les événements communautaires","Ver eventos comunitarios","Посмотреть мероприятия сообщества","查看社区活动","عرض فعاليات المجتمع"]
  ,["Find upcoming learning sessions, webinars and regional exchanges.","Encontre próximas sessões de aprendizagem, webinars e intercâmbios regionais.","Trouvez les prochaines sessions d’apprentissage, webinaires et échanges régionaux.","Encuentre próximas sesiones de aprendizaje, seminarios web e intercambios regionales.","Находите предстоящие учебные сессии, вебинары и региональные обмены.","查找即将举行的学习课程、网络研讨会和区域交流活动。","اعثر على جلسات التعلم والندوات عبر الإنترنت والتبادلات الإقليمية القادمة."]
  ,["One programme view","Uma visão do programa","Une vue d’ensemble du programme","Una vista del programa","Единый обзор программы","统一项目视图","عرض موحد للبرنامج"]
  ,["Portfolio evidence with visible coverage","Evidências do portfólio com cobertura visível","Données du portefeuille avec couverture visible","Evidencia de cartera con cobertura visible","Данные портфеля с прозрачным охватом","覆盖范围清晰的项目组合证据","أدلة المحفظة مع تغطية واضحة"]
  ,["Leverage 30 years of knowledge from on the ground","Aproveite 30 anos de conhecimento adquirido no terreno","Mettez à profit 30 ans de connaissances acquises sur le terrain","Aproveche 30 años de conocimiento adquirido sobre el terreno","Используйте 30 лет знаний, накопленных на местах","充分利用 30 年的一线实践知识","استفد من 30 عاماً من المعرفة المتراكمة على أرض الواقع"]
  ,["Resources, publications and practical evidence","Recursos, publicações e evidências práticas","Ressources, publications et données pratiques","Recursos, publicaciones y evidencia práctica","Материалы, публикации и практические данные","资源、出版物和实践证据","الموارد والمنشورات والأدلة العملية"]
  ,["Prepared records and extracted project documents","Registros preparados e documentos de projetos extraídos","Fiches préparées et documents de projets extraits","Registros preparados y documentos de proyectos extraídos","Подготовленные записи и извлечённые документы проектов","已整理记录和提取的项目文档","السجلات المعدّة ووثائق المشاريع المستخرجة"]
  ,["Live cited retrieval across approved corpora","Pesquisa ao vivo com citações em acervos aprovados","Recherche en direct avec citations dans les corpus approuvés","Búsqueda en vivo con citas en corpus aprobados","Поиск с цитатами по утверждённым корпусам","在已批准语料库中实时引用检索","استرجاع مباشر موثق عبر المجموعات المعتمدة"]
  ,["Discover relevant opportunities, understand the requirements and continue in the correct managing-agency context.","Descubra oportunidades relevantes, entenda os requisitos e prossiga no contexto correto da agência gestora.","Découvrez les opportunités pertinentes, comprenez les exigences et poursuivez dans le cadre de l’agence responsable.","Descubra oportunidades relevantes, comprenda los requisitos y continúe en el contexto de la agencia gestora correcta.","Находите подходящие возможности, изучайте требования и продолжайте работу в системе нужного агентства.","发现相关机会、了解要求并在正确的管理机构环境中继续。","اكتشف الفرص المناسبة، وافهم المتطلبات، وتابع ضمن سياق الوكالة المديرة الصحيحة."]
  ,["Move from global patterns to countries, themes and individual project records with transparent source coverage.","Passe de padrões globais para países, temas e registros individuais de projetos com cobertura transparente das fontes.","Passez des tendances mondiales aux pays, thèmes et fiches de projets avec une couverture transparente des sources.","Pase de patrones globales a países, temas y registros de proyectos con cobertura transparente de fuentes.","Переходите от глобальных закономерностей к странам, темам и отдельным проектам с прозрачными источниками.","从全球模式深入到国家、主题和单个项目记录，并清晰查看来源覆盖。","انتقل من الأنماط العالمية إلى البلدان والمواضيع وسجلات المشاريع الفردية مع شفافية تغطية المصادر."]
  ,["Search prepared portfolio records by title, project number, country, theme or grantee.","Pesquise registros preparados por título, número do projeto, país, tema ou beneficiário.","Recherchez les fiches préparées par titre, numéro de projet, pays, thème ou bénéficiaire.","Busque registros preparados por título, número de proyecto, país, tema o beneficiario.","Ищите подготовленные записи по названию, номеру проекта, стране, теме или грантополучателю.","按标题、项目编号、国家、主题或受赠方搜索已整理记录。","ابحث في سجلات المحفظة المعدّة حسب العنوان أو رقم المشروع أو البلد أو الموضوع أو المستفيد."]
  ,["Browse programme knowledge, connect evidence to projects and ask questions with inspectable sources.","Explore o conhecimento do programa, conecte evidências a projetos e faça perguntas com fontes verificáveis.","Explorez les connaissances du programme, reliez les données aux projets et posez des questions avec des sources vérifiables.","Explore el conocimiento del programa, conecte evidencia con proyectos y haga preguntas con fuentes verificables.","Изучайте знания программы, связывайте данные с проектами и задавайте вопросы с проверяемыми источниками.","浏览项目知识，将证据与项目关联，并基于可核查来源提问。","تصفح معرفة البرنامج، واربط الأدلة بالمشاريع، واطرح أسئلة مع مصادر قابلة للفحص."]
  ,["Ask cited questions across approved SGP knowledge and inspect the evidence returned by the live service.","Faça perguntas com citações em todo o conhecimento aprovado do SGP e examine as evidências retornadas pelo serviço ao vivo.","Posez des questions sourcées dans les connaissances SGP approuvées et examinez les éléments renvoyés par le service en direct.","Haga preguntas con citas en el conocimiento aprobado de SGP e inspeccione la evidencia devuelta por el servicio en vivo.","Задавайте вопросы по утверждённым знаниям SGP и проверяйте источники, возвращаемые сервисом.","在已批准的 SGP 知识中提出带引用的问题，并查看实时服务返回的证据。","اطرح أسئلة موثقة عبر معرفة البرنامج المعتمدة وافحص الأدلة التي تعيدها الخدمة المباشرة."]
  ,["Browse publications, reports, stories and practical knowledge from the migrated archive.","Explore publicações, relatórios, histórias e conhecimento prático do arquivo migrado.","Parcourez les publications, rapports, récits et connaissances pratiques des archives migrées.","Explore publicaciones, informes, historias y conocimiento práctico del archivo migrado.","Просматривайте публикации, отчёты, истории и практические материалы из перенесённого архива.","浏览迁移档案中的出版物、报告、故事和实践知识。","تصفح المنشورات والتقارير والقصص والمعرفة العملية من الأرشيف المنقول."]
  ,["Move between portfolio records, extracted project evidence and cited assistance.","Navegue entre registros do portfólio, evidências extraídas de projetos e assistência com citações.","Passez des fiches du portefeuille aux données extraites des projets et à l’assistance sourcée.","Navegue entre registros de cartera, evidencia extraída de proyectos y asistencia con citas.","Переходите между записями портфеля, извлечёнными данными проектов и ответами с источниками.","在项目组合记录、提取的项目证据和引用式辅助之间切换。","انتقل بين سجلات المحفظة وأدلة المشاريع المستخرجة والمساعدة الموثقة."]
  ,["Find practical resources connected to funding and future delivery journeys.","Encontre recursos práticos ligados ao financiamento e a futuros percursos de execução.","Trouvez des ressources pratiques liées au financement et aux futurs parcours de mise en œuvre.","Encuentre recursos prácticos relacionados con la financiación y futuros recorridos de implementación.","Находите практические материалы по финансированию и будущей реализации.","查找与资金和未来实施路径相关的实用资源。","اعثر على موارد عملية مرتبطة بالتمويل ومسارات التنفيذ المستقبلية."]
  ,["Explore community stories, first-person video, field photography and publications preserved from the SGP archive.","Explore histórias comunitárias, vídeos em primeira pessoa, fotografias de campo e publicações preservadas no arquivo do SGP.","Découvrez des récits communautaires, des vidéos à la première personne, des photos de terrain et des publications issues des archives du SGP.","Explore historias comunitarias, videos en primera persona, fotografía de campo y publicaciones conservadas en el archivo de SGP.","Изучайте истории сообществ, видео от первого лица, полевые фотографии и публикации из архива SGP.","探索 SGP 档案保存的社区故事、第一人称视频、实地摄影和出版物。","استكشف قصص المجتمعات ومقاطع الفيديو الشخصية والتصوير الميداني والمنشورات المحفوظة في أرشيف البرنامج."]
  ,["First-person perspectives and films from communities across the programme.","Perspectivas em primeira pessoa e filmes de comunidades de todo o programa.","Témoignages et films de communautés de l’ensemble du programme.","Perspectivas en primera persona y películas de comunidades de todo el programa.","Личные истории и фильмы сообществ со всей программы.","来自整个项目社区的第一人称视角和影片。","وجهات نظر شخصية وأفلام من مجتمعات عبر البرنامج."]
  ,["Responses stream from the live knowledge service with sources you can inspect.","As respostas são transmitidas pelo serviço de conhecimento ao vivo com fontes que você pode examinar.","Les réponses proviennent du service de connaissances en direct avec des sources que vous pouvez examiner.","Las respuestas llegan del servicio de conocimiento en vivo con fuentes que puede inspeccionar.","Ответы поступают из сервиса знаний вместе с источниками, которые можно проверить.","回答来自实时知识服务，并附有可查看的来源。","تأتي الإجابات من خدمة المعرفة المباشرة مع مصادر يمكنك فحصها."]
  ,["AI retrieves and summarizes approved knowledge. Check the cited resources before acting.","A IA recupera e resume conhecimento aprovado. Verifique os recursos citados antes de agir.","L’IA recherche et résume les connaissances approuvées. Vérifiez les ressources citées avant d’agir.","La IA recupera y resume conocimiento aprobado. Revise los recursos citados antes de actuar.","ИИ находит и обобщает утверждённые знания. Проверяйте источники перед действиями.","人工智能检索并总结已批准知识。采取行动前请核查引用资源。","يسترجع الذكاء الاصطناعي المعرفة المعتمدة ويلخصها. تحقق من الموارد المستشهد بها قبل التصرف."]
  ,["The assistant could not complete this request.","O assistente não conseguiu concluir esta solicitação.","L’assistant n’a pas pu traiter cette demande.","El asistente no pudo completar esta solicitud.","Помощник не смог выполнить запрос.","助手无法完成此请求。","لم يتمكن المساعد من إكمال هذا الطلب."]
  ,["Searching approved sources…","Pesquisando fontes aprovadas…","Recherche dans les sources approuvées…","Buscando en fuentes aprobadas…","Поиск по утверждённым источникам…","正在搜索已批准来源…","جارٍ البحث في المصادر المعتمدة…"]
  ,["No answer was returned.","Nenhuma resposta foi retornada.","Aucune réponse n’a été renvoyée.","No se devolvió ninguna respuesta.","Ответ не получен.","未返回回答。","لم يتم إرجاع إجابة."]
  ,["Explore SGP projects through region, thematic, financial, partner, and record-level lenses.","Explore os projetos do SGP por região, tema, finanças, parceiros e registros.","Explorez les projets SGP par région, thème, finance, partenaire et fiche.","Explore los proyectos de SGP por región, temática, finanzas, socios y registros.","Изучайте проекты SGP по регионам, темам, финансам, партнёрам и записям.","按地区、主题、财务、合作伙伴和记录层面探索 SGP 项目。","استكشف مشاريع البرنامج حسب المنطقة والموضوع والتمويل والشركاء والسجلات."]
  ,["Ask AI to filter, e.g. biodiversity after 2015","Peça à IA para filtrar, ex.: biodiversidade após 2015","Demandez à l’IA de filtrer, ex. biodiversité après 2015","Pida a la IA que filtre, p. ej., biodiversidad después de 2015","Попросите ИИ отфильтровать, например: биоразнообразие после 2015","让人工智能筛选，例如：2015 年后的生物多样性","اطلب من الذكاء الاصطناعي التصفية، مثلاً التنوع البيولوجي بعد 2015"]
  ,["World map","Mapa-múndi","Carte du monde","Mapa mundial","Карта мира","世界地图","خريطة العالم"]
  ,["Interactive map viewport","Área do mapa interativo","Fenêtre de carte interactive","Vista de mapa interactivo","Область интерактивной карты","交互式地图视图","نافذة الخريطة التفاعلية"]
  ,["Indicator and interaction","Indicador e interação","Indicateur et interaction","Indicador e interacción","Показатель и взаимодействие","指标与交互","المؤشر والتفاعل"]
  ,["Reset","Redefinir","Réinitialiser","Restablecer","Сбросить","重置","إعادة ضبط"]
  ,["Global","Global","Monde","Global","Весь мир","全球","عالمي"]
  ,["Africa","África","Afrique","África","Африка","非洲","أفريقيا"]
  ,["Asia Pacific","Ásia-Pacífico","Asie-Pacifique","Asia-Pacífico","Азиатско-Тихоокеанский регион","亚太地区","آسيا والمحيط الهادئ"]
  ,["Arab States","Estados Árabes","États arabes","Estados Árabes","Арабские государства","阿拉伯国家","الدول العربية"]
  ,["Europe & CIS","Europa e CEI","Europe et CEI","Europa y CEI","Европа и СНГ","欧洲和独联体","أوروبا ورابطة الدول المستقلة"]
  ,["Latin America","América Latina","Amérique latine","América Latina","Латинская Америка","拉丁美洲","أمريكا اللاتينية"]
  ,["Cash","Dinheiro","Espèces","Efectivo","Денежное","现金","نقدي"]
  ,["In-kind","Em espécie","En nature","En especie","В натуральной форме","实物","عيني"]
  ,["Total cofinancing","Cofinanciamento total","Cofinancement total","Cofinanciación total","Общее софинансирование","共同融资总额","إجمالي التمويل المشترك"]
  ,["Active projects","Projetos ativos","Projets actifs","Proyectos activos","Активные проекты","在执行项目","المشاريع النشطة"]
  ,["Grant funding","Financiamento de subsídios","Financement des subventions","Financiación de subvenciones","Грантовое финансирование","赠款资金","تمويل المنح"]
  ,["Project records","Registros de projetos","Fiches de projets","Registros de proyectos","Записи проектов","项目记录","سجلات المشاريع"]
  ,["Programme countries","Países do programa","Pays du programme","Países del programa","Страны программы","项目国家","بلدان البرنامج"]
  ,["Years of impact","Anos de impacto","Années d’impact","Años de impacto","Лет воздействия","年影响力","سنوات من الأثر"]
  ,["Profile","Perfil","Profil","Perfil","Профиль","概况","الملف"]
  ,["Time","Tempo","Temps","Tiempo","Время","时间","الوقت"]
  ,["Finance","Finanças","Finance","Finanzas","Финансы","财务","التمويل"]
  ,["SGP site content","Conteúdo do site do SGP","Contenu du site SGP","Contenido del sitio de SGP","Материалы сайта SGP","SGP 网站内容","محتوى موقع البرنامج"]
  ,["Years and themes","Anos e temas","Années et thèmes","Años y temas","Годы и темы","年份和主题","السنوات والمواضيع"]
  ,["Focal mix","Composição focal","Répartition thématique","Composición focal","Распределение по темам","重点领域组合","مزيج مجالات التركيز"]
  ,["Grants and partners","Subsídios e parceiros","Subventions et partenaires","Subvenciones y socios","Гранты и партнёры","赠款与合作伙伴","المنح والشركاء"]
  ,["Cofinancer graph","Rede de cofinanciadores","Réseau des cofinanceurs","Red de cofinanciadores","Сеть софинансирования","共同融资方网络","شبكة الممولين المشاركين"]
  ,["Project rows","Linhas de projetos","Lignes de projets","Filas de proyectos","Строки проектов","项目行","صفوف المشاريع"]
  ,["Portfolio context","Contexto do portfólio","Contexte du portefeuille","Contexto de cartera","Контекст портфеля","项目组合背景","سياق المحفظة"]
  ,["Portfolio dimensions","Dimensões do portfólio","Dimensions du portefeuille","Dimensiones de cartera","Параметры портфеля","项目组合维度","أبعاد المحفظة"]
  ,["Portfolio trend","Tendência do portfólio","Tendance du portefeuille","Tendencia de cartera","Динамика портфеля","项目组合趋势","اتجاه المحفظة"]
  ,["Thematic mix","Composição temática","Répartition thématique","Composición temática","Тематический состав","主题组合","المزيج الموضوعي"]
  ,["Finance summary","Resumo financeiro","Synthèse financière","Resumen financiero","Финансовая сводка","财务摘要","الملخص المالي"]
  ,["Partner summary","Resumo de parceiros","Synthèse des partenaires","Resumen de socios","Сводка по партнёрам","合作伙伴摘要","ملخص الشركاء"]
  ,["Partner types","Tipos de parceiros","Types de partenaires","Tipos de socios","Типы партнёров","合作伙伴类型","أنواع الشركاء"]
  ,["Organizations","Organizações","Organisations","Organizaciones","Организации","组织","المنظمات"]
  ,["Cofinancing partners","Parceiros de cofinanciamento","Partenaires de cofinancement","Socios de cofinanciación","Партнёры по софинансированию","共同融资伙伴","شركاء التمويل المشترك"]
  ,["Cofinancer type","Tipo de cofinanciador","Type de cofinanceur","Tipo de cofinanciador","Тип софинансирующей стороны","共同融资方类型","نوع الممول المشارك"]
  ,["Cofinancer country","País do cofinanciador","Pays du cofinanceur","País del cofinanciador","Страна софинансирующей стороны","共同融资方国家","بلد الممول المشارك"]
  ,["Institutional type","Tipo institucional","Type d’institution","Tipo institucional","Тип учреждения","机构类型","النوع المؤسسي"]
  ,["Funding source","Fonte de financiamento","Source de financement","Fuente de financiación","Источник финансирования","资金来源","مصدر التمويل"]
  ,["Grant years","Anos dos subsídios","Années des subventions","Años de subvenciones","Годы грантов","赠款年份","سنوات المنح"]
  ,["Grant year range","Intervalo de anos dos subsídios","Période des subventions","Rango de años de subvenciones","Диапазон лет грантов","赠款年份范围","نطاق سنوات المنح"]
  ,["Minimum grant year","Ano mínimo do subsídio","Année minimale de subvention","Año mínimo de subvención","Минимальный год гранта","最早赠款年份","الحد الأدنى لسنة المنحة"]
  ,["Maximum grant year","Ano máximo do subsídio","Année maximale de subvention","Año máximo de subvención","Максимальный год гранта","最晚赠款年份","الحد الأقصى لسنة المنحة"]
  ,["Visualization views","Visualizações","Vues de visualisation","Vistas de visualización","Режимы визуализации","可视化视图","عروض التصور"]
  ,["Export dashboard","Exportar painel","Exporter le tableau de bord","Exportar panel","Экспорт панели","导出仪表板","تصدير لوحة المعلومات"]
  ,["Save the current filtered view as data, image, document, or share recipe.","Salve a visualização filtrada atual como dados, imagem, documento ou configuração compartilhável.","Enregistrez la vue filtrée sous forme de données, d’image, de document ou de configuration partageable.","Guarde la vista filtrada como datos, imagen, documento o configuración para compartir.","Сохраните отфильтрованный вид как данные, изображение, документ или параметры для обмена.","将当前筛选视图保存为数据、图像、文档或共享配置。","احفظ العرض المصفى الحالي كبيانات أو صورة أو مستند أو إعداد قابل للمشاركة."]
  ,["Dashboard data failed to load","Falha ao carregar os dados do painel","Échec du chargement des données du tableau de bord","No se pudieron cargar los datos del panel","Не удалось загрузить данные панели","仪表板数据加载失败","فشل تحميل بيانات لوحة المعلومات"]
  ,["Reading normalized projects, cofinancing details, aggregates, and local world geometry.","Lendo projetos normalizados, detalhes de cofinanciamento, agregados e geometria mundial local.","Lecture des projets normalisés, des détails de cofinancement, des agrégats et de la géométrie mondiale locale.","Leyendo proyectos normalizados, detalles de cofinanciación, agregados y geometría mundial local.","Загрузка нормализованных проектов, данных софинансирования, агрегатов и локальной геометрии мира.","正在读取标准化项目、共同融资明细、汇总数据和本地世界地理数据。","جارٍ قراءة المشاريع الموحدة وتفاصيل التمويل المشترك والتجميعات والهندسة الجغرافية المحلية."]
  ,["Query plan","Plano de consulta","Plan de requête","Plan de consulta","План запроса","查询计划","خطة الاستعلام"]
  ,["Query plan preview","Prévia do plano de consulta","Aperçu du plan de requête","Vista previa del plan de consulta","Предпросмотр плана запроса","查询计划预览","معاينة خطة الاستعلام"]
  ,["Enter","Enviar","Valider","Ingresar","Ввод","输入","إدخال"]
  ,["Natural-language filter query","Consulta de filtro em linguagem natural","Requête de filtre en langage naturel","Consulta de filtro en lenguaje natural","Фильтр на естественном языке","自然语言筛选查询","استعلام تصفية باللغة الطبيعية"]
  ,["Full","Completo","Complet","Completo","Полный","完整","كامل"]
  ,["Planning","Planejamento","Planification","Planificación","Планирование","规划","التخطيط"]
  ,["Featured","Destaque","À la une","Destacado","Избранное","精选","مميز"]
  ,["Project category","Categoria do projeto","Catégorie de projet","Categoría de proyecto","Категория проекта","项目类别","فئة المشروع"]
  ,["Status group","Grupo de status","Groupe de statut","Grupo de estado","Группа статусов","状态组","مجموعة الحالة"]
  ,["Top type","Principal tipo","Type principal","Tipo principal","Ведущий тип","首要类型","النوع الأول"]
  ,["Other focal areas","Outras áreas focais","Autres domaines focaux","Otras áreas focales","Другие тематические области","其他重点领域","مجالات تركيز أخرى"]
  ,["Cash cofinancing","Cofinanciamento em dinheiro","Cofinancement en espèces","Cofinanciación en efectivo","Денежное софинансирование","现金共同融资","التمويل المشترك النقدي"]
  ,["In-kind cofinancing","Cofinanciamento em espécie","Cofinancement en nature","Cofinanciación en especie","Софинансирование в натуральной форме","实物共同融资","التمويل المشترك العيني"]
  ,["Biodiversity","Biodiversidade","Biodiversité","Biodiversidad","Биоразнообразие","生物多样性","التنوع البيولوجي"]
  ,["Climate Change","Mudança climática","Changement climatique","Cambio climático","Изменение климата","气候变化","تغير المناخ"]
  ,["Land Degradation","Degradação da terra","Dégradation des terres","Degradación de la tierra","Деградация земель","土地退化","تدهور الأراضي"]
  ,["International Waters","Águas internacionais","Eaux internationales","Aguas internacionales","Международные воды","国际水域","المياه الدولية"]
  ,["Chemicals and Waste","Produtos químicos e resíduos","Produits chimiques et déchets","Productos químicos y residuos","Химические вещества и отходы","化学品与废物","المواد الكيميائية والنفايات"]
  ,["Capacity Development","Desenvolvimento de capacidades","Développement des capacités","Desarrollo de capacidades","Развитие потенциала","能力建设","تنمية القدرات"]
  ,["Climate Change Adaptation","Adaptação à mudança climática","Adaptation au changement climatique","Adaptación al cambio climático","Адаптация к изменению климата","气候变化适应","التكيف مع تغير المناخ"]
  ,["Multifocal Area","Área multifocal","Domaine multifocal","Área multifocal","Многоцелевая область","多重点领域","مجال متعدد التركيز"]
  ,["Global portfolio","Portfólio global","Portefeuille mondial","Cartera global","Глобальный портфель","全球项目组合","المحفظة العالمية"]
  ,["Select a country on the map or choose a single thematic area to see the matching SGP website profile, publications, stories, and voices.","Selecione um país no mapa ou escolha uma única área temática para ver o perfil, publicações, histórias e vozes correspondentes no site do SGP.","Sélectionnez un pays sur la carte ou un domaine thématique pour afficher le profil, les publications, les récits et les voix correspondants du site SGP.","Seleccione un país en el mapa o elija un área temática para ver el perfil, las publicaciones, las historias y las voces correspondientes del sitio de SGP.","Выберите страну на карте или одну тематическую область, чтобы увидеть профиль, публикации, истории и видео на сайте SGP.","在地图上选择一个国家或单个主题领域，以查看对应的 SGP 网站概况、出版物、故事和声音。","اختر بلداً على الخريطة أو مجالاً موضوعياً واحداً لعرض ملف موقع البرنامج والمنشورات والقصص والأصوات المطابقة."]
  ,["INDICATOR","INDICADOR","INDICATEUR","INDICADOR","ПОКАЗАТЕЛЬ","指标","المؤشر"]
  ,["API & integration","API e integração","API et intégration","API e integración","API и интеграция","API 与集成","واجهة API والتكامل"]
  ,["Loading API documentation","Carregando documentação da API","Chargement de la documentation de l’API","Cargando documentación de la API","Загрузка документации API","正在加载 API 文档","جارٍ تحميل وثائق API"]
  ,["Agency integration","Integração de agências","Intégration des agences","Integración de agencias","Интеграция агентств","机构集成","تكامل الوكالات"]
  ,["Download OpenAPI","Baixar OpenAPI","Télécharger OpenAPI","Descargar OpenAPI","Скачать OpenAPI","下载 OpenAPI","تنزيل OpenAPI"]
  ,["Start integrating","Começar a integração","Commencer l’intégration","Comenzar la integración","Начать интеграцию","开始集成","بدء التكامل"]
  ,["Current service","Serviço atual","Service actuel","Servicio actual","Текущий сервис","当前服务","الخدمة الحالية"]
  ,["Design contract","Contrato de concepção","Contrat de conception","Contrato de diseño","Проектный контракт","设计契约","عقد التصميم"]
  ,["Planned","Planejado","Planifié","Planificado","Запланировано","计划中","مخطط"]
  ,["On this page","Nesta página","Sur cette page","En esta página","На этой странице","本页内容","في هذه الصفحة"]
  ,["Overview","Visão geral","Aperçu","Resumen","Обзор","概览","نظرة عامة"]
  ,["Quickstart","Início rápido","Démarrage rapide","Inicio rápido","Быстрый старт","快速开始","بدء سريع"]
  ,["Authentication","Autenticação","Authentification","Autenticación","Аутентификация","身份验证","المصادقة"]
  ,["Embed AI","Incorporar IA","Intégrer l’IA","Integrar IA","Встроить ИИ","嵌入人工智能","تضمين الذكاء الاصطناعي"]
  ,["Assistant API","API do assistente","API de l’assistant","API del asistente","API помощника","助手 API","واجهة المساعد"]
  ,["Search APIs","APIs de pesquisa","API de recherche","API de búsqueda","API поиска","搜索 API","واجهات البحث"]
  ,["Datasets","Conjuntos de dados","Jeux de données","Conjuntos de datos","Наборы данных","数据集","مجموعات البيانات"]
  ,["Exchange & events","Intercâmbio e eventos","Échanges et événements","Intercambio y eventos","Обмен и события","交换与事件","التبادل والأحداث"]
  ,["Governance","Governança","Gouvernance","Gobernanza","Управление","治理","الحوكمة"]
  ,["Operations","Operações","Opérations","Operaciones","Эксплуатация","运维","العمليات"]
  ,["Copied","Copiado","Copié","Copiado","Скопировано","已复制","تم النسخ"]
  ,["Copy","Copiar","Copier","Copiar","Копировать","复制","نسخ"]
  ,["Open grants","Subsídios abertos","Subventions ouvertes","Subvenciones abiertas","Открытые гранты","开放赠款","المنح المفتوحة"]
  ,["Explore indicative opportunities by place and environmental theme, then inspect funding, eligibility and delivery details.","Explore oportunidades indicativas por local e tema ambiental e consulte detalhes de financiamento, elegibilidade e execução.","Explorez les opportunités indicatives par lieu et thème environnemental, puis consultez le financement, l’éligibilité et la mise en œuvre.","Explore oportunidades indicativas por lugar y tema ambiental, y consulte financiación, elegibilidad y ejecución.","Изучайте примерные возможности по странам и экологическим темам, а затем условия финансирования, участия и реализации.","按地区和环境主题探索示例机会，并查看资金、资格和实施详情。","استكشف الفرص الإرشادية حسب المكان والموضوع البيئي، ثم راجع تفاصيل التمويل والأهلية والتنفيذ."]
  ,["Explore open grants","Explorar subsídios abertos","Explorer les subventions ouvertes","Explorar subvenciones abiertas","Изучить открытые гранты","探索开放赠款","استكشاف المنح المفتوحة"]
  ,["Filter by environmental theme","Filtrar por tema ambiental","Filtrer par thème environnemental","Filtrar por tema ambiental","Фильтр по экологической теме","按环境主题筛选","التصفية حسب الموضوع البيئي"]
  ,["Environmental theme filters","Filtros de temas ambientais","Filtres des thèmes environnementaux","Filtros de temas ambientales","Фильтры экологических тем","环境主题筛选器","مرشحات المواضيع البيئية"]
  ,["Search open grants","Pesquisar subsídios abertos","Rechercher des subventions ouvertes","Buscar subvenciones abiertas","Поиск открытых грантов","搜索开放赠款","البحث في المنح المفتوحة"]
  ,["Search country, theme, applicant or activity","Pesquisar país, tema, candidato ou atividade","Rechercher un pays, un thème, un candidat ou une activité","Buscar país, tema, solicitante o actividad","Искать по стране, теме, заявителю или деятельности","搜索国家、主题、申请者或活动","ابحث حسب البلد أو الموضوع أو مقدم الطلب أو النشاط"]
  ,["Clear search","Limpar pesquisa","Effacer la recherche","Borrar búsqueda","Очистить поиск","清除搜索","مسح البحث"]
  ,["Clear filters","Limpar filtros","Effacer les filtres","Borrar filtros","Сбросить фильтры","清除筛选器","مسح المرشحات"]
  ,["Historical footprint + open calls","Presença histórica + chamadas abertas","Présence historique + appels ouverts","Presencia histórica + convocatorias abiertas","Исторический охват + открытые конкурсы","历史足迹 + 开放征集","الحضور التاريخي + الدعوات المفتوحة"]
  ,["Where SGP has worked","Onde o SGP atuou","Où le SGP est intervenu","Dónde ha trabajado SGP","Где работала программа SGP","SGP 开展项目的地区","حيث عمل برنامج المنح الصغيرة"]
  ,["Loading historical programme coverage","Carregando a cobertura histórica do programa","Chargement de la couverture historique du programme","Cargando la cobertura histórica del programa","Загрузка исторического охвата программы","正在加载历史项目覆盖","جارٍ تحميل التغطية التاريخية للبرنامج"]
  ,["Historical coverage unavailable","Cobertura histórica indisponível","Couverture historique indisponible","Cobertura histórica no disponible","Исторический охват недоступен","历史覆盖不可用","التغطية التاريخية غير متاحة"]
  ,["All programme regions","Todas as regiões do programa","Toutes les régions du programme","Todas las regiones del programa","Все регионы программы","所有项目区域","جميع مناطق البرنامج"]
  ,["countries with past projects","países com projetos anteriores","pays ayant des projets antérieurs","países con proyectos anteriores","стран с прошлыми проектами","个有历史项目的国家","بلداً لديها مشاريع سابقة"]
  ,["matching opportunities","oportunidades correspondentes","opportunités correspondantes","oportunidades coincidentes","подходящих возможностей","个匹配机会","فرص مطابقة"]
  ,["Region filters","Filtros de região","Filtres régionaux","Filtros de región","Фильтры регионов","区域筛选器","مرشحات المناطق"]
  ,["Countries in view","Países em exibição","Pays affichés","Países visibles","Стран в области просмотра","视图中的国家","البلدان المعروضة"]
  ,["Past projects in view","Projetos anteriores em exibição","Projets antérieurs affichés","Proyectos anteriores visibles","Прошлых проектов в области просмотра","视图中的历史项目","المشاريع السابقة المعروضة"]
  ,["past project","projeto anterior","projet antérieur","proyecto anterior","прошлый проект","个历史项目","مشروع سابق"]
  ,["past projects","projetos anteriores","projets antérieurs","proyectos anteriores","прошлых проектов","个历史项目","مشاريع سابقة"]
  ,["open grant","subsídio aberto","subvention ouverte","subvención abierta","открытый грант","个开放赠款","منحة مفتوحة"]
  ,["open grants","subsídios abertos","subventions ouvertes","subvenciones abiertas","открытых грантов","个开放赠款","منح مفتوحة"]
  ,["Open now","Abertos agora","Ouvertes maintenant","Abiertas ahora","Открыты сейчас","现正开放","مفتوحة الآن"]
  ,["View full grant","Ver subsídio completo","Voir la subvention complète","Ver subvención completa","Открыть сведения о гранте","查看完整赠款","عرض تفاصيل المنحة"]
  ,["Test opportunity","Oportunidade de teste","Opportunité de test","Oportunidad de prueba","Тестовая возможность","测试机会","فرصة تجريبية"]
  ,["Funding range","Faixa de financiamento","Fourchette de financement","Rango de financiación","Диапазон финансирования","资金范围","نطاق التمويل"]
  ,["Delivery period","Período de execução","Période de mise en œuvre","Período de ejecución","Срок реализации","实施周期","فترة التنفيذ"]
  ,["Who can apply","Quem pode se candidatar","Qui peut candidater","Quién puede solicitar","Кто может подать заявку","谁可以申请","من يمكنه التقديم"]
  ,["Priority areas","Áreas prioritárias","Domaines prioritaires","Áreas prioritarias","Приоритетные направления","优先领域","المجالات ذات الأولوية"]
  ,["Expected outputs","Resultados esperados","Produits attendus","Productos esperados","Ожидаемые результаты","预期产出","المخرجات المتوقعة"]
  ,["Managing agency","Agência gestora","Agence responsable","Agencia gestora","Управляющее агентство","管理机构","الوكالة المديرة"]
  ,["Review the funding pathway","Revisar o percurso de financiamento","Consulter le parcours de financement","Revisar la vía de financiación","Изучить путь финансирования","查看资助流程","مراجعة مسار التمويل"]
  ,["Close grant details","Fechar detalhes do subsídio","Fermer les détails de la subvention","Cerrar detalles de la subvención","Закрыть сведения о гранте","关闭赠款详情","إغلاق تفاصيل المنحة"]
  ,["No grants match these filters","Nenhum subsídio corresponde a estes filtros","Aucune subvention ne correspond à ces filtres","Ninguna subvención coincide con estos filtros","Нет грантов по выбранным фильтрам","没有符合这些筛选条件的赠款","لا توجد منح تطابق هذه المرشحات"]
  ,["Show all opportunities","Mostrar todas as oportunidades","Afficher toutes les opportunités","Mostrar todas las oportunidades","Показать все возможности","显示所有机会","عرض جميع الفرص"]
  ,["Loading grant map","Carregando mapa de subsídios","Chargement de la carte des subventions","Cargando mapa de subvenciones","Загрузка карты грантов","正在加载赠款地图","جارٍ تحميل خريطة المنح"]
  ,["Map unavailable","Mapa indisponível","Carte indisponible","Mapa no disponible","Карта недоступна","地图不可用","الخريطة غير متاحة"]
  ,["Open Grants","Subsídios abertos","Subventions ouvertes","Subvenciones abiertas","Открытые гранты","开放赠款","المنح المفتوحة"]
  ,["AI Knowledge Studio","Estúdio de Conhecimento com IA","Studio de connaissances IA","Estudio de Conocimiento con IA","Студия знаний с ИИ","AI 知识工作室","استوديو المعرفة بالذكاء الاصطناعي"]
  ,["Funding Pathway Guidance","Orientação sobre o percurso de financiamento","Guide du parcours de financement","Orientación sobre la vía de financiación","Руководство по пути финансирования","资助流程指南","إرشادات مسار التمويل"]
  ,["Templates","Modelos","Modèles","Plantillas","Шаблоны","模板","القوالب"]
  ,["Contact","Contato","Contact","Contacto","Контакты","联系","اتصل بنا"]
  ,["AI Chat History","Histórico de conversas com IA","Historique des conversations IA","Historial de chats con IA","История чатов с ИИ","AI 对话历史","سجل محادثات الذكاء الاصطناعي"]
  ,["Document Management","Gestão de documentos","Gestion des documents","Gestión documental","Управление документами","文档管理","إدارة الوثائق"]
  ,["Data Management","Gestão de dados","Gestion des données","Gestión de datos","Управление данными","数据管理","إدارة البيانات"]
  ,["Site Content","Conteúdo do site","Contenu du site","Contenido del sitio","Контент сайта","网站内容","محتوى الموقع"]
  ,["AI Management","Gestão de IA","Gestion de l’IA","Gestión de IA","Управление ИИ","AI 管理","إدارة الذكاء الاصطناعي"]
  ,["API Access & Integrations","Acesso à API e integrações","Accès API et intégrations","Acceso a API e integraciones","Доступ к API и интеграции","API 访问与集成","الوصول إلى API والتكاملات"]
  ,["User Management","Gestão de usuários","Gestion des utilisateurs","Gestión de usuarios","Управление пользователями","用户管理","إدارة المستخدمين"]
  ,["UNDP administrator","Administrador do PNUD","Administrateur du PNUD","Administrador del PNUD","Администратор ПРООН","开发署管理员","مسؤول برنامج الأمم المتحدة الإنمائي"]
  ,["Platform administrator","Administrador da plataforma","Administrateur de la plateforme","Administrador de la plataforma","Администратор платформы","平台管理员","مسؤول المنصة"]
  ,["Agency admin","Administração da agência","Administration de l’agence","Administración de la agencia","Администрирование агентства","机构管理","إدارة الوكالة"]
  ,["Return to events","Voltar aos eventos","Retour aux événements","Volver a eventos","Вернуться к мероприятиям","返回活动","العودة إلى الفعاليات"]
  ,["Return to Innovation Library","Voltar à Biblioteca de Inovação","Retour à la Bibliothèque de l’innovation","Volver a la Biblioteca de Innovación","Вернуться в Библиотеку инноваций","返回创新资料库","العودة إلى مكتبة الابتكار"]
];
rows.push(...GLOSSARY_TRANSLATION_ROWS);
rows.push(...INTERFACE_COMPLETION_ROWS);
rows.push(...OPERATIONAL_WORKSPACE_TRANSLATION_ROWS);
rows.push(...FUNCTIONAL_WORKFLOW_TRANSLATION_ROWS);
rows.push(...GRANT_WORKBENCH_TRANSLATION_ROWS);
rows.push(...LEARNING_TRANSLATION_ROWS);

const locales: Locale[] = [...ROUTE_LOCALES];
const catalog = Object.fromEntries(locales.map((locale, index) => [locale, new Map(rows.map((row) => [row[0], row[index]]))])) as Record<Locale, Map<string, string>>;
const reverseCatalog = new Map<string, string>();
for (const row of rows) {
  for (const translation of row.slice(1)) reverseCatalog.set(translation.trim(), row[0]);
}
const dynamicUiFragments = [
  "Advanced filters include geography groups, organization attributes, status, funding source, category, and finance ranges",
  "options are generated from the current data scope; visible counts reflect matching rows",
  "profile from the SGP scraper archive content, joined to the selected dashboard scope",
  "reflects the filters, active view, and processed dashboard data available in this session",
  "has SGP records, but no records match the active geography filter",
  "boundary. Empty means no lower bound for this numeric dimension",
  "boundary. Empty means no upper bound for this numeric dimension",
  "option labels can be searched locally within the current option list",
  "is the country-level metric used for the choropleth color scale",
  "This criterion is currently narrowing the portfolio",
  "The full available year domain starts at",
  "The full available year domain ends at",
  "Country distribution and scale for",
  "Individual grant amount distribution for",
  "Metrics and charts reflect the current active filters",
  "matching rows in the current option universe",
  "thematic focal area associated with this record",
  "project country associated with this record",
  "grant funding in the selector baseline",
  "matching grants in the current view",
  "no matching grants in the current view",
  "Interactive world map by",
  "Open project details for",
  "grouped smaller focal areas",
  "matching project records",
  "grants in this segment",
  "grants starting in",
  "advanced criteria active",
  "an unspecified cofinancer type",
  "in the current filtered view",
  "Lower grant-start-year boundary",
  "Upper grant-start-year boundary",
  "National programme workspace",
  "Applicant workspace",
  "Grantee workspace",
  "Reviewer workspace",
  "Agency administration",
  "UNDP administration",
  "Platform administration",
  "IT frontend administration",
  "IT backend administration",
  "Super administration",
  "Access required for",
  "Sign in to open",
  "Open details for",
  "Active filter",
  "Cash cofinancing",
  "In-kind cofinancing",
  "Total cofinancing",
  "Average grant",
  "Active projects",
  "Grant amount",
  "Grants",
  "grant funding",
  "grant and",
  "with no year",
  "sections",
  "analysis",
  "themes",
  "grants",
  "Started",
  "Maximum",
  "Minimum",
  "Select",
  "Filter",
  "Find",
  "view"
].sort((left, right) => right.length - left.length);
let uiCompletionPromise: Promise<void> | null = null;
const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Record<string, string>>();

function ensureUiCompletionTranslations() {
  if (!uiCompletionPromise) {
    uiCompletionPromise = import("./i18n-ui-completion").then(({ UI_COMPLETION_ROWS }) => {
      for (const row of UI_COMPLETION_ROWS) {
        for (const [index, locale] of locales.entries()) catalog[locale].set(row[0], row[index]);
        for (const translation of row.slice(1)) reverseCatalog.set(translation.trim(), row[0]);
      }
    });
  }
  return uiCompletionPromise;
}

function preserveWhitespace(source: string, value: string) {
  const leading = source.match(/^\s*/)?.[0] || "";
  const trailing = source.match(/\s*$/)?.[0] || "";
  return `${leading}${value}${trailing}`;
}

function canonicalEnglish(value: string) {
  const clean = value.trim();
  const source = reverseCatalog.get(clean);
  return source ? preserveWhitespace(value, source) : value;
}

export function translate(value: string, locale: Locale, useFragments = false) {
  const canonical = canonicalEnglish(value);
  if (locale === "en" || !canonical.trim()) return canonical;
  const clean = canonical.trim();
  const exact = catalog[locale].get(clean);
  if (exact) return preserveWhitespace(canonical, exact);
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let sentenceChanged = false;
  const localizedSentences = sentences.map((sentence) => {
    const match = sentence.match(/^(.*?)([.!?]+)$/);
    if (!match) return sentence;
    const localized = catalog[locale].get(match[1]);
    if (!localized) return sentence;
    sentenceChanged = true;
    return `${localized}${match[2]}`;
  });
  if (sentenceChanged) return preserveWhitespace(canonical, localizedSentences.join(" "));
  const count = clean.match(/^([\d,.]+)\s+(.+)$/);
  if (count) {
    const unit = catalog[locale].get(count[2]);
    if (unit) return preserveWhitespace(canonical, `${count[1]} ${unit}`);
  }
  const suffixes = ["matching stories", "archive images", "references", "matching records", "migrated records", "results", "records", "items to review"];
  for (const suffix of suffixes) {
    if (!clean.endsWith(suffix)) continue;
    const translated = catalog[locale].get(suffix);
    if (translated) return preserveWhitespace(canonical, `${clean.slice(0, -suffix.length)}${translated}`);
  }
  if (!useFragments) return canonical;
  const countryRange = clean.match(/^([\d,.]+)\s+countries from\s+(.+)\s+to\s+(.+)$/);
  if (countryRange) {
    const countriesFrom = catalog[locale].get("countries from");
    const to = catalog[locale].get("to");
    if (countriesFrom && to) {
      return preserveWhitespace(canonical, `${countryRange[1]} ${countriesFrom} ${countryRange[2]} ${to} ${countryRange[3]}`);
    }
  }
  let fragmentValue = clean;
  for (const fragment of dynamicUiFragments) {
    const translated = catalog[locale].get(fragment);
    if (!translated || !fragmentValue.includes(fragment)) continue;
    const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    fragmentValue = fragmentValue.replace(
      new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "gu"),
      translated
    );
  }
  if (fragmentValue !== clean) return preserveWhitespace(canonical, fragmentValue);
  return canonical;
}

type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; language: (typeof LANGUAGES)[number]; t: (value: string) => string };
const I18nContext = createContext<I18nValue | null>(null);

function localizeTree(root: Node, locale: Locale) {
  const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...document.body.querySelectorAll("*")];
  for (const element of elements) {
    if (element.matches("script,style,code,pre,[data-no-translate]") || element.closest("[data-no-translate]")) continue;
    for (const child of element.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE) continue;
      const node = child as Text;
      if (!originalText.has(node)) originalText.set(node, node.data);
      const source = canonicalEnglish(originalText.get(node)!);
      originalText.set(node, source);
      const translated = translate(source, locale);
      if (translated !== node.data) node.data = translated;
    }
    const saved = originalAttributes.get(element) || {};
    for (const name of ["aria-label", "placeholder", "title", "data-tooltip"]) {
      const current = element.getAttribute(name);
      if (current && !saved[name]) saved[name] = canonicalEnglish(current);
      if (saved[name]) saved[name] = canonicalEnglish(saved[name]);
      const translated = saved[name] ? translate(saved[name], locale, true) : null;
      if (translated && translated !== current) element.setAttribute(name, translated);
    }
    originalAttributes.set(element, saved);
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const routeLocale = readRouteLocale();
    if (routeLocale) return routeLocale;
    const saved = readStoredValue("sgp-klp-locale") as Locale | null;
    if (saved && locales.includes(saved)) return saved;
    const browserLocale = navigator.language.toLowerCase();
    return locales.find((item) => browserLocale.startsWith(item)) || "en";
  });
  const setLocale = (next: Locale) => {
    writeStoredValue("sgp-klp-locale", next);
    setLocaleState(next);
    navigateToLocale(next);
  };
  const language = LANGUAGES.find((item) => item.code === locale)!;

  useEffect(() => {
    if (!readRouteLocale() && locale !== "en") navigateToLocale(locale);
    const syncLocaleFromRoute = () => {
      const next = readRouteLocale() ?? "en";
      writeStoredValue("sgp-klp-locale", next);
      setLocaleState((current) => current === next ? current : next);
    };
    window.addEventListener("popstate", syncLocaleFromRoute);
    return () => window.removeEventListener("popstate", syncLocaleFromRoute);
  }, []);

  useEffect(() => {
    let disposed = false;
    document.documentElement.lang = locale;
    document.documentElement.dir = language.dir;
    document.title = translate("SGP Knowledge and Learning Platform", locale);
    localizeTree(document.body, locale);
    if (locale !== "en") {
      void ensureUiCompletionTranslations().then(() => {
        if (disposed) return;
        document.title = translate("SGP Knowledge and Learning Platform", locale);
        localizeTree(document.body, locale);
      });
    }
    let scheduled = false;
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          const original = originalText.get(node);
          if (original && node.data !== translate(original, locale)) originalText.set(node, canonicalEnglish(node.data));
          continue;
        }
        if (mutation.type === "attributes" && mutation.attributeName) {
          const element = mutation.target as Element;
          const saved = originalAttributes.get(element);
          const original = saved?.[mutation.attributeName];
          const current = element.getAttribute(mutation.attributeName);
          if (saved && original && current && current !== translate(original, locale, true)) saved[mutation.attributeName] = canonicalEnglish(current);
        }
      }
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; localizeTree(document.body, locale); });
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title", "data-tooltip"] });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [locale, language.dir]);

  const value = useMemo<I18nValue>(() => ({ locale, setLocale, language, t: (text) => translate(text, locale) }), [locale, language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}
