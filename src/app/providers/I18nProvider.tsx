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
  "common.cancel": { fr: "Annuler", en: "Cancel", zh: "取消" },
  "common.ok": { fr: "OK", en: "OK", zh: "确定" },
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

  // Dates (extended)
  "dashboard.date.3days": {
    fr: "Il y a 3 jours",
    en: "3 days ago",
    zh: "三天前",
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
