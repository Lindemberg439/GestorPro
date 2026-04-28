import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ArrowLeftRight, 
  Box, 
  BarChart3, 
  PlusCircle, 
  MinusCircle, 
  Search, 
  Bell, 
  ChevronRight, 
  History, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  FileText,
  Package,
  Calendar,
  Lock,
  Unlock,
  Trash2,
  Edit,
  User,
  Lightbulb,
  Zap
} from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  expiryDate?: string;
  category: string;
  status: 'normal' | 'low-stock' | 'expiring-soon';
}

export interface Transaction {
  id: string;
  type: 'sale' | 'purchase' | 'adjustment' | 'input' | 'output';
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  items?: { id: string; name: string; quantity: number; price: number; }[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastVisit: string;
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'caixa', label: 'PDV', icon: ShoppingBag },
  { id: 'vendas', label: 'Vendas', icon: History },
  { id: 'estoque', label: 'Estoque', icon: Box },
  { id: 'clientes', label: 'Clientes', icon: User },
  { id: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { id: 'config', label: 'Ajustes', icon: Zap },
];
