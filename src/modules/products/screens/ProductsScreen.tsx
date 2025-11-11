import React, { useState } from 'react';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '../../../app/providers/I18nProvider';

// Définir les types pour la navigation
type RootStackParamList = {
  ProductsScreen: undefined;
  DetailsProduits: undefined;
};

type CategoryType = 'tous' | 'comptes' | 'epargne' | 'credit' | 'services';

interface Category {
  id: CategoryType;
  label: string;
}

interface Product {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  category: CategoryType;
  status: string;
  icon: string;
}

export const ProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { t, tText } = useI18n();

  const [activeCategory, setActiveCategory] = useState<CategoryType>('comptes');

  const categories: Category[] = [
    { id: 'tous', label: t('products.category.all') },
    { id: 'comptes', label: t('products.category.accounts') },
    { id: 'epargne', label: t('products.category.savings') },
    { id: 'credit', label: t('products.category.credit') },
    { id: 'services', label: t('products.category.services') },
  ];

  const products: Product[] = [
    {
      id: '1',
      title: t('products.list.currentAccount.title'),
      subtitle: t('products.list.currentAccount.subtitle'),
      description: t('products.list.currentAccount.description'),
      features: [
        t('products.list.currentAccount.feature.cardFree'),
        t('products.list.currentAccount.feature.unlimitedTransfers'),
      ],
      category: 'comptes',
      status: t('products.status.active'),
      icon: 'card-outline'
    },
    {
      id: '2',
      title: t('products.list.visaPremium.title'),
      subtitle: t('products.list.visaPremium.subtitle'),
      description: t('products.list.visaPremium.description'),
      features: [
        t('products.list.visaPremium.feature.travelInsurance'),
        t('products.list.visaPremium.feature.cashback2'),
      ],
      category: 'comptes',
      status: t('products.status.active'),
      icon: 'card-outline'
    }
  ];

  const filteredProducts = products.filter(product =>
    activeCategory === 'tous' || product.category === activeCategory
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{t('products.header.title')}</Text>
          <Text style={styles.headerSubtitle}>{products.length} {t('products.header.available')}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Statistiques avec Cartes et Icônes */}
        <View style={styles.statsSection}>
          <View style={styles.statsCardsContainer}>
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, styles.iconActive]}>
                <Ionicons name="checkmark-circle" size={24} color="#27ae60" />
              </View>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>{t('products.stats.active')}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, styles.iconPending]}>
                <Ionicons name="time-outline" size={24} color="#f39c12" />
              </View>
              <Text style={styles.statNumber}>1</Text>
              <Text style={styles.statLabel}>{t('products.stats.pending')}</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.iconContainer, styles.iconTotal]}>
                <Ionicons name="grid-outline" size={24} color="#0066CC" />
              </View>
              <Text style={styles.statNumber}>{products.length}</Text>
              <Text style={styles.statLabel}>{t('products.stats.total')}</Text>
            </View>
          </View>
        </View>

        {/* Catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setActiveCategory(category.id)}
            >
              {activeCategory === category.id && (
                <Ionicons name="checkmark" size={16} color="#fff" style={styles.categoryIcon} />
              )}
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.categoryTextActive
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Liste des produits */}
        <View style={styles.productsList}>
          {filteredProducts.map((product) => (
            <View key={product.id} style={styles.productCard}>
              {/* Header avec icône et badge */}
              <View style={styles.productHeader}>
                <View style={styles.productIconWrapper}>
                  <Ionicons name={product.icon as any} size={28} color="#0066CC" />
                </View>
                <View style={styles.productBadge}>
                  <View style={styles.badgeDot} />
                  <Text style={styles.productBadgeText}>{product.status === 'Actif' ? t('products.status.active') : tText(product.status)}</Text>
                </View>
              </View>

              {/* Contenu du produit */}
              <View style={styles.productContent}>
                <Text style={styles.productTitle}>{tText(product.title)}</Text>
                <Text style={styles.productSubtitle}>{tText(product.subtitle)}</Text>
                <Text style={styles.productDescription}>{tText(product.description)}</Text>

                <View style={styles.featuresList}>
                  {product.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <View style={styles.checkbox}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                      <Text style={styles.featureText}>{tText(feature)}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => navigation.navigate("DetailsProduits")}
                >
                  <Text style={styles.detailsButtonText}>{t('products.action.details')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#0066CC" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#000', marginBottom: 2 },
  headerSubtitle: { fontSize: 13, color: '#999', fontWeight: '400' },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  statsSection: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 20 },
  statsCardsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FAFAFA', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E8E8E8' },
  iconContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  iconActive: { backgroundColor: '#E8F5E8' },
  iconPending: { backgroundColor: '#FFF3E0' },
  iconTotal: { backgroundColor: '#E6F2FF' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  statLabel: { fontSize: 13, color: '#666', fontWeight: '500' },
  categoriesContainer: { paddingLeft: 20, marginVertical: 20 },
  categoriesContent: { paddingRight: 20 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  categoryButtonActive: { backgroundColor: '#0066CC', borderColor: '#0066CC' },
  categoryIcon: { marginRight: 6 },
  categoryText: { fontSize: 14, color: '#666', fontWeight: '500' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  productsList: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  productCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  productIconWrapper: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#E6F2FF', justifyContent: 'center', alignItems: 'center' },
  productBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#E8F5E8' },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#27ae60', marginRight: 6 },
  productBadgeText: { fontSize: 12, fontWeight: '600', color: '#27ae60' },
  productContent: { gap: 8 },
  productTitle: { fontSize: 18, fontWeight: 'bold', color: '#000' },
  productSubtitle: { fontSize: 14, color: '#0066CC', fontWeight: '500' },
  productDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 },
  featuresList: { marginBottom: 12, gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 20, height: 20, borderRadius: 4, backgroundColor: '#0066CC', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  featureText: { fontSize: 14, color: '#333', fontWeight: '400' },
  detailsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  detailsButtonText: { fontSize: 14, color: '#0066CC', fontWeight: '600' },
});
