import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";

type LanguageCode = "fr" | "en" | "zh";

type Translations = Record<string, Record<LanguageCode, string>>;

const LOCALE_MAP: Record<LanguageCode, string> = {
  fr: "fr-FR",
  en: "en-US",
  zh: "zh-CN",
};

const STORAGE_KEY = "app_language";

// Dictionnaire minimal — peut être étendu progressivement
const TRANSLATIONS: Translations = {
  // Initial setup
  "initial.title.verify": {
    fr: "Bienvenue ! Vérifions votre identité",
    en: "Welcome! Let's verify your identity",
    zh: "欢迎！让我们验证您的身份",
  },
  "initial.title.pin": {
    fr: "Configuration du PIN",
    en: "PIN setup",
    zh: "设置 PIN",
  },
  "initial.step.1": { fr: "Étape 1/2", en: "Step 1/2", zh: "步骤 1/2" },
  "initial.step.2": { fr: "Étape 2/2", en: "Step 2/2", zh: "步骤 2/2" },
  "initial.subtitle.verify": {
    fr: "Configuration initiale de votre appareil",
    en: "Initial configuration of your device",
    zh: "设备初始配置",
  },
  "initial.subtitle.pin": {
    fr: "Configuration du code PIN",
    en: "PIN code configuration",
    zh: "PIN 码配置",
  },
  "initial.section.verify": {
    fr: "Vérification de l'identité",
    en: "Identity verification",
    zh: "身份验证",
  },
  "initial.labels.accountNumber": {
    fr: "Numéro de compte (8 chiffres minimum)",
    en: "Account number (min 8 digits)",
    zh: "账户号码（至少 8 位）",
  },
  "initial.placeholders.accountNumber": {
    fr: "Saisir votre numéro de compte",
    en: "Enter your account number",
    zh: "输入您的账户号码",
  },
  "initial.hint.accountNumber": {
    fr: "Entrez votre numéro de compte reçu par mail ou SMS (au moins 8 chiffres).",
    en: "Enter the account number received by email or SMS (at least 8 digits).",
    zh: "输入您通过邮件或短信收到的账户号码（至少 8 位）。",
  },
  "initial.actions.scan": {
    fr: "Scanner Code",
    en: "Scan Code",
    zh: "扫描二维码",
  },
  "initial.actions.verify.loading": {
    fr: "Vérification...",
    en: "Verifying...",
    zh: "正在验证...",
  },
  "initial.actions.verify": { fr: "Vérifier", en: "Verify", zh: "验证" },
  "initial.success.verify": {
    fr: "Identifiant vérifié avec succès 🎉",
    en: "Identifier verified successfully 🎉",
    zh: "验证成功 🎉",
  },
  "initial.hint.card": {
    fr: "Astuce: entrez le numéro de compte tel qu'indiqué sur votre carte client.",
    en: "Tip: enter the account number as shown on your client card.",
    zh: "提示：按客户卡上的号码输入账户号码。",
  },
  "initial.guestMode": {
    fr: "Continuer en mode invité",
    en: "Continue as guest",
    zh: "以访客模式继续",
  },
  "initial.labels.lastName": { fr: "Nom", en: "Last name", zh: "姓氏" },
  "initial.placeholders.lastName": {
    fr: "Votre nom",
    en: "Your last name",
    zh: "您的姓氏",
  },
  "initial.labels.firstName": { fr: "Prénom", en: "First name", zh: "名字" },
  "initial.placeholders.firstName": {
    fr: "Votre prénom",
    en: "Your first name",
    zh: "您的名字",
  },
  "initial.labels.login": { fr: "Login", en: "Login", zh: "登录名" },
  "initial.placeholders.login": {
    fr: "Choisissez votre nom d'utilisateur",
    en: "Choose your username",
    zh: "选择您的用户名",
  },
  "initial.labels.pin": {
    fr: "Code PIN (5 chiffres)",
    en: "PIN code (5 digits)",
    zh: "PIN 码（5 位）",
  },
  "initial.placeholders.pin": {
    fr: "Nouveau code PIN",
    en: "New PIN code",
    zh: "新的 PIN 码",
  },
  "initial.labels.pinConfirm": {
    fr: "Confirmation du code PIN (5 chiffres)",
    en: "Confirm PIN code (5 digits)",
    zh: "确认 PIN 码（5 位）",
  },
  "initial.placeholders.pinConfirm": {
    fr: "Confirmez votre code PIN",
    en: "Confirm your PIN code",
    zh: "确认您的 PIN 码",
  },
  "initial.labels.secret": {
    fr: "Clé secrète (min 3 caractères)",
    en: "Secret key (min 3 characters)",
    zh: "密钥（至少 3 个字符）",
  },
  "initial.placeholders.secret": {
    fr: "Votre clé secrète personnelle",
    en: "Your personal secret key",
    zh: "您的个人密钥",
  },
  "initial.hint.min4": {
    fr: "Minimum 4 chiffres",
    en: "Minimum 4 digits",
    zh: "至少 4 位",
  },
  "initial.hint.min3": {
    fr: "Minimum 3 caractères",
    en: "Minimum 3 characters",
    zh: "至少 3 个字符",
  },
  "initial.actions.save.loading": {
    fr: "Enregistrement...",
    en: "Saving...",
    zh: "正在保存...",
  },
  "initial.actions.save": { fr: "Enregistrer", en: "Save", zh: "保存" },
  "initial.hint.redirect": {
    fr: "Après succès, vous serez redirigé vers la connexion par PIN.",
    en: "After success, you will be redirected to PIN login.",
    zh: "成功后将跳转至 PIN 登录。",
  },
  // Settings sections and header
  "settings.header": { fr: "Paramètres", en: "Settings", zh: "设置" },
  "settings.section.account": { fr: "COMPTE", en: "ACCOUNT", zh: "账户" },
  "settings.section.finance": {
    fr: "SERVICES FINANCIERS",
    en: "FINANCIAL SERVICES",
    zh: "金融服务",
  },
  "settings.section.preferences": {
    fr: "PRÉFÉRENCES",
    en: "PREFERENCES",
    zh: "偏好设置",
  },
  "settings.section.security": { fr: "SÉCURITÉ", en: "SECURITY", zh: "安全" },
  "settings.section.support": { fr: "SUPPORT", en: "SUPPORT", zh: "支持" },
  "settings.section.app": { fr: "APPLICATION", en: "APPLICATION", zh: "应用" },
  "settings.section.logout": { fr: "DÉCONNEXION", en: "LOG OUT", zh: "退出" },

  // Settings items
  "settings.profile": { fr: "Mon Profil", en: "My Profile", zh: "我的资料" },
  "settings.pin": {
    fr: "Changer le code PIN",
    en: "Change PIN code",
    zh: "更改PIN码",
  },
  "settings.password": {
    fr: "Changer le mot de passe",
    en: "Change password",
    zh: "更改密码",
  },
  "settings.wallet": { fr: "Mon Wallet", en: "My Wallet", zh: "我的钱包" },
  "settings.accounts": {
    fr: "Gérer mes comptes",
    en: "Manage my accounts",
    zh: "管理我的账户",
  },
  "settings.beneficiaries": {
    fr: "Mes bénéficiaires",
    en: "My beneficiaries",
    zh: "我的收款人",
  },
  "settings.products": {
    fr: "Mes produits",
    en: "My products",
    zh: "我的产品",
  },
  "settings.notifications": {
    fr: "Notifications",
    en: "Notifications",
    zh: "通知",
  },
  "settings.language": { fr: "Langue", en: "Language", zh: "语言" },
  "settings.darkMode": { fr: "Mode sombre", en: "Dark mode", zh: "深色模式" },
  "settings.biometric": {
    fr: "Authentification biométrique",
    en: "Biometric authentication",
    zh: "生物识别验证",
  },
  "settings.privacy": { fr: "Confidentialité", en: "Privacy", zh: "隐私" },
  "settings.support.client": {
    fr: "Service client",
    en: "Customer service",
    zh: "客户服务",
  },
  "settings.support.chat": {
    fr: "Chat en ligne",
    en: "Online chat",
    zh: "在线聊天",
  },
  "settings.support.email": {
    fr: "Envoyer un email",
    en: "Send an email",
    zh: "发送电子邮件",
  },
  "settings.support.help": {
    fr: "Centre d'aide / FAQ",
    en: "Help center / FAQ",
    zh: "帮助中心 / 常见问题",
  },
  "settings.support.report": {
    fr: "Signaler un problème",
    en: "Report a problem",
    zh: "报告问题",
  },
  "settings.app.about": { fr: "À propos", en: "About", zh: "关于" },
  "settings.app.terms": {
    fr: "Conditions d'utilisation",
    en: "Terms of use",
    zh: "使用条款",
  },
  "settings.app.policy": {
    fr: "Politique de confidentialité",
    en: "Privacy policy",
    zh: "隐私政策",
  },
  "settings.app.rate": {
    fr: "Évaluer l'application",
    en: "Rate the app",
    zh: "评价应用",
  },
  "settings.app.share": {
    fr: "Partager l'application",
    en: "Share the app",
    zh: "分享应用",
  },
  // Rate screen
  "rate.hero.title": {
    fr: "Évaluer l’application",
    en: "Rate the app",
    zh: "评价应用",
  },
  "rate.hero.subtitle": {
    fr: "Que pensez-vous de l’application ?",
    en: "What do you think of the app?",
    zh: "您觉得这款应用如何？",
  },
  "rate.input.placeholder": {
    fr: "Laissez votre avis ici…",
    en: "Leave your feedback here…",
    zh: "在此留下您的评价…",
  },
  "rate.actions.submit": {
    fr: "Envoyer l’avis",
    en: "Send feedback",
    zh: "提交评价",
  },
  "rate.alert.info.title": { fr: "Info", en: "Info", zh: "信息" },
  "rate.alert.info.body": {
    fr: "Veuillez sélectionner une note.",
    en: "Please select a rating.",
    zh: "请先选择评分。",
  },
  "rate.alert.success.title": {
    fr: "Avis envoyé",
    en: "Feedback sent",
    zh: "评价已发送",
  },
  "rate.alert.success.body": {
    fr: "Merci pour votre retour !",
    en: "Thank you for your feedback!",
    zh: "感谢您的反馈！",
  },
  // About screen
  "about.hero.title": {
    fr: "À Propos de LA PEYRIE EMF",
    en: "About LA PEYRIE EMF",
    zh: "关于 LA PEYRIE EMF",
  },
  "about.hero.subtitle": {
    fr: "Établissement de microfinance agréé au Gabon",
    en: "Licensed microfinance institution in Gabon",
    zh: "加蓬认证的微型金融机构",
  },
  "about.presentation.title": {
    fr: "Présentation",
    en: "Overview",
    zh: "介绍",
  },
  "about.presentation.p1": {
    fr: "La microfinance LA PEYRIE EMF est un établissement de microfinance agréé au Gabon, opérant dans le secteur de l'inclusion financière. Elle fait partie des institutions légales reconnues par le Ministère de l'Économie, engagée à offrir des services financiers adaptés aux petites et moyennes entreprises, aux porteurs de projets, aux ménages et aux populations souvent exclues du système bancaire traditionnel.",
    en: "LA PEYRIE EMF is a licensed microfinance institution in Gabon, operating in the financial inclusion sector. It is a legally recognized institution by the Ministry of Economy, committed to offering tailored financial services to SMEs, project owners, households, and populations often excluded from traditional banking.",
    zh: "LA PEYRIE EMF 是加蓬获准的微型金融机构，致力于金融普惠领域。它是经济部认可的合法机构，为中小企业、项目发起人、家庭以及常被传统银行忽视的人群提供适配的金融服务。",
  },
  "about.presentation.p2": {
    fr: "LA PEYRIE EMF s'engage à jouer un rôle important dans la facilitation de l'accès au crédit, à l'épargne, et à d'autres services financiers, contribuant ainsi au développement économique local et à la réduction de la pauvreté.",
    en: "LA PEYRIE EMF is committed to facilitating access to credit, savings, and other financial services, contributing to local economic development and poverty reduction.",
    zh: "LA PEYRIE EMF 致力于促进获得信贷、储蓄及其他金融服务，从而推动当地经济发展并减少贫困。",
  },
  "about.governance.title": {
    fr: "Nouvelle Gouvernance 2025",
    en: "New Governance 2025",
    zh: "2025 新治理",
  },
  "about.governance.p1": {
    fr: "En 2025, LA PEYRIE EMF bénéficie d'une gouvernance renouvelée, avec une direction locale gabonaise conforme aux réformes gouvernementales visant à renforcer la souveraineté économique et la transparence dans le secteur. Cette nouvelle gestion vise à améliorer la rigueur dans la gestion des risques et à accroître la sécurité des opérations financières, tout en élargissant les offres dans une dynamique positive de croissance et de modernisation du secteur de la microfinance au Gabon, avec un accent particulier sur l'inclusion économique et sociale.",
    en: "In 2025, LA PEYRIE EMF adopts renewed governance with local Gabonese leadership in line with government reforms to strengthen economic sovereignty and transparency. This new management aims to improve risk control, enhance the security of financial operations, and expand offerings to drive growth and modernization in Gabon's microfinance sector, focusing on economic and social inclusion.",
    zh: "2025 年，LA PEYRIE EMF 采用焕新的治理结构，符合政府改革并由加蓬本地团队领导，以加强经济主权和行业透明度。新的管理将提升风险管控与金融业务安全，同时扩展服务以推动加蓬微型金融行业的增长与现代化，重视经济与社会包容。",
  },
  "about.commitments.title": {
    fr: "Nos Engagements",
    en: "Our Commitments",
    zh: "我们的承诺",
  },
  "about.commitments.item1": {
    fr: "Inclusion financière des populations non bancarisées.",
    en: "Financial inclusion for unbanked populations.",
    zh: "为未被银行覆盖人群提供金融包容。",
  },
  "about.commitments.item2": {
    fr: "Soutien aux petites entreprises, entrepreneurs et ménages.",
    en: "Support for small businesses, entrepreneurs, and households.",
    zh: "支持小型企业、创业者与家庭。",
  },
  "about.commitments.item3": {
    fr: "Conformité aux nouvelles réglementations pour une meilleure gouvernance.",
    en: "Compliance with new regulations for improved governance.",
    zh: "遵循新法规以提升治理水平。",
  },
  "about.commitments.item4": {
    fr: "Diversification des services financiers pour répondre aux besoins locaux.",
    en: "Diversified financial services to address local needs.",
    zh: "多样化金融服务以满足本地需求。",
  },
  "about.commitments.item5": {
    fr: "LA PEYRIE EMF se positionne comme un levier clé du développement économique inclusif au Gabon.",
    en: "LA PEYRIE EMF positions itself as a key driver of inclusive economic development in Gabon.",
    zh: "LA PEYRIE EMF 致力成为加蓬包容性经济发展的关键力量。",
  },
  "about.info.title": {
    fr: "Informations Clés",
    en: "Key Information",
    zh: "关键信息",
  },
  "about.info.foundation.label": {
    fr: "Année de fondation",
    en: "Year of foundation",
    zh: "成立年份",
  },
  "about.info.foundation.hint": {
    fr: "Créée pour promouvoir l’inclusion financière",
    en: "Founded to promote financial inclusion",
    zh: "成立旨在促进金融普惠",
  },
  "about.info.years.label": {
    fr: "Années d’expérience",
    en: "Years of experience",
    zh: "从业年限",
  },
  "about.info.years.hint": {
    fr: "Expertise croissante au service des clients",
    en: "Growing expertise serving clients",
    zh: "不断提升的专业能力服务客户",
  },
  "about.info.services.label": {
    fr: "Services proposés",
    en: "Services offered",
    zh: "提供的服务",
  },
  "about.info.services.hint": {
    fr: "Offres diversifiées adaptées aux besoins locaux",
    en: "Diversified offerings for local needs",
    zh: "多样化服务符合本地需求",
  },
  "about.info.availability.label": {
    fr: "Service disponible",
    en: "Service availability",
    zh: "服务可用性",
  },
  "about.info.availability.hint": {
    fr: "Disponibilité continue pour vous accompagner",
    en: "Continuous availability to support you",
    zh: "持续可用以支持您",
  },
  "about.social.title": {
    fr: "Notre Engagement Social",
    en: "Our Social Commitment",
    zh: "我们的社会责任承诺",
  },
  "about.social.p1": {
    fr: "LA PEYRIE EMF place l'humain au cœur de ses priorités. Nous accompagnons chaque client avec bienveillance et professionnalisme, en étant à l'écoute de ses besoins spécifiques.",
    en: "LA PEYRIE EMF places people at the heart of its priorities. We support each client with care and professionalism, listening to their specific needs.",
    zh: "LA PEYRIE EMF 将人置于核心位置。我们以关怀与专业为每位客户提供支持，倾听其特定需求。",
  },
  "about.mission.title": {
    fr: "Notre Mission",
    en: "Our Mission",
    zh: "我们的使命",
  },
  "about.mission.p1": {
    fr: "Promouvoir des solutions dans les métiers de la Microfinance pour soutenir et accompagner les populations et organisations dans la réalisation de leurs projets.",
    en: "Promote microfinance solutions to support populations and organizations in achieving their projects.",
    zh: "推广微型金融解决方案，支持个人与组织实现其项目。",
  },
  "about.vision.title": {
    fr: "Notre Vision",
    en: "Our Vision",
    zh: "我们的愿景",
  },
  "about.vision.p1": {
    fr: "Contribuer à l’amélioration des conditions de vie et à la construction d’un monde meilleur.",
    en: "Contribute to improving living conditions and building a better world.",
    zh: "致力于改善生活条件并建设更美好的世界。",
  },
  "about.values.title": {
    fr: "Nos Valeurs",
    en: "Our Values",
    zh: "我们的价值观",
  },
  "about.values.p1": {
    fr: "Proximité, Disponibilité, Simplicité, Rapidité, Innovation, Confiance et Responsabilité sociétale.",
    en: "Proximity, Availability, Simplicity, Speed, Innovation, Trust, and Social Responsibility.",
    zh: "亲近、可用、简洁、快速、创新、信任与社会责任。",
  },
  "about.contact.title": {
    fr: "Nous contacter",
    en: "Contact us",
    zh: "联系我们",
  },
  "about.contact.phone.title": { fr: "Téléphone", en: "Phone", zh: "电话" },
  "about.contact.phone.text": {
    fr: "+241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
    en: "+241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
    zh: "+241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
  },
  "about.contact.email.title": { fr: "Email", en: "Email", zh: "邮箱" },
  "about.contact.email.text": {
    fr: "info@lapeyrie-emf.ga",
    en: "info@lapeyrie-emf.ga",
    zh: "info@lapeyrie-emf.ga",
  },
  "about.contact.address.title": { fr: "Adresse", en: "Address", zh: "地址" },
  "about.contact.address.text": {
    fr: "BP 5657, Avenue de Cointét, Immeuble Orchidia, Libreville, Gabon",
    en: "BP 5657, Avenue de Cointét, Orchidia Building, Libreville, Gabon",
    zh: "BP 5657，Cointét 大道，Orchidia 大楼，加蓬利伯维尔",
  },
  "about.contact.website.title": { fr: "Site web", en: "Website", zh: "网站" },
  "about.contact.website.text": {
    fr: "www.lapeyrie-emf.ga",
    en: "www.lapeyrie-emf.ga",
    zh: "www.lapeyrie-emf.ga",
  },

  // Privacy screen
  "privacy.hero.title": {
    fr: "Politique de Confidentialité",
    en: "Privacy Policy",
    zh: "隐私政策",
  },
  "privacy.hero.subtitle": {
    fr: "Protection de vos données personnelles – Votre vie privée est notre priorité",
    en: "Protecting your personal data — Your privacy is our priority",
    zh: "保护您的个人数据——您的隐私是我们的首要任务",
  },
  "privacy.data.title": {
    fr: "Données collectées",
    en: "Data collected",
    zh: "收集的数据",
  },
  "privacy.data.intro": {
    fr: "Nous pouvons collecter les catégories de données suivantes :",
    en: "We may collect the following categories of data:",
    zh: "我们可能会收集以下类别的数据：",
  },
  "privacy.data.item1": {
    fr: "Identité (nom, prénom, date de naissance)",
    en: "Identity (name, surname, date of birth)",
    zh: "身份信息（姓名、出生日期）",
  },
  "privacy.data.item2": {
    fr: "Coordonnées (téléphone, email, adresse)",
    en: "Contact details (phone, email, address)",
    zh: "联系方式（电话、邮箱、地址）",
  },
  "privacy.data.item3": {
    fr: "Données professionnelles (poste, entreprise)",
    en: "Professional data (position, company)",
    zh: "职业数据（职位、公司）",
  },
  "privacy.data.item4": {
    fr: "Données bancaires (IBAN, transactions, historique)",
    en: "Bank data (IBAN, transactions, history)",
    zh: "银行数据（IBAN、交易、历史）",
  },
  "privacy.data.item5": {
    fr: "Données de navigation (logs, usage de l’app, cookies)",
    en: "Browsing data (logs, app usage, cookies)",
    zh: "浏览数据（日志、应用使用、Cookies）",
  },
  "privacy.use.title": {
    fr: "Utilisation des données",
    en: "Use of data",
    zh: "数据使用",
  },
  "privacy.use.intro": {
    fr: "Vos données sont utilisées pour les finalités suivantes et sur la base de la légalité applicable :",
    en: "Your data is used for the following purposes based on applicable legal grounds:",
    zh: "您的数据将用于以下目的，并依据适用的法律依据：",
  },
  "privacy.use.item1": {
    fr: "Gestion des comptes et services de microfinance",
    en: "Management of accounts and microfinance services",
    zh: "账户管理与微型金融服务",
  },
  "privacy.use.item2": {
    fr: "Sécurisation des accès et prévention de la fraude",
    en: "Securing access and fraud prevention",
    zh: "访问安全与防欺诈",
  },
  "privacy.use.item3": {
    fr: "Conformité réglementaire et obligations légales",
    en: "Regulatory compliance and legal obligations",
    zh: "监管合规与法律义务",
  },
  "privacy.use.item4": {
    fr: "Amélioration de l’app et support client",
    en: "App improvement and customer support",
    zh: "应用改进与客户支持",
  },
  "privacy.use.item5": {
    fr: "Communication d’informations essentielles (non commerciales)",
    en: "Communication of essential (non-commercial) information",
    zh: "传达重要（非商业）信息",
  },
  "privacy.share.title": {
    fr: "Partage des données",
    en: "Data sharing",
    zh: "数据共享",
  },
  "privacy.share.p1": {
    fr: "Les données peuvent être partagées avec des destinataires autorisés (partenaires, autorités) et, le cas échéant, faire l’objet de transferts internationaux conformes aux exigences légales.",
    en: "Data may be shared with authorized recipients (partners, authorities) and, where applicable, be subject to international transfers in compliance with legal requirements.",
    zh: "数据可能会与授权接收方（合作伙伴、监管机构）共享，并在适用情况下进行符合法律要求的跨境传输。",
  },
  "privacy.security.title": {
    fr: "Sécurité des données",
    en: "Data security",
    zh: "数据安全",
  },
  "privacy.security.p1": {
    fr: "Nous appliquons des mesures de sécurité techniques et organisationnelles (chiffrement, contrôle d’accès). En cas de violation, nous suivons les procédures de notification prévues par la loi.",
    en: "We apply technical and organizational security measures (encryption, access control). In case of a breach, we follow legal notification procedures.",
    zh: "我们采用技术与组织安全措施（加密、访问控制）。若发生安全事件，我们将遵循法律规定的通知流程。",
  },
  "privacy.rights.title": {
    fr: "Vos droits",
    en: "Your rights",
    zh: "您的权利",
  },
  "privacy.rights.item1": { fr: "Accès", en: "Access", zh: "访问权" },
  "privacy.rights.item2": {
    fr: "Rectification",
    en: "Rectification",
    zh: "更正权",
  },
  "privacy.rights.item3": { fr: "Effacement", en: "Erasure", zh: "删除权" },
  "privacy.rights.item4": { fr: "Opposition", en: "Objection", zh: "反对权" },
  "privacy.rights.item5": {
    fr: "Portabilité",
    en: "Portability",
    zh: "可携权",
  },
  "privacy.rights.item6": { fr: "Limitation", en: "Restriction", zh: "限制权" },
  "privacy.rights.p1": {
    fr: "Pour exercer vos droits, contactez-nous via les coordonnées ci-dessous.",
    en: "To exercise your rights, contact us using the details below.",
    zh: "如需行使您的权利，请通过以下联系方式与我们联系。",
  },
  "privacy.retention.title": {
    fr: "Conservation des données",
    en: "Data retention",
    zh: "数据保留",
  },
  "privacy.retention.p1": {
    fr: "Les données sont conservées pendant la durée nécessaire aux finalités poursuivies et conformément aux obligations légales et réglementaires.",
    en: "Data is retained for the duration necessary to meet the intended purposes and in accordance with legal and regulatory obligations.",
    zh: "数据将根据实现既定目的所需的时长进行保留，并遵循法律与监管要求。",
  },
  "privacy.cookies.title": { fr: "Cookies", en: "Cookies", zh: "Cookies" },
  "privacy.cookies.p1": {
    fr: "Des cookies peuvent être utilisés pour améliorer votre expérience et mesurer l’audience. Vous pouvez gérer vos préférences depuis les réglages de votre appareil ou navigateur.",
    en: "Cookies may be used to improve your experience and measure audience. You can manage preferences from your device or browser settings.",
    zh: "我们可能使用 Cookies 以改善体验并进行统计。您可在设备或浏览器设置中管理偏好。",
  },
  "privacy.changes.title": {
    fr: "Modifications de la politique",
    en: "Policy changes",
    zh: "政策变更",
  },
  "privacy.changes.p1": {
    fr: "Cette politique peut être mise à jour. La date de dernière mise à jour sera indiquée et, en cas de changement important, une notification pourra vous être adressée.",
    en: "This policy may be updated. The last update date will be indicated and, in case of significant changes, you may be notified.",
    zh: "本政策可能会更新。我们会标注最新更新日期，并在重大变更时通知您。",
  },
  "privacy.contact.title": {
    fr: "Contact et réclamations",
    en: "Contact and complaints",
    zh: "联系与投诉",
  },
  "privacy.contact.email": {
    fr: "Email : info@lapeyrie-emf.ga",
    en: "Email: info@lapeyrie-emf.ga",
    zh: "邮箱：info@lapeyrie-emf.ga",
  },
  "privacy.contact.phone": {
    fr: "Téléphone : +241 074 50 38 70",
    en: "Phone: +241 074 50 38 70",
    zh: "电话：+241 074 50 38 70",
  },
  "privacy.contact.address": {
    fr: "Adresse : BP 5657, Avenue de Cointét, Immeuble Orchidia, Libreville, Gabon",
    en: "Address: BP 5657, Avenue de Cointét, Orchidia Building, Libreville, Gabon",
    zh: "地址：BP 5657，Cointét 大道，Orchidia 大楼，加蓬利伯维尔",
  },

  // Terms screen
  "terms.hero.title": {
    fr: "Conditions d’utilisation",
    en: "Terms of Use",
    zh: "使用条款",
  },
  "terms.intro.title": { fr: "Introduction", en: "Introduction", zh: "简介" },
  "terms.intro.p1": {
    fr: "Cette application appartient à LA PEYRIE EMF, établissement de microfinance agréé au Gabon. En l’utilisant, vous acceptez ces conditions d’utilisation.",
    en: "This application belongs to LA PEYRIE EMF, a licensed microfinance institution in Gabon. By using it, you accept these terms of use.",
    zh: "本应用由 LA PEYRIE EMF（加蓬认证微型金融机构）所有。使用本应用即表示您接受本使用条款。",
  },
  "terms.use.title": {
    fr: "1. Utilisation de l’application",
    en: "1. Use of the application",
    zh: "1. 应用使用",
  },
  "terms.use.p1": {
    fr: "Vous vous engagez à utiliser l’application de manière légale et responsable. Fournissez des informations exactes et n’utilisez pas l’application à des fins frauduleuses.",
    en: "You agree to use the app legally and responsibly. Provide accurate information and do not use the app for fraudulent purposes.",
    zh: "您承诺以合法、负责的方式使用本应用。请提供准确的信息，且不得将应用用于欺诈目的。",
  },
  "terms.account.title": {
    fr: "2. Compte utilisateur",
    en: "2. User account",
    zh: "2. 用户账户",
  },
  "terms.account.p1": {
    fr: "Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte.",
    en: "You are responsible for the confidentiality of your credentials and any activity carried out from your account.",
    zh: "您需对您的凭据保密，并对使用您的账户进行的所有活动负责。",
  },
  "terms.personalData.title": {
    fr: "3. Données personnelles",
    en: "3. Personal data",
    zh: "3. 个人数据",
  },
  "terms.personalData.p1": {
    fr: "Vos informations sont utilisées uniquement pour le bon fonctionnement des services. Elles sont protégées conformément aux lois gabonaises sur la protection des données.",
    en: "Your information is used solely to operate the services properly. It is protected in accordance with Gabonese data protection laws.",
    zh: "您的信息仅用于确保服务正常运行，并按照加蓬数据保护法律进行保护。",
  },
  "terms.userResponsibilities.title": {
    fr: "4. Responsabilités de l’utilisateur",
    en: "4. User responsibilities",
    zh: "4. 用户责任",
  },
  "terms.userResponsibilities.p1": {
    fr: "Vous êtes responsable de toute action effectuée sur votre compte. Toute utilisation abusive peut entraîner la suspension de votre accès.",
    en: "You are responsible for any action performed on your account. Any misuse may result in suspension of your access.",
    zh: "您对在您的账户下进行的任何操作负责。任何滥用行为可能导致您的访问被暂停。",
  },
  "terms.modifications.title": {
    fr: "5. Modification des conditions",
    en: "5. Changes to the terms",
    zh: "5. 条款变更",
  },
  "terms.modifications.p1": {
    fr: "LA PEYRIE EMF peut mettre à jour ces conditions à tout moment. Les mises à jour prennent effet dès leur publication.",
    en: "LA PEYRIE EMF may update these terms at any time. Updates take effect upon publication.",
    zh: "LA PEYRIE EMF 可随时更新这些条款；更新自发布之时起生效。",
  },
  "terms.contact.title": {
    fr: "6. Contact",
    en: "6. Contact",
    zh: "6. 联系方式",
  },
  "terms.contact.phone": {
    fr: "Téléphone : +241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
    en: "Phone: +241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
    zh: "电话：+241 074 50 38 70 / +241 066 24 11 57 / +241 074 10 10 10",
  },
  "terms.contact.email": {
    fr: "Email : info@lapeyrie-emf.ga",
    en: "Email: info@lapeyrie-emf.ga",
    zh: "邮箱：info@lapeyrie-emf.ga",
  },
  "terms.contact.address": {
    fr: "Adresse : BP 5657, Avenue de Cointét, Immeuble Orchidia, Libreville, Gabon",
    en: "Address: BP 5657, Avenue de Cointét, Orchidia Building, Libreville, Gabon",
    zh: "地址：BP 5657，Cointét 大道，Orchidia 大楼，加蓬利伯维尔",
  },
  "terms.contact.website": {
    fr: "Site web : www.lapeyrie-emf.ga",
    en: "Website: www.lapeyrie-emf.ga",
    zh: "网站：www.lapeyrie-emf.ga",
  },
  "terms.consent.title": { fr: "Consentement", en: "Consent", zh: "同意" },
  "terms.consent.p1": {
    fr: "En utilisant cette application, vous acceptez sans réserve ces conditions d’utilisation.",
    en: "By using this application, you unreservedly accept these terms of use.",
    zh: "使用本应用即表示您无保留地接受这些使用条款。",
  },
  // Share screen
  "share.title": {
    fr: "Partager l’application",
    en: "Share the application",
    zh: "分享应用",
  },
  "share.subtitle": {
    fr: "Invitez vos amis et partagez LA PEYRIE EMF pour gérer vos finances facilement !",
    en: "Invite friends and share LA PEYRIE EMF to manage finances easily!",
    zh: "邀请朋友一起分享 LA PEYRIE EMF，轻松管理财务！",
  },
  "share.message": {
    fr: "Invitez vos amis et partagez LA PEYRIE EMF pour gérer vos finances facilement !",
    en: "Invite friends and share LA PEYRIE EMF to manage finances easily!",
    zh: "邀请朋友一起分享 LA PEYRIE EMF，轻松管理财务！",
  },
  "share.download": {
    fr: "Téléchargez l’application",
    en: "Download the app",
    zh: "下载应用",
  },
  "share.action.whatsapp": { fr: "WhatsApp", en: "WhatsApp", zh: "WhatsApp" },
  "share.action.messenger": {
    fr: "Messenger",
    en: "Messenger",
    zh: "Messenger",
  },
  "share.action.email": { fr: "Email", en: "Email", zh: "邮箱" },
  "share.action.sms": { fr: "SMS", en: "SMS", zh: "短信" },
  "share.action.copy": {
    fr: "Copier le lien",
    en: "Copy link",
    zh: "复制链接",
  },
  "share.alert.init": {
    fr: "Partage initialisé.",
    en: "Share initialized.",
    zh: "分享已启动。",
  },
  "share.alert.copied.title": { fr: "Copié", en: "Copied", zh: "已复制" },
  "share.alert.copied.body": {
    fr: "Lien copié dans le presse-papiers.",
    en: "Link copied to clipboard.",
    zh: "链接已复制到剪贴板。",
  },
  "share.alert.copyError.title": { fr: "Erreur", en: "Error", zh: "错误" },
  "share.alert.copyError.body": {
    fr: "Impossible de copier le lien.",
    en: "Unable to copy the link.",
    zh: "无法复制链接。",
  },
  "share.alert.emailOpenError.title": { fr: "Email", en: "Email", zh: "邮箱" },
  "share.alert.emailOpenError.body": {
    fr: "Impossible d’ouvrir le client email.",
    en: "Unable to open the email client.",
    zh: "无法打开邮箱客户端。",
  },
  "share.alert.emailDraft.title": { fr: "Email", en: "Email", zh: "邮箱" },
  "share.alert.emailDraft.body": {
    fr: "Brouillon créé dans votre client email.",
    en: "Draft created in your email client.",
    zh: "已在邮箱客户端创建草稿。",
  },

  // Support email screen
  "support.email.address.label": {
    fr: "Adresse email",
    en: "Email address",
    zh: "电子邮箱",
  },
  "support.email.address.placeholder": {
    fr: "Votre adresse email",
    en: "Your email address",
    zh: "您的电子邮箱",
  },
  "support.email.motif.label": { fr: "Motif", en: "Reason", zh: "类别" },
  "support.email.motif.support": { fr: "Support", en: "Support", zh: "支持" },
  "support.email.motif.claim": {
    fr: "Réclamation",
    en: "Complaint",
    zh: "投诉",
  },
  "support.email.motif.suggestion": {
    fr: "Suggestion",
    en: "Suggestion",
    zh: "建议",
  },
  "support.email.subject.label": { fr: "Sujet", en: "Subject", zh: "主题" },
  "support.email.subject.placeholder": {
    fr: "Sujet de votre email",
    en: "Email subject",
    zh: "邮件主题",
  },
  "support.email.body.label": { fr: "Message", en: "Message", zh: "内容" },
  "support.email.body.placeholder": {
    fr: "Décrivez votre problème ou question…",
    en: "Describe your issue or question…",
    zh: "描述您的问题或疑问…",
  },
  "support.email.body.default": {
    fr: "Décrivez votre demande",
    en: "Describe your request",
    zh: "请描述您的请求",
  },
  "support.email.alert.required.title": {
    fr: "Champs requis",
    en: "Required fields",
    zh: "必填项",
  },
  "support.email.alert.required.body": {
    fr: "Veuillez remplir tous les champs.",
    en: "Please fill in all fields.",
    zh: "请填写所有字段。",
  },
  "support.email.alert.invalidEmail.title": {
    fr: "Email invalide",
    en: "Invalid email",
    zh: "邮箱无效",
  },
  "support.email.alert.invalidEmail.body": {
    fr: "Veuillez saisir une adresse valide.",
    en: "Please enter a valid address.",
    zh: "请输入有效地址。",
  },
  "support.email.alert.info.title": { fr: "Info", en: "Info", zh: "信息" },
  "support.email.alert.info.bodyPrefix": {
    fr: "Impossible d’ouvrir le client email. Copiez l’adresse : ",
    en: "Unable to open the email client. Copy the address: ",
    zh: "无法打开邮箱客户端。请复制地址：",
  },
  "support.email.alert.success.title": {
    fr: "Succès",
    en: "Success",
    zh: "成功",
  },
  "support.email.alert.success.body": {
    fr: "Message envoyé avec succès !",
    en: "Message sent successfully!",
    zh: "消息发送成功！",
  },
  "support.email.action.send": {
    fr: "Envoyer le message",
    en: "Send message",
    zh: "发送信息",
  },
  "settings.logout": { fr: "Se déconnecter", en: "Log out", zh: "退出登录" },
  "settings.version": { fr: "Version", en: "Version", zh: "版本" },
  "settings.copyright": {
    fr: "© 2025 La Pepite EMF",
    en: "© 2025 La Pepite EMF",
    zh: "© 2025 La Pepite EMF",
  },

  // Navigator titles
  "transactions.transfer": { fr: "Virement", en: "Transfer", zh: "转账" },
  "accounts.list": { fr: "Mes Comptes", en: "My Accounts", zh: "我的账户" },
  "accounts.details": {
    fr: "Détails du compte",
    en: "Account details",
    zh: "账户详情",
  },
  // Accounts module
  "accounts.header.portfolioTotal": {
    fr: "Portfolio Total",
    en: "Total Portfolio",
    zh: "总资产组合",
  },
  "accounts.stats.month": { fr: "Ce mois", en: "This month", zh: "本月" },
  "accounts.stats.accounts": { fr: "Comptes", en: "Accounts", zh: "账户" },
  "accounts.stats.transactions": {
    fr: "Transactions",
    en: "Transactions",
    zh: "交易",
  },
  "accounts.filters.all": { fr: "Tous", en: "All", zh: "全部" },
  "accounts.filters.checking": { fr: "Chèque", en: "Checking", zh: "支票" },
  "accounts.filters.savings": { fr: "Épargne", en: "Savings", zh: "储蓄" },
  "accounts.filters.current": { fr: "Courant", en: "Current", zh: "活期" },
  "accounts.type.checking": {
    fr: "Compte Chèque",
    en: "Checking Account",
    zh: "支票账户",
  },
  "accounts.type.savings": {
    fr: "Compte Épargne",
    en: "Savings Account",
    zh: "储蓄账户",
  },
  "accounts.type.current": {
    fr: "Compte Courant",
    en: "Current Account",
    zh: "活期账户",
  },
  "accounts.status.active": { fr: "Actif", en: "Active", zh: "启用" },
  "accounts.balance.available": {
    fr: "Solde disponible",
    en: "Available balance",
    zh: "可用余额",
  },
  "accounts.details.openedOn": {
    fr: "Ouvert le",
    en: "Opened on",
    zh: "开户日期",
  },
  "accounts.details.secured": {
    fr: "Sécurisé",
    en: "Secured",
    zh: "已加密保护",
  },
  "accounts.quick.transfer": { fr: "Virer", en: "Transfer", zh: "转账" },
  "accounts.quick.topup": { fr: "Recharger", en: "Top up", zh: "充值" },
  "accounts.quick.statement": { fr: "Relevé", en: "Statement", zh: "对账单" },
  "accounts.quick.block": { fr: "Bloquer", en: "Block", zh: "冻结" },
  "accounts.expensesByCategory.title": {
    fr: "Dépenses par catégorie",
    en: "Expenses by category",
    zh: "分类支出",
  },
  "common.details": { fr: "Détails", en: "Details", zh: "详情" },
  "accounts.limits.title": {
    fr: "Limites et plafonds",
    en: "Limits and caps",
    zh: "限额与上限",
  },
  "accounts.limits.dailyWithdrawal": {
    fr: "Retrait quotidien",
    en: "Daily withdrawal",
    zh: "每日取款",
  },
  "accounts.limits.monthlyTransfer": {
    fr: "Virement mensuel",
    en: "Monthly transfer",
    zh: "每月转账",
  },
  "accounts.info.title": {
    fr: "Informations du compte",
    en: "Account information",
    zh: "账户信息",
  },
  "accounts.info.accountNumber": {
    fr: "Numéro de compte",
    en: "Account number",
    zh: "账户号码",
  },
  "accounts.info.accountType": {
    fr: "Type de compte",
    en: "Account type",
    zh: "账户类型",
  },
  "accounts.info.currency": { fr: "Devise", en: "Currency", zh: "货币" },
  "accounts.info.status": { fr: "Statut", en: "Status", zh: "状态" },
  // Account categories
  "accounts.category.food": { fr: "Alimentation", en: "Food", zh: "餐饮" },
  "accounts.category.transport": {
    fr: "Transport",
    en: "Transport",
    zh: "交通",
  },
  "accounts.category.leisure": { fr: "Loisirs", en: "Leisure", zh: "娱乐" },
  "accounts.category.other": { fr: "Autres", en: "Others", zh: "其他" },
  // Common currency labels
  "common.currency.xof": {
    fr: "XOF (Franc CFA)",
    en: "XOF (CFA franc)",
    zh: "XOF（西非法郎）",
  },
  "cards.list": { fr: "Mes Cartes", en: "My Cards", zh: "我的卡片" },
  "products.detail": {
    fr: "Détail du produit",
    en: "Product details",
    zh: "产品详情",
  },
  // Bottom tabs
  "tabs.dashboard": { fr: "Accueil", en: "Home", zh: "首页" },
  "tabs.transactions": { fr: "Transactions", en: "Transactions", zh: "交易" },
  "tabs.products": { fr: "Produits", en: "Products", zh: "产品" },
  "tabs.settings": { fr: "Paramètres", en: "Settings", zh: "设置" },

  // Dashboard
  "dashboard.qr.title": {
    fr: "Mon QR Code",
    en: "My QR Code",
    zh: "我的二维码",
  },
  "dashboard.qr.name": { fr: "Nom", en: "Name", zh: "姓名" },
  "dashboard.qr.clientCode": {
    fr: "Code client",
    en: "Client code",
    zh: "客户代码",
  },
  "dashboard.qr.phone": { fr: "Téléphone", en: "Phone", zh: "电话" },
  "dashboard.qr.tip": {
    fr: "Présentez ce QR code à un agent pour effectuer un versement rapide sur votre compte",
    en: "Show this QR code to an agent to quickly deposit to your account",
    zh: "向工作人员出示此二维码即可快速向您的账户存款",
  },
  "dashboard.greeting": { fr: "Bonjour 👋", en: "Hello 👋", zh: "你好 👋" },
  "dashboard.accountType.premium": {
    fr: "Compte Premium",
    en: "Premium Account",
    zh: "高级账户",
  },
  "dashboard.balance.label": {
    fr: "Solde total disponible",
    en: "Total available balance",
    zh: "可用总余额",
  },
  "dashboard.balance.activeAccountLabel": {
    fr: "compte actif",
    en: "active account",
    zh: "个活跃账户",
  },
  "dashboard.balance.activeAccountsLabel": {
    fr: "comptes actifs",
    en: "active accounts",
    zh: "个活跃账户",
  },
  "dashboard.actions.quick": {
    fr: "Actions rapides",
    en: "Quick actions",
    zh: "快速操作",
  },
  "dashboard.actions.transfer": { fr: "Virement", en: "Transfer", zh: "转账" },
  "dashboard.actions.accounts": { fr: "Comptes", en: "Accounts", zh: "账户" },
  "dashboard.actions.cards": { fr: "Cartes", en: "Cards", zh: "卡片" },
  "dashboard.quick.transfer": { fr: "Virement", en: "Transfer", zh: "转账" },
  "dashboard.quick.transfer.subtitle": {
    fr: "Transférer",
    en: "Send",
    zh: "转出",
  },
  "dashboard.quick.beneficiaries": {
    fr: "Bénéficiaires",
    en: "Beneficiaries",
    zh: "收款人",
  },
  "dashboard.quick.beneficiaries.subtitle": {
    fr: "Gérer",
    en: "Manage",
    zh: "管理",
  },
  "dashboard.quick.products": {
    fr: "Mes produits",
    en: "My products",
    zh: "我的产品",
  },
  "dashboard.quick.products.subtitle": {
    fr: "Découvrir",
    en: "Discover",
    zh: "发现",
  },
  "dashboard.quick.cards": { fr: "Mes cartes", en: "My cards", zh: "我的卡片" },
  "dashboard.quick.cards.subtitle": { fr: "Consulter", en: "View", zh: "查看" },
  "dashboard.offers.title": {
    fr: "Offres spéciales",
    en: "Special offers",
    zh: "特别优惠",
  },
  "dashboard.services.title": {
    fr: "Nos services",
    en: "Our services",
    zh: "我们的服务",
  },
  "dashboard.recent.title": {
    fr: "Activité récente",
    en: "Recent activity",
    zh: "最近活动",
  },
  "dashboard.recent.seeAll": { fr: "Tout voir", en: "See all", zh: "查看全部" },
  "dashboard.recent.seeLess": { fr: "Voir moins", en: "See less", zh: "收起" },

  // Beneficiaries page
  "beneficiaries.header.title": {
    fr: "Bénéficiaires",
    en: "Beneficiaries",
    zh: "收款人",
  },
  "beneficiaries.header.countSuffix": {
    fr: "contacts",
    en: "contacts",
    zh: "联系人",
  },
  "beneficiaries.stats.favorites": {
    fr: "Favoris",
    en: "Favorites",
    zh: "收藏",
  },
  "beneficiaries.stats.transferred": {
    fr: "Transféré",
    en: "Transferred",
    zh: "已转账",
  },
  "beneficiaries.stats.total": { fr: "Total", en: "Total", zh: "总计" },
  "beneficiaries.quick.title": {
    fr: "Accès rapide",
    en: "Quick access",
    zh: "快速访问",
  },
  "beneficiaries.search.placeholder": {
    fr: "Rechercher un bénéficiaire...",
    en: "Search a beneficiary...",
    zh: "搜索收款人...",
  },
  "beneficiaries.tabs.all": { fr: "Tous", en: "All", zh: "全部" },
  "beneficiaries.tabs.favorites": {
    fr: "Favoris",
    en: "Favorites",
    zh: "收藏",
  },
  "beneficiaries.help.contact": {
    fr: "Pour toute question, contactez votre conseiller ou notre service client au +241 XX XX XX XX",
    en: "For any questions, contact your advisor or our customer service at +241 XX XX XX XX",
    zh: "如有疑问，请联系您的顾问或致电客户服务 +241 XX XX XX XX",
  },

  // Beneficiaries modal
  "beneficiaries.modal.title": {
    fr: "Nouveau bénéficiaire",
    en: "New beneficiary",
    zh: "新增收款人",
  },
  "beneficiaries.modal.fullName": {
    fr: "Nom complet",
    en: "Full name",
    zh: "姓名",
  },
  "beneficiaries.modal.accountNumber": {
    fr: "Numéro de compte",
    en: "Account number",
    zh: "账户号码",
  },
  "beneficiaries.modal.bank": { fr: "Banque", en: "Bank", zh: "银行" },
  "beneficiaries.modal.selectBank": {
    fr: "Sélectionner une banque",
    en: "Select a bank",
    zh: "选择银行",
  },
  "beneficiaries.modal.emailOptional": {
    fr: "Email (optionnel)",
    en: "Email (optional)",
    zh: "邮箱（可选）",
  },
  "beneficiaries.modal.save": {
    fr: "✓ Enregistrer",
    en: "✓ Save",
    zh: "✓ 保存",
  },
  "dashboard.offer.badge.new": { fr: "Nouveau", en: "New", zh: "新品" },
  "dashboard.offer.badge.limited": { fr: "Limitée", en: "Limited", zh: "限时" },
  "dashboard.offer.creditExpress": {
    fr: "Crédit Express",
    en: "Express Credit",
    zh: "快速贷款",
  },
  // Common actions
  "common.cancel": { fr: "Annuler", en: "Cancel", zh: "取消" },
  "common.confirm": { fr: "Confirmer", en: "Confirm", zh: "确认" },
  "common.ok": { fr: "OK", en: "OK", zh: "确定" },
  "common.success": { fr: "Succès", en: "Success", zh: "成功" },
  "common.close": { fr: "Fermer", en: "Close", zh: "关闭" },

  // Products detail
  "products.detail.modal.confirm.prefix": {
    fr: "Souhaitez-vous souscrire à",
    en: "Do you want to subscribe to",
    zh: "您是否要订阅",
  },
  "products.detail.modal.success.body": {
    fr: "Votre demande a été envoyée avec succès",
    en: "Your request was sent successfully",
    zh: "您的请求已成功发送",
  },

  // Current Account
  "products.currentAccount.adv1": {
    fr: "Carte bancaire gratuite incluse",
    en: "Free bank card included",
    zh: "包含免费银行卡",
  },
  "products.currentAccount.adv2": {
    fr: "Virements illimités sans frais",
    en: "Unlimited transfers with no fees",
    zh: "无限次转账免手续费",
  },
  "products.currentAccount.adv3": {
    fr: "Relevé mensuel détaillé",
    en: "Detailed monthly statements",
    zh: "详细月度对账单",
  },
  "products.currentAccount.adv4": {
    fr: "Application mobile performante",
    en: "High-performance mobile app",
    zh: "高性能移动应用",
  },
  "products.currentAccount.adv5": {
    fr: "Service client dédié 7j/7",
    en: "Dedicated customer service 7/7",
    zh: "7 天客服支持",
  },
  "products.currentAccount.cond1": {
    fr: "Dépôt minimum : 25 000 XAF",
    en: "Minimum deposit: 25,000 XAF",
    zh: "最低存款：25,000 XAF",
  },
  "products.currentAccount.cond2": {
    fr: "Frais de tenue : 1 500 XAF/mois",
    en: "Maintenance fee: 1,500 XAF/month",
    zh: "账户维护费：每月 1,500 XAF",
  },
  "products.currentAccount.cond3": {
    fr: "Pièce d’identité requise",
    en: "ID document required",
    zh: "需要身份证件",
  },

  // Visa Premium
  "products.visaPremium.adv1": {
    fr: "Assurance voyage incluse",
    en: "Travel insurance included",
    zh: "包含旅行保险",
  },
  "products.visaPremium.adv2": {
    fr: "Cashback 2% sur tous vos achats",
    en: "2% cashback on all purchases",
    zh: "所有消费返现 2%",
  },
  "products.visaPremium.adv3": {
    fr: "Paiement sans contact",
    en: "Contactless payment",
    zh: "非接触式支付",
  },
  "products.visaPremium.adv4": {
    fr: "Protection contre la fraude",
    en: "Fraud protection",
    zh: "防欺诈保护",
  },
  "products.visaPremium.adv5": {
    fr: "Assistance premium 24/7",
    en: "Premium assistance 24/7",
    zh: "24/7 高级客服",
  },
  "products.visaPremium.cond1": {
    fr: "Compte courant requis",
    en: "Current account required",
    zh: "需要活期账户",
  },
  "products.visaPremium.cond2": {
    fr: "Cotisation : 5 000 XAF/an",
    en: "Fee: 5,000 XAF/year",
    zh: "年费：5,000 XAF",
  },
  "products.visaPremium.cond3": {
    fr: "Plafond : 500 000 XAF/jour",
    en: "Limit: 500,000 XAF/day",
    zh: "每日限额：500,000 XAF",
  },

  // Micro Credit Express
  "products.microCredit.adv1": {
    fr: "Réponse en 24h maximum",
    en: "Response within 24h",
    zh: "24 小时内回复",
  },
  "products.microCredit.adv2": {
    fr: "Taux d’intérêt avantageux",
    en: "Competitive interest rates",
    zh: "优惠利率",
  },
  "products.microCredit.adv3": {
    fr: "Remboursement flexible",
    en: "Flexible repayment",
    zh: "灵活还款",
  },
  "products.microCredit.adv4": {
    fr: "Montant jusqu’à 500 000 XAF",
    en: "Amount up to 500,000 XAF",
    zh: "额度最高 500,000 XAF",
  },
  "products.microCredit.adv5": {
    fr: "Procédure 100% digitale",
    en: "100% digital process",
    zh: "全程数字化流程",
  },
  "products.microCredit.cond1": {
    fr: "Être client depuis 3 mois",
    en: "Client for at least 3 months",
    zh: "成为客户至少 3 个月",
  },
  "products.microCredit.cond2": {
    fr: "Justificatif de revenus",
    en: "Proof of income",
    zh: "收入证明",
  },
  "products.microCredit.cond3": {
    fr: "Durée : 3 à 12 mois",
    en: "Duration: 3 to 12 months",
    zh: "期限：3 至 12 个月",
  },

  // Health Insurance
  "products.healthInsurance.adv1": {
    fr: "Couverture médicale complète",
    en: "Comprehensive medical coverage",
    zh: "全面医疗保障",
  },
  "products.healthInsurance.adv2": {
    fr: "Remboursement sous 48h",
    en: "Reimbursement within 48h",
    zh: "48 小时内报销",
  },
  "products.healthInsurance.adv3": {
    fr: "Assistance médicale 24/7",
    en: "24/7 medical assistance",
    zh: "24/7 医疗援助",
  },
  "products.healthInsurance.adv4": {
    fr: "Réseau de partenaires étendu",
    en: "Wide partner network",
    zh: "广泛合作网络",
  },
  "products.healthInsurance.adv5": {
    fr: "Prise en charge directe",
    en: "Direct coverage",
    zh: "直接报销",
  },
  "products.healthInsurance.cond1": {
    fr: "À partir de 15 000 XAF/mois",
    en: "From 15,000 XAF/month",
    zh: "每月起价 15,000 XAF",
  },
  "products.healthInsurance.cond2": {
    fr: "Questionnaire médical",
    en: "Medical questionnaire",
    zh: "医疗问卷",
  },
  "products.healthInsurance.cond3": {
    fr: "Couverture jusqu'à 6 personnes",
    en: "Coverage up to 6 people",
    zh: "最多覆盖 6 人",
  },

  // Savings Project
  "products.savingsProject.adv1": {
    fr: "Objectifs personnalisés",
    en: "Personalized goals",
    zh: "个性化目标",
  },
  "products.savingsProject.adv2": {
    fr: "Suivi en temps réel",
    en: "Real-time tracking",
    zh: "实时跟踪",
  },
  "products.savingsProject.adv3": {
    fr: "Bonus de fidélité 3%",
    en: "3% loyalty bonus",
    zh: "3% 忠诚奖励",
  },
  "products.savingsProject.adv4": {
    fr: "Versements automatiques",
    en: "Automatic deposits",
    zh: "自动存款",
  },
  "products.savingsProject.adv5": {
    fr: "Conseils personnalisés",
    en: "Personalized advice",
    zh: "个性化建议",
  },
  "products.savingsProject.cond1": {
    fr: "Dépôt initial : 10 000 XAF",
    en: "Initial deposit: 10,000 XAF",
    zh: "初始存款：10,000 XAF",
  },
  "products.savingsProject.cond2": {
    fr: "Versement minimum : 5 000 XAF",
    en: "Minimum deposit: 5,000 XAF",
    zh: "最低存款：5,000 XAF",
  },
  "products.savingsProject.cond3": {
    fr: "Durée : 6 à 36 mois",
    en: "Duration: 6 to 36 months",
    zh: "期限：6 至 36 个月",
  },

  // Product list (titles/subtitles/descriptions)
  "products.list.microCreditExpress.title": {
    fr: "Micro-crédit Express",
    en: "Micro-credit Express",
    zh: "快速小额信贷",
  },
  "products.list.microCreditExpress.subtitle": {
    fr: "Financement rapide",
    en: "Fast financing",
    zh: "快速融资",
  },
  "products.list.microCreditExpress.description": {
    fr: "Obtenez un crédit rapidement pour vos projets",
    en: "Get credit quickly for your projects",
    zh: "快速获取项目所需的贷款",
  },
  "products.list.healthInsurance.title": {
    fr: "Assurance Santé",
    en: "Health Insurance",
    zh: "健康保险",
  },
  "products.list.healthInsurance.subtitle": {
    fr: "Protection famille",
    en: "Family protection",
    zh: "家庭保障",
  },
  "products.list.healthInsurance.description": {
    fr: "Protégez votre famille avec notre assurance santé",
    en: "Protect your family with our health insurance",
    zh: "使用我们的健康保险保护您的家人",
  },
  "products.list.savingsStandard.title": {
    fr: "Compte Épargne",
    en: "Savings Account",
    zh: "储蓄账户",
  },
  "products.list.savingsStandard.subtitle": {
    fr: "Épargner et gagner",
    en: "Save and earn",
    zh: "储蓄并获利",
  },
  "products.list.savingsStandard.description": {
    fr: "Faites fructifier votre épargne avec des taux attractifs",
    en: "Grow your savings with attractive rates",
    zh: "以有吸引力的利率增值您的储蓄",
  },
  "products.list.savingsProject.title": {
    fr: "Épargne Projet",
    en: "Project Savings",
    zh: "项目储蓄",
  },
  "products.list.savingsProject.subtitle": {
    fr: "Objectifs personnalisés",
    en: "Personalized goals",
    zh: "个性化目标",
  },
  "products.list.savingsProject.description": {
    fr: "Épargnez pour vos projets avec un plan personnalisé",
    en: "Save for your projects with a personalized plan",
    zh: "通过个性化计划为您的项目储蓄",
  },

  // Analytics
  "analytics.title": {
    fr: "Statistiques générales",
    en: "General statistics",
    zh: "总体统计",
  },
  "analytics.loading": { fr: "Chargement…", en: "Loading…", zh: "加载中…" },
  "analytics.errorLoading": {
    fr: "Erreur lors du chargement des données",
    en: "Error loading data",
    zh: "加载数据时出错",
  },
  "analytics.label.debitCount": {
    fr: "Nombre d'op sortante",
    en: "Outgoing operations count",
    zh: "支出操作数量",
  },
  "analytics.label.creditCount": {
    fr: "Nombre d'op entrante",
    en: "Incoming operations count",
    zh: "收入操作数量",
  },
  "analytics.label.totalCount": {
    fr: "Total des opérations",
    en: "Total operations",
    zh: "总操作数",
  },
  "analytics.label.percentDebit": {
    fr: "Pourcentage débit",
    en: "Debit percentage",
    zh: "支出百分比",
  },
  "analytics.label.percentCredit": {
    fr: "Pourcentage crédit",
    en: "Credit percentage",
    zh: "收入百分比",
  },
  "analytics.label.strongTrend": {
    fr: "Sens fort",
    en: "Strong trend",
    zh: "强势方向",
  },
  "analytics.chart.barTitle": {
    fr: "Nombre d'opérations (barres)",
    en: "Operations count (bars)",
    zh: "操作数量（柱形图）",
  },
  "analytics.chart.donutTitle": {
    fr: "Répartition crédit / débit (donut)",
    en: "Credit/Debit distribution (donut)",
    zh: "收入/支出分布（甜甜圈图）",
  },
  "analytics.legend.debit": {
    fr: "Pourcentage débit",
    en: "Debit percentage",
    zh: "支出百分比",
  },
  "analytics.legend.credit": {
    fr: "Pourcentage crédit",
    en: "Credit percentage",
    zh: "收入百分比",
  },
  "analytics.label.debitShort": {
    fr: "nombre d'op sortante",
    en: "outgoing ops",
    zh: "支出操作",
  },
  "analytics.label.creditShort": {
    fr: "nombre d'op entrante",
    en: "incoming ops",
    zh: "收入操作",
  },
  "analytics.label.totalShort": { fr: "Cumul", en: "Total", zh: "累计" },
  // Product list features
  "products.list.microCreditExpress.feature.response24h": {
    fr: "Réponse en 24h",
    en: "Response within 24h",
    zh: "24 小时内回复",
  },
  "products.list.microCreditExpress.feature.rateAdvantage": {
    fr: "Taux avantageux",
    en: "Competitive rate",
    zh: "优惠利率",
  },
  "products.list.healthInsurance.feature.coverage": {
    fr: "Couverture complète",
    en: "Full coverage",
    zh: "全面保障",
  },
  "products.list.healthInsurance.feature.fastReimbursement": {
    fr: "Remboursement rapide",
    en: "Fast reimbursement",
    zh: "快速报销",
  },
  "products.list.savingsStandard.feature.rate5": {
    fr: "Taux d’intérêt 5%",
    en: "5% interest rate",
    zh: "5% 利率",
  },
  "products.list.savingsStandard.feature.flexWithdrawals": {
    fr: "Retraits flexibles",
    en: "Flexible withdrawals",
    zh: "灵活取款",
  },
  "products.list.savingsProject.feature.targetedGoals": {
    fr: "Objectifs ciblés",
    en: "Targeted goals",
    zh: "目标明确",
  },
  "products.list.savingsProject.feature.realTime": {
    fr: "Suivi en temps réel",
    en: "Real-time tracking",
    zh: "实时跟踪",
  },
  "dashboard.offer.creditExpress.subtitle": {
    fr: "Obtenez jusqu'à 5M FCFA",
    en: "Get up to 5M FCFA",
    zh: "最高可获 500万 非洲法郎",
  },
  "dashboard.offer.creditExpress.desc": {
    fr: "Taux préférentiel 4.5%",
    en: "Preferential rate 4.5%",
    zh: "优惠利率 4.5%",
  },
  "dashboard.offer.savingsPlus": {
    fr: "Épargne Plus",
    en: "Savings Plus",
    zh: "增值储蓄",
  },
  "dashboard.offer.savingsPlus.subtitle": {
    fr: "Rendement garanti 6%",
    en: "Guaranteed yield 6%",
    zh: "保底收益 6%",
  },
  "dashboard.offer.savingsPlus.desc": {
    fr: "Capital 100% sécurisé",
    en: "Capital 100% secured",
    zh: "资金 100% 安全",
  },
  "dashboard.service.billPay": {
    fr: "Paiement factures",
    en: "Bill payment",
    zh: "缴费",
  },
  "dashboard.service.billPay.subtitle": {
    fr: "Eau, électricité",
    en: "Water, electricity",
    zh: "水、电",
  },
  "dashboard.service.recharge": { fr: "Recharge", en: "Top-up", zh: "充值" },
  "dashboard.service.recharge.subtitle": {
    fr: "Tous opérateurs",
    en: "All operators",
    zh: "所有运营商",
  },
  "dashboard.service.insurance": {
    fr: "Assurance",
    en: "Insurance",
    zh: "保险",
  },
  "dashboard.service.insurance.subtitle": {
    fr: "Protection complète",
    en: "Full protection",
    zh: "全面保障",
  },
  "dashboard.service.creditExpress": {
    fr: "Crédit Express",
    en: "Express Credit",
    zh: "快速贷款",
  },
  "dashboard.service.creditExpress.subtitle": {
    fr: "Prêt rapide",
    en: "Fast loan",
    zh: "快速贷款",
  },
  "dashboard.tx.received": {
    fr: "Virement reçu",
    en: "Transfer received",
    zh: "收到转账",
  },
  "dashboard.tx.atm": {
    fr: "Retrait ATM",
    en: "ATM withdrawal",
    zh: "ATM取款",
  },
  "dashboard.tx.bill": {
    fr: "Paiement facture",
    en: "Bill payment",
    zh: "账单支付",
  },
  "dashboard.date.today": { fr: "Aujourd'hui", en: "Today", zh: "今天" },
  "dashboard.date.yesterday": { fr: "Hier", en: "Yesterday", zh: "昨天" },
  "dashboard.date.2days": {
    fr: "Il y a 2 jours",
    en: "2 days ago",
    zh: "两天前",
  },

  // Language screen
  "language.title": {
    fr: "Choisir la langue",
    en: "Choose language",
    zh: "选择语言",
  },
  "language.note.title": {
    fr: "La langue sera appliquée à l’ensemble de l’application.",
    en: "The language will be applied to the entire app.",
    zh: "语言将应用于整个应用程序。",
  },
  "language.fr": { fr: "Français", en: "French", zh: "法语" },
  "language.en": { fr: "English", en: "English", zh: "英语" },
  "language.zh": { fr: "中文", en: "Chinese", zh: "中文" },

  // Theme preferences
  "theme.choose": {
    fr: "Choisir le thème",
    en: "Choose theme",
    zh: "选择主题",
  },
  "theme.light": { fr: "Clair", en: "Light", zh: "浅色" },
  "theme.dark": { fr: "Sombre", en: "Dark", zh: "深色" },
  "theme.system": { fr: "Système", en: "System", zh: "跟随系统" },
  "theme.followSystem": {
    fr: "Suivre le système",
    en: "Follow system",
    zh: "跟随系统",
  },

  // Products screen
  "products.header.title": {
    fr: "Mes produits",
    en: "My products",
    zh: "我的产品",
  },
  "products.header.available": {
    fr: "produits disponibles",
    en: "products available",
    zh: "可用产品",
  },
  "products.stats.active": { fr: "Actifs", en: "Active", zh: "活跃" },
  "products.stats.pending": { fr: "En attente", en: "Pending", zh: "待处理" },
  "products.stats.total": { fr: "Total", en: "Total", zh: "总计" },
  "products.category.all": { fr: "Tous", en: "All", zh: "全部" },
  "products.category.accounts": { fr: "Comptes", en: "Accounts", zh: "账户" },
  "products.category.savings": { fr: "Épargne", en: "Savings", zh: "储蓄" },
  "products.category.credit": { fr: "Crédit", en: "Credit", zh: "信贷" },
  "products.category.services": { fr: "Services", en: "Services", zh: "服务" },
  "products.status.active": { fr: "Actif", en: "Active", zh: "启用" },
  "products.action.details": {
    fr: "Voir détails",
    en: "See details",
    zh: "查看详情",
  },

  // Transactions screen
  "transactions.summary.in": { fr: "Entrées", en: "Incomes", zh: "收入" },
  "transactions.summary.out": { fr: "Sorties", en: "Expenses", zh: "支出" },
  "transactions.filter.all": { fr: "Toutes", en: "All", zh: "全部" },
  "transactions.filter.in": { fr: "Entrées", en: "Incomes", zh: "收入" },
  "transactions.filter.out": { fr: "Sorties", en: "Expenses", zh: "支出" },
  "transactions.empty.none": {
    fr: "Aucune transaction",
    en: "No transactions",
    zh: "暂无交易",
  },
  "transactions.empty.inSuffix": { fr: "d'entrée", en: "incoming", zh: "收入" },
  "transactions.empty.outSuffix": {
    fr: "de sortie",
    en: "outgoing",
    zh: "支出",
  },

  // Product details page
  "products.detail.title.currentAccount": {
    fr: "Compte Courant",
    en: "Current Account",
    zh: "活期账户",
  },
  "products.detail.subtitle.dailyManagement": {
    fr: "Gestion quotidienne",
    en: "Daily management",
    zh: "日常管理",
  },
  "products.detail.status.available": {
    fr: "Disponible",
    en: "Available",
    zh: "可用",
  },
  "products.detail.section.description": {
    fr: "Description",
    en: "Description",
    zh: "描述",
  },
  "products.detail.description.short": {
    fr: "Gérez vos opérations quotidiennes en toute simplicité.",
    en: "Manage your daily operations with ease.",
    zh: "轻松管理您的日常操作。",
  },
  "products.detail.description.long": {
    fr: "Le compte courant La Pepite vous offre une solution complète pour gérer vos finances au quotidien.",
    en: "La Pepite current account offers a complete solution to manage your daily finances.",
    zh: "La Pepite 活期账户为您提供全面的解决方案来管理日常财务。",
  },
  "products.detail.tab.advantages": {
    fr: "Avantages",
    en: "Benefits",
    zh: "优势",
  },
  "products.detail.tab.conditions": {
    fr: "Conditions",
    en: "Conditions",
    zh: "条件",
  },
  "products.detail.adv.cardIncluded": {
    fr: "Carte bancaire gratuite incluse",
    en: "Free bank card included",
    zh: "包含免费银行卡",
  },
  "products.detail.adv.freeTransfers": {
    fr: "Virements illimités sans frais",
    en: "Unlimited transfers with no fees",
    zh: "无限次免手续费转账",
  },
  "products.detail.adv.monthlyStatements": {
    fr: "Relevés mensuels détaillés",
    en: "Detailed monthly statements",
    zh: "详细月度对账单",
  },
  "products.detail.adv.mobileApp": {
    fr: "Application mobile performante",
    en: "High-performance mobile app",
    zh: "高性能移动应用",
  },
  "products.detail.adv.support": {
    fr: "Service client dédié 7j/7",
    en: "Dedicated customer service 7/7",
    zh: "7天客服支持",
  },
  "products.detail.cond.age18": {
    fr: "Avoir au minimum 18 ans",
    en: "Be at least 18 years old",
    zh: "至少 18 岁",
  },
  "products.detail.cond.idProof": {
    fr: "Justificatif d'identité",
    en: "Proof of identity",
    zh: "身份证明",
  },
  "products.detail.cond.addressProof": {
    fr: "Justificatif de domicile",
    en: "Proof of address",
    zh: "住所证明",
  },
  "products.detail.cta.subscribe": {
    fr: "Souscrire maintenant",
    en: "Subscribe now",
    zh: "立即办理",
  },
  "products.detail.help.contact": {
    fr: "Pour toute question, contactez votre conseiller ou notre service client au +241 XX XX XX XX",
    en: "For any questions, contact your advisor or our customer service at +241 XX XX XX XX",
    zh: "如有疑问，请联系您的顾问或致电客户服务 +241 XX XX XX XX",
  },

  // Transactions titles
  "transactions.title.receivedTransfer": {
    fr: "Virement reçu",
    en: "Transfer received",
    zh: "收到转账",
  },
  "transactions.title.atmWithdrawal": {
    fr: "Retrait ATM",
    en: "ATM withdrawal",
    zh: "ATM取款",
  },
  "transactions.title.billPayment": {
    fr: "Paiement facture",
    en: "Bill payment",
    zh: "账单支付",
  },
  "transactions.title.salary": {
    fr: "Salaire mensuel",
    en: "Monthly salary",
    zh: "月薪",
  },
  "transactions.title.groceryPurchase": {
    fr: "Achat supermarché",
    en: "Grocery purchase",
    zh: "超市购物",
  },
  "transactions.title.transferToSavings": {
    fr: "Transfert vers épargne",
    en: "Transfer to savings",
    zh: "转入储蓄",
  },

  // Products list
  "products.list.currentAccount.title": {
    fr: "Compte Courant",
    en: "Current Account",
    zh: "活期账户",
  },
  "products.list.currentAccount.subtitle": {
    fr: "Gestion quotidienne",
    en: "Daily management",
    zh: "日常管理",
  },
  "products.list.currentAccount.description": {
    fr: "Gérez vos opérations quotidiennes en toute simplicité",
    en: "Manage your daily operations with ease",
    zh: "轻松管理您的日常操作",
  },
  "products.list.currentAccount.feature.cardFree": {
    fr: "Carte bancaire gratuite",
    en: "Free bank card",
    zh: "免费银行卡",
  },
  "products.list.currentAccount.feature.unlimitedTransfers": {
    fr: "Virements illimités",
    en: "Unlimited transfers",
    zh: "无限次转账",
  },
  "products.list.visaPremium.title": {
    fr: "Carte Visa Premium",
    en: "Visa Premium Card",
    zh: "Visa 高级卡",
  },
  "products.list.visaPremium.subtitle": {
    fr: "Paiements sécurisés",
    en: "Secure payments",
    zh: "安全支付",
  },
  "products.list.visaPremium.description": {
    fr: "Payez partout dans le monde en toute sécurité",
    en: "Pay securely worldwide",
    zh: "在全球范围内安全支付",
  },
  "products.list.visaPremium.feature.travelInsurance": {
    fr: "Assurance voyage",
    en: "Travel insurance",
    zh: "旅行保险",
  },
  "products.list.visaPremium.feature.cashback2": {
    fr: "Cashback 2%",
    en: "2% cashback",
    zh: "2% 返现",
  },

  // Transfers (Quick Action)
  "transfer.header.title": {
    fr: "Nouveau virement",
    en: "New transfer",
    zh: "新建转账",
  },
  "transfer.header.subtitle": {
    fr: "Transférez de l'argent rapidement et en toute sécurité",
    en: "Transfer money quickly and securely",
    zh: "快速安全地转账",
  },
  "transfer.section.type": {
    fr: "TYPE DE VIREMENT",
    en: "TRANSFER TYPE",
    zh: "转账类型",
  },
  "transfer.type.internal.title": {
    fr: "Compte à compte interne",
    en: "Internal account to account",
    zh: "内部账户间转账",
  },
  "transfer.type.internal.subtitle": {
    fr: "Entre vos comptes",
    en: "Between your accounts",
    zh: "在您自己的账户之间",
  },
  "transfer.type.external.title": {
    fr: "Compte à compte externe",
    en: "External account to account",
    zh: "外部账户间转账",
  },
  "transfer.type.external.subtitle": {
    fr: "Vers un autre bénéficiaire",
    en: "To another beneficiary",
    zh: "转至其他收款人",
  },
  "transfer.form.internal.title": {
    fr: "Virement interne",
    en: "Internal transfer",
    zh: "内部转账",
  },
  "transfer.form.external.title": {
    fr: "Virement externe",
    en: "External transfer",
    zh: "外部转账",
  },
  "transfer.form.source.label": {
    fr: "Compte source",
    en: "Source account",
    zh: "来源账户",
  },
  "transfer.form.source.placeholder": {
    fr: "Numéro de compte source",
    en: "Source account number",
    zh: "来源账户号码",
  },
  "transfer.form.beneficiary.label.internal": {
    fr: "Compte bénéficiaire",
    en: "Beneficiary account",
    zh: "收款账户",
  },
  "transfer.form.beneficiary.placeholder.internal": {
    fr: "Numéro de compte destinataire",
    en: "Destination account number",
    zh: "收款账户号码",
  },
  "transfer.form.beneficiary.label.external": {
    fr: "Compte destinataire",
    en: "Destination account",
    zh: "目的账户",
  },
  "transfer.form.beneficiary.placeholder.external": {
    fr: "Code client ou IBAN",
    en: "Client code or IBAN",
    zh: "客户代码或IBAN",
  },
  "transfer.form.amount.label": { fr: "Montant", en: "Amount", zh: "金额" },
  "transfer.action.submit": {
    fr: "Effectuer le virement",
    en: "Make the transfer",
    zh: "执行转账",
  },
  "transfer.note.secure": {
    fr: "Vos transactions sont sécurisées et cryptées",
    en: "Your transactions are secure and encrypted",
    zh: "您的交易是安全且加密的",
  },

  // Wallet screen
  "wallet.header.title": { fr: "Wallet", en: "Wallet", zh: "钱包" },
  "wallet.header.subtitle": {
    fr: "Gérez vos transferts entre wallet et compte bancaire",
    en: "Manage transfers between wallet and bank account",
    zh: "管理钱包与银行账户之间的转账",
  },
  "wallet.type.walletToBank.title": {
    fr: "💳 Wallet → Banque",
    en: "💳 Wallet → Bank",
    zh: "💳 钱包 → 银行",
  },
  "wallet.type.walletToBank.subtitle": {
    fr: "Transférer vers compte bancaire",
    en: "Transfer to bank account",
    zh: "转至银行账户",
  },
  "wallet.type.bankToWallet.title": {
    fr: "🏦 Banque → Wallet",
    en: "🏦 Bank → Wallet",
    zh: "🏦 银行 → 钱包",
  },
  "wallet.type.bankToWallet.subtitle": {
    fr: "Recharger votre wallet",
    en: "Top up your wallet",
    zh: "为钱包充值",
  },
  "wallet.form.walletSource.label": {
    fr: "Wallet source",
    en: "Source wallet",
    zh: "来源钱包",
  },
  "wallet.form.walletSource.placeholder": {
    fr: "Numéro Wallet (ex: 077 xx xx xx)",
    en: "Wallet number (e.g., 077 xx xx xx)",
    zh: "钱包号码（如：077 xx xx xx）",
  },
  "wallet.form.walletDest.label": {
    fr: "Wallet destinataire",
    en: "Destination wallet",
    zh: "收款钱包",
  },
  "wallet.form.bankDest.label": {
    fr: "Compte bancaire destinataire",
    en: "Destination bank account",
    zh: "收款银行账户",
  },
  "wallet.form.bankDest.placeholder": {
    fr: "Ex: SGBCI, NSIA, Ecobank",
    en: "e.g., SGBCI, NSIA, Ecobank",
    zh: "例如：SGBCI、NSIA、Ecobank",
  },
  "wallet.form.bankSource.label": {
    fr: "Compte bancaire source",
    en: "Source bank account",
    zh: "来源银行账户",
  },
  "wallet.form.amount.label": { fr: "Montant", en: "Amount", zh: "金额" },
  "common.currency.xaf": { fr: "XAF", en: "XAF", zh: "XAF" },
  "wallet.action.submit": {
    fr: "Effectuer le transfert",
    en: "Make the transfer",
    zh: "执行转账",
  },
  "wallet.note.secure": {
    fr: "Vos transferts sont sécurisés et cryptés",
    en: "Your transfers are secure and encrypted",
    zh: "您的转账是安全且加密的",
  },

  // Cards (Quick Action)
  "cards.header.title": { fr: "Mes cartes", en: "My cards", zh: "我的卡片" },
  "cards.header.subtitle": {
    fr: "2 cartes actives",
    en: "2 active cards",
    zh: "2 张已激活卡",
  },
  "cards.stats.cards": { fr: "Cartes", en: "Cards", zh: "卡片" },
  "cards.stats.totalBalance": {
    fr: "Solde total",
    en: "Total balance",
    zh: "总余额",
  },
  "cards.stats.transactions": {
    fr: "Transactions",
    en: "Transactions",
    zh: "交易",
  },
  "cards.quick.title": {
    fr: "Actions rapides",
    en: "Quick actions",
    zh: "快速操作",
  },
  "cards.quick.block.title": { fr: "Bloquer", en: "Block", zh: "冻结" },
  "cards.quick.block.subtitle": {
    fr: "Carte temporairement",
    en: "Card temporarily",
    zh: "暂时冻结卡片",
  },
  "cards.quick.manage.title": { fr: "Gérer", en: "Manage", zh: "管理" },
  "cards.quick.manage.subtitle": {
    fr: "Limites et paramètres",
    en: "Limits and settings",
    zh: "限额与设置",
  },
  "cards.quick.order.title": { fr: "Commander", en: "Order", zh: "申请" },
  "cards.quick.order.subtitle": {
    fr: "Nouvelle carte",
    en: "New card",
    zh: "新卡",
  },
  "cards.details.title": {
    fr: "Détails de la carte",
    en: "Card details",
    zh: "卡片详情",
  },
  "cards.details.fullNumber": {
    fr: "Numéro complet",
    en: "Full number",
    zh: "完整卡号",
  },
  "cards.details.cvv": { fr: "CVV", en: "CVV", zh: "CVV" },
  "cards.details.expiry": {
    fr: "Date d'expiration",
    en: "Expiration date",
    zh: "到期日期",
  },
  "cards.details.type": { fr: "Type", en: "Type", zh: "类型" },
  "cards.limits.title": {
    fr: "Limites de dépenses",
    en: "Spending limits",
    zh: "支出限额",
  },
  "cards.limits.edit": { fr: "Modifier", en: "Edit", zh: "修改" },
  "cards.limits.dailyPayments": {
    fr: "Paiements quotidiens",
    en: "Daily payments",
    zh: "每日支付",
  },
  "cards.limits.today": { fr: "Aujourd'hui", en: "Today", zh: "今天" },
  "cards.limits.monthlyWithdrawals": {
    fr: "Retraits mensuels",
    en: "Monthly withdrawals",
    zh: "每月取款",
  },
  "cards.limits.thisMonth": { fr: "Ce mois", en: "This month", zh: "本月" },
  "cards.limits.usedSuffix": { fr: "utilisé", en: "used", zh: "已用" },
  "cards.recent.title": {
    fr: "Transactions récentes",
    en: "Recent transactions",
    zh: "最近交易",
  },
  "cards.recent.seeAll": { fr: "Tout voir", en: "See all", zh: "查看全部" },
  "cards.security.message": {
    fr: "Vos cartes sont protégées par la technologie 3D Secure et des alertes en temps réel",
    en: "Your cards are protected by 3D Secure technology and real-time alerts",
    zh: "您的卡片受 3D Secure 技术和实时警报保护",
  },
  "cards.card.status.active": { fr: "Active", en: "Active", zh: "已激活" },
  "cards.card.meta.holderLabel": {
    fr: "TITULAIRE",
    en: "HOLDER",
    zh: "持卡人",
  },
  "cards.card.meta.expiryLabel": { fr: "EXPIRE LE", en: "EXPIRES", zh: "到期" },
  "cards.sheet.title": {
    fr: "Actions sur la carte",
    en: "Card actions",
    zh: "卡片操作",
  },
  "cards.sheet.block.title": {
    fr: "Bloquer la carte",
    en: "Block the card",
    zh: "冻结卡片",
  },
  "cards.sheet.block.subtitle": {
    fr: "Temporairement ou définitivement",
    en: "Temporarily or permanently",
    zh: "暂时或永久",
  },
  "cards.sheet.pin.title": {
    fr: "Modifier le code PIN",
    en: "Change PIN code",
    zh: "更改PIN码",
  },
  "cards.sheet.pin.subtitle": {
    fr: "Changez votre code de sécurité",
    en: "Change your security code",
    zh: "更改您的安全码",
  },
  "cards.sheet.renew.title": { fr: "Renouveler", en: "Renew", zh: "续卡" },
  "cards.sheet.renew.subtitle": {
    fr: "Commander une nouvelle carte",
    en: "Order a new card",
    zh: "申请新卡",
  },

  "cards.modal.info.title": { fr: "INFO", en: "INFO", zh: "信息" },
  "cards.modal.info.body": {
    fr: "FONCTIONNALITE A VENIR",
    en: "FEATURE COMING SOON",
    zh: "功能即将推出",
  },
  "cards.modal.newCard.title": {
    fr: "Nouvelle carte",
    en: "New card",
    zh: "新卡",
  },
  "cards.modal.newCard.body": {
    fr: "Souhaitez-vous demander une nouvelle\ncarte ?",
    en: "Do you want to request a new card?",
    zh: "您想申请一张新卡吗？",
  },
  "common.cancel.upper": { fr: "ANNULER", en: "CANCEL", zh: "取消" },
  "common.confirm.upper": { fr: "CONFIRMER", en: "CONFIRM", zh: "确认" },
  "cards.alert.copy.title": { fr: "Copié", en: "Copied", zh: "已复制" },
  "cards.alert.copy.body": {
    fr: "Copié dans le presse papier",
    en: "Copied to clipboard",
    zh: "已复制到剪贴板",
  },
  "cards.alert.error.title": { fr: "Erreur", en: "Error", zh: "错误" },
  "cards.alert.copy.error": {
    fr: "Impossible de copier le numéro",
    en: "Unable to copy the number",
    zh: "无法复制号码",
  },
  "cards.alert.confirmation.title": {
    fr: "Confirmation",
    en: "Confirmation",
    zh: "确认",
  },
  "cards.alert.newCardSaved": {
    fr: "Votre demande de nouvelle carte a été enregistrée",
    en: "Your new card request has been recorded",
    zh: "您的新卡申请已记录",
  },

  // Common additions
  "common.account": { fr: "Compte", en: "Account", zh: "账户" },
  "common.network": { fr: "Réseau", en: "Network", zh: "网络" },
  "common.phone": { fr: "Téléphone", en: "Phone", zh: "电话" },
  "common.required": { fr: "obligatoire", en: "required", zh: "必填" },
  "common.select": { fr: "Sélectionner", en: "Select", zh: "选择" },
  "common.validate": { fr: "VALIDER", en: "VALIDATE", zh: "验证" },
  "common.verification": { fr: "Vérification", en: "Verification", zh: "验证" },
  "common.fillAllFields": {
    fr: "Veuillez remplir tous les champs",
    en: "Please fill in all fields",
    zh: "请填写所有字段",
  },

  // Placeholders
  "placeholders.selectAccount": {
    fr: "Sélectionnez un compte",
    en: "Select an account",
    zh: "选择账户",
  },
  "placeholders.selectNetwork": {
    fr: "Sélectionnez un réseau",
    en: "Select a network",
    zh: "选择网络",
  },
  "placeholders.selectPhone": {
    fr: "Sélectionnez un téléphone",
    en: "Select a phone",
    zh: "选择电话",
  },
  "placeholders.account": { fr: "Compte", en: "Account", zh: "账户" },
  "placeholders.phone": { fr: "Téléphone", en: "Phone", zh: "电话" },
  "placeholders.minimum": { fr: "Minimum", en: "Minimum", zh: "最低" },

  // Wallet flows
  "wallet.amountReceived": {
    fr: "Montant reçu",
    en: "Amount received",
    zh: "收到金额",
  },
  "wallet.amountSent": {
    fr: "Montant envoyé",
    en: "Amount sent",
    zh: "发送金额",
  },
  "wallet.validationCode": {
    fr: "Code de validation",
    en: "Validation code",
    zh: "验证代码",
  },
  "wallet.transfer": { fr: "TRANSFÉRER", en: "TRANSFER", zh: "转账" },
  "wallet.verifyText": {
    fr: "Veuillez confirmer la transaction en renseignant le code de validation reçu par sms et/ou par Email.",
    en: "Please confirm the transaction by entering the validation code received by SMS and/or Email.",
    zh: "请输入通过短信或邮箱收到的验证码以确认交易。",
  },
  "wallet.feesZero": {
    fr: "Frais = 0 % + 0 FCFA",
    en: "Fees = 0% + 0 FCFA",
    zh: "费用 = 0% + 0 FCFA",
  },

  // Wallet Mobile menu
  "settings.walletMobile": {
    fr: "Mon Wallet Mobile",
    en: "My Mobile Wallet",
    zh: "我的手机钱包",
  },
  "wallet.mobile.subscribe.title": {
    fr: "Souscription",
    en: "Subscription",
    zh: "订阅",
  },
  "wallet.mobile.subscribe.subtitle": {
    fr: "compte mobile",
    en: "mobile account",
    zh: "手机账户",
  },
  "wallet.mobile.unsubscribe.title": {
    fr: "Désouscription",
    en: "Unsubscribe",
    zh: "取消订阅",
  },
  "wallet.mobile.unsubscribe.subtitle": {
    fr: "compte mobile",
    en: "mobile account",
    zh: "手机账户",
  },
  "wallet.mobile.operations.title": {
    fr: "Liste",
    en: "List",
    zh: "列表",
  },
  "wallet.mobile.operations.subtitle": {
    fr: "des opérations mobile",
    en: "mobile operations",
    zh: "手机账户操作",
  },

  // Dates
  "dates.start": { fr: "Date début", en: "Start date", zh: "开始日期" },
  "dates.end": { fr: "Date fin", en: "End date", zh: "结束日期" },
  "wallet.operations.welcome": {
    fr: "Bienvenue, vous pouvez consulter les virements…",
    en: "Welcome, you can view transfers…",
    zh: "欢迎，您可以查看转账…",
  },
  "wallet.mobile.accountTitle": {
    fr: "Compte mobile",
    en: "Mobile account",
    zh: "手机账户",
  },

  "common.country": { fr: "Pays", en: "Country", zh: "国家" },
  "placeholders.country": { fr: "Pays", en: "Country", zh: "国家" },
  "common.location": { fr: "Localisation", en: "Location", zh: "位置" },
  "placeholders.location": { fr: "Localisation", en: "Location", zh: "位置" },

  // Dates (extended)
  "dashboard.date.3days": {
    fr: "Il y a 3 jours",
    en: "3 days ago",
    zh: "三天前",
  },
  // Profile screen
  "profile.loginPrefix": { fr: "Login", en: "Login", zh: "登录" },
  "profile.memberSince": {
    fr: "Membre depuis Octobre 2025",
    en: "Member since October 2025",
    zh: "自 2025 年 10 月起成为会员",
  },
  "profile.section.personalInfo": {
    fr: "Informations personnelles",
    en: "Personal information",
    zh: "个人信息",
  },
  "profile.action.edit": {
    fr: "Modifier le profil",
    en: "Edit profile",
    zh: "编辑资料",
  },
  "profile.section.documents": { fr: "Documents", en: "Documents", zh: "文档" },
  "profile.docs.statements": {
    fr: "Relevés de compte",
    en: "Account statements",
    zh: "账户对账单",
  },
  "profile.docs.history": {
    fr: "Historique des transactions",
    en: "Transactions history",
    zh: "交易历史",
  },
  "profile.docs.downloads": {
    fr: "Téléchargements",
    en: "Downloads",
    zh: "下载",
  },
  "profile.actions.call": { fr: "Appeler", en: "Call", zh: "拨打电话" },
  "profile.actions.email": { fr: "Email", en: "Email", zh: "电子邮件" },
  // Transactions texts used in Profile
  "transactions.history.title": {
    fr: "Historique des transactions",
    en: "Transactions history",
    zh: "交易历史",
  },
  "transactions.filterByDate": {
    fr: "Filtrer par date",
    en: "Filter by date",
    zh: "按日期筛选",
  },
  "transactions.exportPdf": {
    fr: "Exporter PDF",
    en: "Export PDF",
    zh: "导出 PDF",
  },
  "transactions.dateFilter.info": {
    fr: "La sélection de date sera disponible prochainement.",
    en: "Date filter will be available soon.",
    zh: "日期筛选功能即将推出。",
  },
  // Common
  "common.info": { fr: "Informations", en: "Information", zh: "信息" },
  "common.requiredFields": {
    fr: "Les champs sont obligatoires",
    en: "Fields are required",
    zh: "所有字段为必填",
  },

  "common.fetchError": {
    fr: "Erreur de récupération",
    en: "Retrieval error",
    zh: "获取错误",
  },
  "common.networkError": {
    fr: "Erreur réseau",
    en: "Network error",
    zh: "网络错误",
  },
  "common.missingCredentials": {
    fr: "Identifiants manquants",
    en: "Missing credentials",
    zh: "缺少凭据",
  },
  // Profile labels
  "profile.labels.email": { fr: "Email", en: "Email", zh: "邮箱" },
  "profile.labels.phone": { fr: "Téléphone", en: "Phone", zh: "电话" },
  "profile.labels.address": { fr: "Adresse", en: "Address", zh: "地址" },
  // Profile edit modal
  "profile.edit.modal.title": {
    fr: "Modifier le profil",
    en: "Edit profile",
    zh: "编辑资料",
  },
  "profile.edit.modal.note": {
    fr: "Pour modifier vos informations personnelles, veuillez contacter votre agence ou le service client.",
    en: "To update your personal information, please contact your agency or customer support.",
    zh: "如需更新个人信息，请联系您的网点或客服。",
  },
  // Logout
  "logout.title": { fr: "Déconnexion", en: "Logout", zh: "退出登录" },
  "logout.message": {
    fr: "Êtes-vous sûr de vouloir vous déconnecter ?",
    en: "Are you sure you want to log out?",
    zh: "您确定要退出登录吗？",
  },
  "logout.button": { fr: "Se déconnecter", en: "Log out", zh: "退出登录" },
  "logout.guest.title": {
    fr: "Quitter le mode invité",
    en: "Leave guest mode",
    zh: "退出访客模式",
  },
  "logout.guest.message": {
    fr: "Êtes-vous sûr de vouloir quitter le mode invité ? Cela effacera toutes les données temporaires.",
    en: "Are you sure you want to leave guest mode? This will erase all temporary data.",
    zh: "确定退出访客模式吗？这将清除所有临时数据。",
  },
  "logout.guest.confirm": { fr: "Quitter", en: "Leave", zh: "退出" },
  "logout.guest.button": {
    fr: "Quitter le mode invité",
    en: "Leave guest mode",
    zh: "退出访客模式",
  },
  // Settings (ensure presence) — déjà défini plus haut
  // Logout modal
  "logout.modal.title": {
    fr: "Êtes-vous sûr de vouloir vous déconnecter ?",
    en: "Are you sure you want to log out?",
    zh: "您确定要退出登录吗？",
  },
  "logout.modal.erase": {
    fr: "Se déconnecter et effacer",
    en: "Log out and erase",
    zh: "退出并清除",
  },
  // Guest restriction message
  "guest.restrict.message": {
    fr: "Veuillez vous connecter pour accéder à cette fonctionnalité.",
    en: "Please sign in to access this feature.",
    zh: "请登录以使用此功能。",
  },
  // Password change modal
  "password.change.title": {
    fr: "Changer le mot de passe",
    en: "Change password",
    zh: "更改密码",
  },
  "password.current": {
    fr: "Mot de passe actuel",
    en: "Current password",
    zh: "当前密码",
  },
  "password.new": {
    fr: "Nouveau mot de passe",
    en: "New password",
    zh: "新密码",
  },
  "password.confirm": {
    fr: "Confirmer le nouveau mot de passe",
    en: "Confirm new password",
    zh: "确认新密码",
  },
  "password.error.length": {
    fr: "Le mot de passe doit contenir au moins 6 caractères",
    en: "Password must be at least 6 characters",
    zh: "密码至少 6 个字符",
  },
  "password.error.mismatch": {
    fr: "Les mots de passe ne correspondent pas",
    en: "Passwords do not match",
    zh: "两次密码不一致",
  },
  // PIN change modal
  "pin.change.title": {
    fr: "Changer le code PIN",
    en: "Change PIN code",
    zh: "更改PIN码",
  },
  "pin.current": {
    fr: "PIN actuel",
    en: "Current PIN",
    zh: "当前PIN码",
  },
  "pin.new.label": {
    fr: "Nouveau PIN (5 chiffres)",
    en: "New PIN (5 digits)",
    zh: "新 PIN（5 位）",
  },
  "pin.confirm": {
    fr: "Confirmer le nouveau PIN",
    en: "Confirm new PIN",
    zh: "确认新 PIN",
  },
  "pin.error.length": {
    fr: "Le PIN doit contenir 5 chiffres",
    en: "PIN must be 5 digits",
    zh: "PIN 必须为 5 位数字",
  },
  "pin.error.mismatch": {
    fr: "Les PINs ne correspondent pas",
    en: "PINs do not match",
    zh: "两次 PIN 不一致",
  },
};

