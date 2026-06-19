import React, { Suspense, lazy } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  createStackNavigator,
  type StackNavigationOptions,
} from '@react-navigation/stack';
import { colors, typography } from '../theme';
import type { RootStackParamList } from './types';

/** Re-export so older imports from `RootStack` keep working. */
export type { RootStackParamList };

const MainShellScreen = lazy(() =>
  import('./MainShell').then((m) => ({ default: m.MainShell })),
);
const PostAdScreen = lazy(() => import('../screens/PostAdScreen'));
const AuthScreen = lazy(() => import('../screens/AuthScreen'));
const ProductDetailScreen = lazy(() => import('../screens/ProductDetailScreen'));
const SellerProfileScreen = lazy(() => import('../screens/SellerProfileScreen'));
const CheckoutScreen = lazy(() => import('../screens/CheckoutScreen'));
const ChatScreen = lazy(() => import('../screens/ChatScreen'));
const OrdersScreen = lazy(() => import('../screens/OrdersScreen'));
const SellerDashboardScreen = lazy(() => import('../screens/SellerDashboardScreen'));
const SellerOrderDetailScreen = lazy(() => import('../screens/SellerOrderDetailScreen'));
const AdminDashboardScreen = lazy(() => import('../screens/AdminDashboardScreen'));

const Stack = createStackNavigator<RootStackParamList>();

const screenOptions: StackNavigationOptions = {
  headerStyle: {
    backgroundColor: colors.surfaceElevated,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTintColor: colors.secondary,
  headerTitleStyle: {
    ...typography.title,
    color: colors.text,
    fontWeight: '800',
  },
  headerBackTitle: '',
  cardStyle: { backgroundColor: colors.bg },
};

const suspenseStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
});

export function RootStack() {
  return (
    <Suspense
      fallback={
        <View style={suspenseStyles.root}>
          <ActivityIndicator color={colors.secondary} size="large" />
        </View>
      }
    >
      <Stack.Navigator initialRouteName="Main" screenOptions={screenOptions}>
        <Stack.Screen
          name="Main"
          component={MainShellScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PostAd"
          component={PostAdScreen}
          options={{ title: 'New ad' }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            title: 'Account',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SellerProfile"
          component={SellerProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Checkout"
          component={CheckoutScreen}
          options={{ title: 'Checkout' }}
        />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Messages' }} />
        <Stack.Screen
          name="Orders"
          component={OrdersScreen}
          options={{ title: 'My Orders' }}
        />
        <Stack.Screen
          name="SellerDashboard"
          component={SellerDashboardScreen}
          options={{ title: 'Seller' }}
        />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboardScreen}
          options={{ title: 'Admin' }}
        />
        <Stack.Screen
          name="SellerOrderDetail"
          component={SellerOrderDetailScreen}
          options={{ title: 'Order details' }}
        />
      </Stack.Navigator>
    </Suspense>
  );
}