interface I18nContextValue {
  language: LanguageCode;
  locale: string;
  setLanguage: (code: LanguageCode) => Promise<void> | void;
  t: (key: string) => string;
  tText: (text: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLang] = useState<LanguageCode>("fr");

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(STORAGE_KEY);
        if (saved === "fr" || saved === "en" || saved === "zh") setLang(saved);
      } catch {}
    })();
  }, []);

  const setLanguage = async (code: LanguageCode) => {
    setLang(code);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, code);
    } catch {}
    // expose locale globally pour utilitaires sans contexte
    (global as any).__APP_LOCALE = LOCALE_MAP[code];
  };

  const locale = useMemo(() => LOCALE_MAP[language], [language]);

  const t = (key: string) => {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[language] || entry["fr"];
  };

  // Traduit des chaînes courtes connues (fallback identitaire sinon)
  const tText = (text: string) => {
    const map: Record<string, string> = {
      // headers & sections
      Paramètres: "settings.header",
      COMPTE: "settings.section.account",
      "SERVICES FINANCIERS": "settings.section.finance",
      PRÉFÉRENCES: "settings.section.preferences",
      SÉCURITÉ: "settings.section.security",
      SUPPORT: "settings.section.support",
      APPLICATION: "settings.section.app",
      DÉCONNEXION: "settings.section.logout",

      // items
      "Mon Profil": "settings.profile",
      "Changer le code PIN": "settings.pin",
      "Changer le mot de passe": "settings.password",
      "Mon Wallet": "settings.wallet",
      "Mon Wallet Mobile": "settings.walletMobile",
      "Gérer mes comptes": "settings.accounts",
      "Mes bénéficiaires": "settings.beneficiaries",
      "Mes produits": "settings.products",
      Notifications: "settings.notifications",
      Langue: "settings.language",
      "Mode sombre": "settings.darkMode",
      "Authentification biométrique": "settings.biometric",
      Confidentialité: "settings.privacy",
      "Service client": "settings.support.client",
      "Chat en ligne": "settings.support.chat",
      "Envoyer un email": "settings.support.email",
      "Centre d'aide / FAQ": "settings.support.help",
      "Signaler un problème": "settings.support.report",
      "À propos": "settings.app.about",
      "Conditions d'utilisation": "settings.app.terms",
      "Politique de confidentialité": "settings.app.policy",
      "Évaluer l'application": "settings.app.rate",
      "Partager l'application": "settings.app.share",
      "Se déconnecter": "settings.logout",

      // navigator titles
      "Mes Comptes": "accounts.list",
      "Détails du compte": "accounts.details",
      "Mes Cartes": "cards.list",
      "Détail du produit": "products.detail",
      // bottom tabs
      Dashboard: "tabs.dashboard",
      Transactions: "tabs.transactions",
      Products: "tabs.products",
      Settings: "tabs.settings",

      // dashboard common
      "Mon QR Code": "dashboard.qr.title",
      Nom: "dashboard.qr.name",
      "Code client": "dashboard.qr.clientCode",
      Téléphone: "dashboard.qr.phone",
      "Bonjour 👋": "dashboard.greeting",
      "Compte Premium": "dashboard.accountType.premium",
      "Solde total disponible": "dashboard.balance.label",
      "Actions rapides": "dashboard.actions.quick",
      Comptes: "dashboard.actions.accounts",
      Cartes: "dashboard.actions.cards",
      "Offres spéciales": "dashboard.offers.title",
      "Nos services": "dashboard.services.title",
      "Activité récente": "dashboard.recent.title",
      "Tout voir": "dashboard.recent.seeAll",

      // offers/services/tx
      Nouveau: "dashboard.offer.badge.new",
      Limitée: "dashboard.offer.badge.limited",
      "Crédit Express": "dashboard.offer.creditExpress",
      "Obtenez jusqu'à 5M FCFA": "dashboard.offer.creditExpress.subtitle",
      "Taux préférentiel 4.5%": "dashboard.offer.creditExpress.desc",
      "Épargne Plus": "dashboard.offer.savingsPlus",
      "Rendement garanti 6%": "dashboard.offer.savingsPlus.subtitle",
      "Capital 100% sécurisé": "dashboard.offer.savingsPlus.desc",
      "Paiement factures": "dashboard.service.billPay",
      "Eau, électricité": "dashboard.service.billPay.subtitle",
      Recharge: "dashboard.service.recharge",
      "Tous opérateurs": "dashboard.service.recharge.subtitle",
      Assurance: "dashboard.service.insurance",
      "Protection complète": "dashboard.service.insurance.subtitle",
      "Prêt rapide": "dashboard.service.creditExpress.subtitle",
      "Virement reçu": "dashboard.tx.received",
      "Retrait ATM": "dashboard.tx.atm",
      "Paiement facture": "dashboard.tx.bill",
      "Aujourd'hui": "dashboard.date.today",
      Hier: "dashboard.date.yesterday",
      "Il y a 2 jours": "dashboard.date.2days",
      // éviter doublons: mappe unique pour Virement
      Virement: "transactions.transfer",
      // accounts types
      "Compte Chèque": "accounts.type.checking",
      "Compte Épargne": "accounts.type.savings",
      "Compte Courant": "accounts.type.current",
    };
    const key = map[text];
    return key ? t(key) : text;
  };

  const value: I18nContextValue = { language, locale, setLanguage, t, tText };

  // initialiser global locale
  (global as any).__APP_LOCALE = locale;

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};

export const getLocale = (): string => {
  const g = (global as any).__APP_LOCALE;
  return typeof g === "string" ? g : "fr-FR";
};
