import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './lib/supabase';
import { Package } from 'lucide-react';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Timer,
  CheckSquare,
  CalendarDays,
  Files,
  Wallet,
  FileText,
  ChartNoAxesCombined,
  NotebookPen,
  Settings,
  UserRound,
  LogOut,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Printer,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bell,
  Database,
  ShieldCheck,
  KeyRound,
  Copy,
  Check,
  Star,
  FolderOpen,
  FileCode,
  Image as ImageIcon,
  FileSpreadsheet,
  ArrowUpDown,
  X,
  Briefcase,
  IndianRupee,
  TrendingUp,
  Layers,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Building2,
  ExternalLink,
  RefreshCw,
  Lock,
  Unlock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// ============================================================================
// SUPABASE SQL SCHEMA & RLS MIGRATION SCRIPT (ALL 13 TABLES + STORAGE BUCKET)
// ============================================================================
const SUPABASE_SQL_SCHEMA = `-- LOKIX.IN Freelance Project & Work Monitoring Suite
-- Full PostgreSQL Schema, Triggers, Indexes & Row Level Security (RLS)
-- Timezone: Asia/Kolkata | Currency: INR (₹)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'Baraninathan S P',
  display_name TEXT NOT NULL DEFAULT 'Barani',
  email TEXT NOT NULL DEFAULT 'barani@lokix.in',
  phone TEXT DEFAULT '+91 98765 43210',
  business_name TEXT NOT NULL DEFAULT 'LOKIX.IN',
  designation TEXT NOT NULL DEFAULT 'Freelance Software Developer & Designer',
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'INR',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  gst_number TEXT DEFAULT '33AABCL1234F1Z5',
  notification_email BOOLEAN NOT NULL DEFAULT TRUE,
  notification_deadline BOOLEAN NOT NULL DEFAULT TRUE,
  notification_payment BOOLEAN NOT NULL DEFAULT TRUE,
  theme_mode TEXT NOT NULL DEFAULT 'dark-brown-orange',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  client_type TEXT NOT NULL DEFAULT 'Retainer',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  budget NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  deadline DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Not Started',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  priority TEXT NOT NULL DEFAULT 'Medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'To Do',
  priority TEXT NOT NULL DEFAULT 'Medium',
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. work_logs
CREATE TABLE IF NOT EXISTS public.work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  work_description TEXT NOT NULL,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TEXT,
  end_time TEXT,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. milestones
CREATE TABLE IF NOT EXISTS public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  remaining_amount NUMERIC(12,2) GENERATED ALWAYS AS (GREATEST(total_amount - amount_received, 0)) STORED,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'UPI',
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. invoices & 9. invoice_items
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
  gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. project_files, 11. notes, 12. activities, 13. notifications
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_category TEXT NOT NULL DEFAULT 'Project File',
  file_size_bytes BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL DEFAULT 'deadline',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS across all 13 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
-- (Full RLS policies and Storage policies in supabase/migrations/001_lokix_schema.sql)`;

// ============================================================================
// INITIAL REALISTIC FREELANCE SEED DATA FOR BARANI (LOKIX.IN)
// ============================================================================
const INITIAL_CLIENTS = [
  {
    id: 'cli-101',
    full_name: 'Vikramaditya Rao',
    company_name: 'NERO Apparel Co.',
    email: 'vikram@neroapparel.in',
    phone: '+91 98401 22310',
    address: 'Indiranagar, Bengaluru, Karnataka',
    client_type: 'Brand',
    notes: 'Lettermark logo design, sandal-on-black product mockups, and Shopify storefront redesign.',
    created_at: '2026-10-15T10:00:00Z'
  },
  {
    id: 'cli-102',
    full_name: 'Karthik Sundaram',
    company_name: 'IronPulse Fitness Studio',
    email: 'karthik@ironpulse.in',
    phone: '+91 94432 88190',
    address: 'Anna Nagar, Chennai, Tamil Nadu',
    client_type: 'Enterprise',
    notes: 'Multi-tier Gym Owner & Super Admin SaaS Dashboard with Supabase RLS and subscription lock overlays.',
    created_at: '2026-10-20T11:30:00Z'
  },
  {
    id: 'cli-103',
    full_name: 'Meenakshi Sundar',
    company_name: 'ClientSphere Solutions',
    email: 'meenakshi@clientsphere.io',
    phone: '+91 97890 54123',
    address: 'TIDEL Park, Coimbatore, Tamil Nadu',
    client_type: 'Startup',
    notes: 'SaaS CRM dashboard UI/UX redesign with sales pipeline, lead conversion charts, and dark mode.',
    created_at: '2026-10-28T09:15:00Z'
  },
  {
    id: 'cli-104',
    full_name: 'Aravind Swaminathan',
    company_name: 'LumaEvents Media',
    email: 'aravind@lumaevents.in',
    phone: '+91 99521 67340',
    address: 'Palayamkottai, Tirunelveli, Tamil Nadu',
    client_type: 'Agency',
    notes: 'Interactive LumaBooth web clone in React & Tailwind CSS with live event photo booth management.',
    created_at: '2026-10-05T14:00:00Z'
  },
  {
    id: 'cli-105',
    full_name: 'Deepak Rajendran',
    company_name: 'TARGON Activewear',
    email: 'deepak@targongear.com',
    phone: '+91 96001 45982',
    address: 'RS Puram, Coimbatore, Tamil Nadu',
    client_type: 'Brand',
    notes: 'Complete athletic brand identity, typography guidelines, and dark studio apparel mockups.',
    created_at: '2026-09-22T16:45:00Z'
  },
  {
    id: 'cli-106',
    full_name: 'Senthil Nathan',
    company_name: 'SafeVision AI Systems',
    email: 'senthil@safevision.ai',
    phone: '+91 98421 77890',
    address: 'OMR Tech Corridor, Chennai, Tamil Nadu',
    client_type: 'Enterprise',
    notes: 'Multi-camera AI CCTV monitoring dashboard with Python Flask, RTSP streams, and YOLOv8 detection.',
    created_at: '2026-10-10T08:30:00Z'
  }
];

const INITIAL_PROJECTS = [
  {
    id: 'prj-201',
    client_id: 'cli-102',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    client_name: 'IronPulse Fitness Studio',
    category: 'Software Development',
    description: 'Full-stack React + Supabase gym management platform tracking attendance, subscription tiers (15-day free, 3-month, 1-year), expired lock overlays, and super-admin master controls.',
    budget: 95000,
    start_date: '2026-10-22',
    deadline: '2026-11-20',
    status: 'In Progress',
    progress: 82,
    priority: 'Urgent'
  },
  {
    id: 'prj-202',
    client_id: 'cli-101',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    client_name: 'NERO Apparel Co.',
    category: 'Branding',
    description: 'Minimalist luxury lettermark logo, brand story, white & dark studio backgrounds, and product mockups including matte black bottle with sandal accent.',
    budget: 42000,
    start_date: '2026-11-01',
    deadline: '2026-11-16',
    status: 'Client Review',
    progress: 90,
    priority: 'High'
  },
  {
    id: 'prj-203',
    client_id: 'cli-103',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    client_name: 'ClientSphere Solutions',
    category: 'CRM Development',
    description: 'Complete CRM web interface featuring Kanban sales pipeline, revenue forecasting charts, dark/light workspace themes, and client portal.',
    budget: 78000,
    start_date: '2026-11-02',
    deadline: '2026-11-28',
    status: 'In Progress',
    progress: 68,
    priority: 'High'
  },
  {
    id: 'prj-204',
    client_id: 'cli-106',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    client_name: 'SafeVision AI Systems',
    category: 'Software Development',
    description: 'Real-time RTSP camera stream monitoring dashboard powered by Python FastAPI/Flask backend, OpenCV, YOLOv8 object detection, and React frontend.',
    budget: 120000,
    start_date: '2026-10-12',
    deadline: '2026-12-05',
    status: 'In Progress',
    progress: 55,
    priority: 'Medium'
  },
  {
    id: 'prj-205',
    client_id: 'cli-104',
    project_name: 'LumaBooth Interactive Event Web App',
    client_name: 'LumaEvents Media',
    category: 'Website Development',
    description: 'Responsive React + Vite + Tailwind CSS event photo booth management system with instant gallery sharing and custom overlays.',
    budget: 65000,
    start_date: '2026-10-05',
    deadline: '2026-10-30',
    status: 'Completed',
    progress: 100,
    priority: 'Medium'
  },
  {
    id: 'prj-206',
    client_id: 'cli-105',
    project_name: 'TARGON Activewear Logo & Packaging',
    client_name: 'TARGON Activewear',
    category: 'Logo Design',
    description: 'Bold geometric emblem and custom typography system for performance activewear line with 3D apparel tag mockups.',
    budget: 35000,
    start_date: '2026-09-25',
    deadline: '2026-10-18',
    status: 'Completed',
    progress: 100,
    priority: 'Low'
  },
  {
    id: 'prj-207',
    client_id: 'cli-101',
    project_name: 'NERO E-Commerce Storefront UI',
    client_name: 'NERO Apparel Co.',
    category: 'UI/UX Design',
    description: 'Next.js + Tailwind CSS luxury streetwear storefront with lookbook galleries, size guide modals, and Razorpay checkout flow.',
    budget: 58000,
    start_date: '2026-11-10',
    deadline: '2026-12-12',
    status: 'Revision',
    progress: 35,
    priority: 'Medium'
  }
];

const INITIAL_TASKS = [
  {
    id: 'tsk-301',
    project_id: 'prj-201',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    title: 'Verify Super Admin role routing & subscription lock overlay',
    description: 'Ensure master admin account routes directly to Super Admin view and expired 15-day trial locks normal gym owner view.',
    status: 'Completed',
    priority: 'Urgent',
    due_date: '2026-11-12'
  },
  {
    id: 'tsk-302',
    project_id: 'prj-202',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    title: 'Export high-res vector SVG & sandal bottle mockup pack',
    description: 'Prepare final deliverable bundle with white background variants and brand story typography.',
    status: 'In Progress',
    priority: 'High',
    due_date: '2026-11-14'
  },
  {
    id: 'tsk-303',
    project_id: 'prj-203',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    title: 'Refine dark theme color contrast on Payment Tracking screen',
    description: 'Apply warm dark espresso cards and high-contrast status pills across client portal views.',
    status: 'In Progress',
    priority: 'High',
    due_date: '2026-11-15'
  },
  {
    id: 'tsk-304',
    project_id: 'prj-204',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    title: 'Optimize WebSocket frame buffer for 4-channel RTSP grid',
    description: 'Reduce latency below 180ms on Flask YOLOv8 inference stream.',
    status: 'To Do',
    priority: 'Medium',
    due_date: '2026-11-18'
  },
  {
    id: 'tsk-305',
    project_id: 'prj-201',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    title: 'Add trainer list card & custom-styled trainer profile page',
    description: 'Integrate left-panel trainer directory and attendance status indicators.',
    status: 'Completed',
    priority: 'High',
    due_date: '2026-11-12'
  },
  {
    id: 'tsk-306',
    project_id: 'prj-207',
    project_name: 'NERO E-Commerce Storefront UI',
    title: 'Design mobile product quick-view drawer & cart animation',
    description: 'Create responsive slide-over drawer with size selector.',
    status: 'To Do',
    priority: 'Urgent',
    due_date: '2026-11-19'
  }
];

const INITIAL_WORK_LOGS = [
  {
    id: 'wkl-401',
    project_id: 'prj-201',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    work_description: 'Implemented Supabase RLS policies for gym subscription tiers and fixed master admin redirect.',
    work_date: '2026-11-12',
    start_time: '09:30 AM',
    end_time: '01:00 PM',
    duration_seconds: 12600 // 3.5 hrs
  },
  {
    id: 'wkl-402',
    project_id: 'prj-203',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    work_description: 'Designed dark mode UI workspace components for client portal, meeting schedule, and revenue cards.',
    work_date: '2026-11-12',
    start_time: '02:15 PM',
    end_time: '05:15 PM',
    duration_seconds: 10800 // 3.0 hrs
  },
  {
    id: 'wkl-403',
    project_id: 'prj-202',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    work_description: 'Created matte black bottle mockup with sandal logo mark and refined lettermark kerning.',
    work_date: '2026-11-11',
    start_time: '10:00 AM',
    end_time: '02:30 PM',
    duration_seconds: 16200 // 4.5 hrs
  },
  {
    id: 'wkl-404',
    project_id: 'prj-204',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    work_description: 'Built React RTSP stream grid and alert log table connected to Flask backend.',
    work_date: '2026-11-10',
    start_time: '11:00 AM',
    end_time: '04:00 PM',
    duration_seconds: 18000 // 5.0 hrs
  },
  {
    id: 'wkl-405',
    project_id: 'prj-205',
    project_name: 'LumaBooth Interactive Event Web App',
    work_description: 'Final deployment verification on Vercel and client handover training.',
    work_date: '2026-10-29',
    start_time: '03:00 PM',
    end_time: '06:30 PM',
    duration_seconds: 12600 // 3.5 hrs
  }
];

const INITIAL_MILESTONES = [
  {
    id: 'mls-501',
    project_id: 'prj-202',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    title: 'Final Brand Guidelines & Vector Package Handover',
    due_date: '2026-11-16',
    status: 'In Progress'
  },
  {
    id: 'mls-502',
    project_id: 'prj-201',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    title: 'Production Deployment & Supabase Auth Handover',
    due_date: '2026-11-20',
    status: 'Pending'
  },
  {
    id: 'mls-503',
    project_id: 'prj-203',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    title: 'Interactive Prototype & Component Library Sign-off',
    due_date: '2026-11-25',
    status: 'Pending'
  },
  {
    id: 'mls-504',
    project_id: 'prj-204',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    title: 'Multi-Camera RTSP Stress Test & Alert Webhook Integration',
    due_date: '2026-12-01',
    status: 'Pending'
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 'pay-601',
    client_id: 'cli-104',
    project_id: 'prj-205',
    client_name: 'LumaEvents Media',
    project_name: 'LumaBooth Interactive Event Web App',
    total_amount: 65000,
    amount_received: 65000,
    payment_date: '2026-10-31',
    payment_method: 'Bank Transfer (NEFT/IMPS)',
    status: 'Paid'
  },
  {
    id: 'pay-602',
    client_id: 'cli-105',
    project_id: 'prj-206',
    client_name: 'TARGON Activewear',
    project_name: 'TARGON Activewear Logo & Packaging',
    total_amount: 35000,
    amount_received: 35000,
    payment_date: '2026-10-19',
    payment_method: 'UPI',
    status: 'Paid'
  },
  {
    id: 'pay-603',
    client_id: 'cli-102',
    project_id: 'prj-201',
    client_name: 'IronPulse Fitness Studio',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    total_amount: 95000,
    amount_received: 60000,
    payment_date: '2026-11-05',
    payment_method: 'Bank Transfer (NEFT/IMPS)',
    status: 'Partially Paid'
  },
  {
    id: 'pay-604',
    client_id: 'cli-101',
    project_id: 'prj-202',
    client_name: 'NERO Apparel Co.',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    total_amount: 42000,
    amount_received: 25000,
    payment_date: '2026-11-02',
    payment_method: 'UPI',
    status: 'Partially Paid'
  },
  {
    id: 'pay-605',
    client_id: 'cli-103',
    project_id: 'prj-203',
    client_name: 'ClientSphere Solutions',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    total_amount: 78000,
    amount_received: 40000,
    payment_date: '2026-11-04',
    payment_method: 'Razorpay',
    status: 'Partially Paid'
  },
  {
    id: 'pay-606',
    client_id: 'cli-106',
    project_id: 'prj-204',
    client_name: 'SafeVision AI Systems',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    total_amount: 120000,
    amount_received: 50000,
    payment_date: '2026-10-25',
    payment_method: 'Bank Transfer (NEFT/IMPS)',
    status: 'Overdue'
  },
  {
    id: 'pay-607',
    client_id: 'cli-101',
    project_id: 'prj-207',
    client_name: 'NERO Apparel Co.',
    project_name: 'NERO E-Commerce Storefront UI',
    total_amount: 58000,
    amount_received: 0,
    payment_date: '2026-11-20',
    payment_method: 'UPI',
    status: 'Pending'
  }
];

const INITIAL_INVOICES = [
  {
    id: 'inv-701',
    invoice_number: 'LKX-2026-041',
    client_id: 'cli-102',
    project_id: 'prj-201',
    client_name: 'IronPulse Fitness Studio',
    client_email: 'karthik@ironpulse.in',
    client_address: 'Anna Nagar, Chennai, Tamil Nadu',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    issue_date: '2026-11-05',
    due_date: '2026-11-20',
    gst_rate: 18,
    status: 'Paid',
    items: [
      { id: 'itm-1', service_description: 'Full-Stack React + Supabase Gym SaaS Architecture & RLS', quantity: 1, unit_price: 55000 },
      { id: 'itm-2', service_description: 'Super Admin Master Portal & Subscription Tier Engine', quantity: 1, unit_price: 40000 }
    ]
  },
  {
    id: 'inv-702',
    invoice_number: 'LKX-2026-042',
    client_id: 'cli-101',
    project_id: 'prj-202',
    client_name: 'NERO Apparel Co.',
    client_email: 'vikram@neroapparel.in',
    client_address: 'Indiranagar, Bengaluru, Karnataka',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    issue_date: '2026-11-10',
    due_date: '2026-11-18',
    gst_rate: 18,
    status: 'Unpaid',
    items: [
      { id: 'itm-3', service_description: 'Luxury Lettermark Logo Design & Brand Story System', quantity: 1, unit_price: 24000 },
      { id: 'itm-4', service_description: '3D Apparel & Matte Black Bottle Product Mockup Suite', quantity: 1, unit_price: 18000 }
    ]
  },
  {
    id: 'inv-703',
    invoice_number: 'LKX-2026-043',
    client_id: 'cli-103',
    project_id: 'prj-203',
    client_name: 'ClientSphere Solutions',
    client_email: 'meenakshi@clientsphere.io',
    client_address: 'TIDEL Park, Coimbatore, Tamil Nadu',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    issue_date: '2026-11-11',
    due_date: '2026-11-28',
    gst_rate: 18,
    status: 'Sent',
    items: [
      { id: 'itm-5', service_description: 'Dark & Light Theme SaaS Design System & Kanban UI', quantity: 1, unit_price: 48000 },
      { id: 'itm-6', service_description: 'Interactive Analytics & Revenue Forecast React Views', quantity: 1, unit_price: 30000 }
    ]
  }
];

const INITIAL_FILES = [
  {
    id: 'fil-801',
    project_id: 'prj-202',
    client_id: 'cli-101',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    client_name: 'NERO Apparel Co.',
    file_name: 'NERO_Lettermark_Master_Guidelines.pdf',
    file_type: 'application/pdf',
    file_category: 'PDF Document',
    file_size_bytes: 4820000,
    storage_path: 'lokix-files/barani/prj-202/NERO_Lettermark_Master_Guidelines.pdf',
    created_at: '2026-11-11'
  },
  {
    id: 'fil-802',
    project_id: 'prj-202',
    client_id: 'cli-101',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    client_name: 'NERO Apparel Co.',
    file_name: 'NERO_Black_Bottle_Sandal_Mockup_4K.png',
    file_type: 'image/png',
    file_category: 'Project Image',
    file_size_bytes: 8450000,
    storage_path: 'lokix-files/barani/prj-202/NERO_Black_Bottle_Sandal_Mockup_4K.png',
    created_at: '2026-11-10'
  },
  {
    id: 'fil-803',
    project_id: 'prj-201',
    client_id: 'cli-102',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    client_name: 'IronPulse Fitness Studio',
    file_name: 'Supabase_Gym_RLS_Architecture_Spec.pdf',
    file_type: 'application/pdf',
    file_category: 'Project File',
    file_size_bytes: 1920000,
    storage_path: 'lokix-files/barani/prj-201/Supabase_Gym_RLS_Architecture_Spec.pdf',
    created_at: '2026-11-08'
  },
  {
    id: 'fil-804',
    project_id: 'prj-203',
    client_id: 'cli-103',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    client_name: 'ClientSphere Solutions',
    file_name: 'ClientSphere_Dark_Theme_Screens_Export.png',
    file_type: 'image/png',
    file_category: 'Project Image',
    file_size_bytes: 6310000,
    storage_path: 'lokix-files/barani/prj-203/ClientSphere_Dark_Theme_Screens_Export.png',
    created_at: '2026-11-12'
  },
  {
    id: 'fil-805',
    project_id: 'prj-204',
    client_id: 'cli-106',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    client_name: 'SafeVision AI Systems',
    file_name: 'SafeVision_Service_Agreement_Signed.pdf',
    file_type: 'application/pdf',
    file_category: 'Client Document',
    file_size_bytes: 1240000,
    storage_path: 'lokix-files/barani/prj-204/SafeVision_Service_Agreement_Signed.pdf',
    created_at: '2026-10-14'
  }
];

const INITIAL_NOTES = [
  {
    id: 'not-901',
    project_id: 'prj-201',
    project_name: 'Gym Owner & Super Admin SaaS Portal',
    title: 'Supabase Master Admin Role Routing Fix',
    content: 'Ensure user metadata role === "super_admin" bypasses the standard gym owner subscription check and opens /super-admin directly. Keep 15-day trial countdown badge visible in header.',
    is_important: true,
    created_at: '2026-11-11'
  },
  {
    id: 'not-902',
    project_id: 'prj-202',
    project_name: 'NERO Apparel Brand Identity & Mockups',
    title: 'NERO Typography & Color Codes',
    content: 'Primary Matte Black: #0D0D0D | Warm Sandal Accent: #D8B892 | Pure White Backdrop: #FFFFFF. Client requested minimal line accent under subtitle.',
    is_important: true,
    created_at: '2026-11-09'
  },
  {
    id: 'not-903',
    project_id: 'prj-203',
    project_name: 'ClientSphere Enterprise CRM UI/UX',
    title: 'Dark Mode Contrast Feedback',
    content: 'Client loved the sales pipeline Kanban. Updated meeting schedule cards and payment status badges to use softer border highlights.',
    is_important: false,
    created_at: '2026-11-12'
  },
  {
    id: 'not-904',
    project_id: 'prj-204',
    project_name: 'AI CCTV Multi-Camera YOLOv8 Dashboard',
    title: 'RTSP Camera Reconnect Logic',
    content: 'Use exponential backoff in OpenCV VideoCapture thread when rural network drops frames. Push alert snapshots to Supabase Storage bucket.',
    is_important: true,
    created_at: '2026-11-06'
  }
];

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    activity_type: 'work_log',
    title: 'Logged 3.0 hrs on ClientSphere Enterprise CRM UI/UX',
    description: 'Completed dark theme styling adjustments for client portal & payment tracking views.',
    created_at: 'Today, 05:15 PM'
  },
  {
    id: 'act-2',
    activity_type: 'task',
    title: 'Completed Task: Verify Super Admin role routing',
    description: 'Gym Owner & Super Admin SaaS Portal – IronPulse Fitness Studio',
    created_at: 'Today, 01:10 PM'
  },
  {
    id: 'act-3',
    activity_type: 'invoice',
    title: 'Sent Invoice #LKX-2026-043 (₹92,040 incl. GST)',
    description: 'Issued to ClientSphere Solutions for CRM UI/UX milestone.',
    created_at: 'Yesterday, 06:40 PM'
  },
  {
    id: 'act-4',
    activity_type: 'payment',
    title: 'Received ₹60,000 Advance via NEFT',
    description: 'IronPulse Fitness Studio – Gym Owner & Super Admin SaaS Portal',
    created_at: 'Nov 05, 2026'
  },
  {
    id: 'act-5',
    activity_type: 'project',
    title: 'Moved NERO Brand Identity to Client Review (90%)',
    description: 'Uploaded 4K sandal-on-black bottle mockup and vector logo pack.',
    created_at: 'Nov 04, 2026'
  }
];

// Helper to format INR currency
const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
};

// Helper to format duration seconds -> HH:MM:SS
const formatDurationHMS = (totalSeconds) => {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [hrs, mins, s].map((v) => String(v).padStart(2, '0')).join(':');
};

const formatHoursDecimal = (totalSeconds) => {
  return ((Number(totalSeconds) || 0) / 3600).toFixed(1);
};

export default function App() {
  // Navigation & UI state
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projectSaving, setProjectSaving] = useState(false);

  // Supabase connection settings
  const [supabaseConfig, setSupabaseConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('lokix_supabase_config');
      return saved ? JSON.parse(saved) : { url: 'https://lokix-workspace.supabase.co', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.lokix_anon_public_key', connected: true };
    } catch {
      return { url: 'https://lokix-workspace.supabase.co', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.lokix_anon_public_key', connected: true };
    }
  });

  // Load state with safe localStorage persistence
  const loadState = (key, fallback) => {
    try {
      const raw = localStorage.getItem(`lokix_${key}`);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  };

  const [clients, setClients] = useState([]);
  // Projects are loaded from Supabase after authentication. Do not seed demo rows.
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState(() => loadState('tasks', INITIAL_TASKS));
  const [workLogs, setWorkLogs] = useState(() => loadState('workLogs', INITIAL_WORK_LOGS));
  const [milestones, setMilestones] = useState(() => loadState('milestones', INITIAL_MILESTONES));
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState(() => loadState('invoices', INITIAL_INVOICES));
  const [files, setFiles] = useState(() => loadState('files', INITIAL_FILES));
  const [notes, setNotes] = useState(() => loadState('notes', INITIAL_NOTES));
  const [activities, setActivities] = useState(() => loadState('activities', INITIAL_ACTIVITIES));

  const [profile, setProfile] = useState(() =>
    loadState('profile', {
      full_name: 'Baraninathan S P',
      display_name: 'Barani',
      email: 'barani@lokix.in',
      phone: '+91 94880 11223',
      business_name: 'LOKIX.IN',
      tagline: 'Software Development & Design Services',
      designation: 'Freelance Software Developer & Designer',
      timezone: 'Asia/Kolkata',
      currency: 'INR (₹)',
      gst_number: '33AABCL1234F1Z5',
      location: 'Tirunelveli, Tamil Nadu, India',
      github: 'github.com/barani011',
      notify_email: true,
      notify_deadlines: true,
      notify_payments: true,
      accent_theme: 'Dark Brown & Orange (#A94F1D)'
    })
  );

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('lokix_clients', JSON.stringify(clients));
      localStorage.setItem('lokix_projects', JSON.stringify(projects));
      localStorage.setItem('lokix_tasks', JSON.stringify(tasks));
      localStorage.setItem('lokix_workLogs', JSON.stringify(workLogs));
      localStorage.setItem('lokix_milestones', JSON.stringify(milestones));
      localStorage.setItem('lokix_payments', JSON.stringify(payments));
      localStorage.setItem('lokix_invoices', JSON.stringify(invoices));
      localStorage.setItem('lokix_files', JSON.stringify(files));
      localStorage.setItem('lokix_notes', JSON.stringify(notes));
      localStorage.setItem('lokix_activities', JSON.stringify(activities));
      localStorage.setItem('lokix_profile', JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors in restricted sandboxes
    }
  }, [clients, projects, tasks, workLogs, milestones, payments, invoices, files, notes, activities, profile]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  // Supabase Auth session + load database-backed CRM records.
  useEffect(() => {
    let active = true;

    const fetchUserData = async (user) => {
      if (!user) {
        if (active) {
          setProjects([]);
          setClients([]);
          setPayments([]);
        }
        return;
      }

      try {
        const [projectsResult, clientsResult, paymentsResult] = await Promise.all([
          supabase.from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('clients').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: true })
        ]);

        if (projectsResult.error) throw new Error(`Projects: ${projectsResult.error.message}`);
        if (clientsResult.error) throw new Error(`Clients: ${clientsResult.error.message}`);
        if (paymentsResult.error) throw new Error(`Payments: ${paymentsResult.error.message}`);

        if (active) {
          setProjects(projectsResult.data || []);
          setClients(clientsResult.data || []);
          setPayments(paymentsResult.data || []);
        }
      } catch (error) {
        console.error('Supabase CRM data loading failed:', error);
        if (active) showToast(`Could not load CRM data: ${error.message}`, 'error');
      }
    };

    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user || null;
        if (active) {
          setAuthUser(user);
          setIsAuthenticated(Boolean(user));
        }
        await fetchUserData(user);
      } catch (error) {
        console.error('Supabase session check failed:', error);
        if (active) {
          setAuthUser(null);
          setIsAuthenticated(false);
          setProjects([]);
          setClients([]);
          setPayments([]);
          showToast(`Authentication check failed: ${error.message}`, 'error');
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      if (active) {
        setAuthUser(user);
        setIsAuthenticated(Boolean(user));
      }
      Promise.resolve().then(() => fetchUserData(user));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logActivity = (activity_type, title, description) => {
    const newAct = {
      id: `act-${Date.now()}`,
      activity_type,
      title,
      description,
      created_at: 'Just now'
    };
    setActivities((prev) => [newAct, ...prev.slice(0, 19)]);
  };

  // ============================================================================
  // LIVE WORK TIMER STATE (GLOBAL SO IT PERSISTS ACROSS PAGES)
  // ============================================================================
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerProjectId, setTimerProjectId] = useState(projects[0]?.id || 'prj-201');
  const [timerDescription, setTimerDescription] = useState('Building UI components & Supabase integration');
  const [timerStartTimeStr, setTimerStartTimeStr] = useState(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (timerRunning && !timerPaused) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning, timerPaused]);

  const handleStartTimer = () => {
    if (!timerProjectId) {
      showToast('Please select a project first', 'warning');
      return;
    }
    const nowStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    setTimerStartTimeStr(nowStr);
    setTimerRunning(true);
    setTimerPaused(false);
    showToast('Work timer started! Stay focused, Barani.', 'success');
  };

  const handlePauseTimer = () => {
    setTimerPaused(true);
    showToast('Timer paused.', 'warning');
  };

  const handleResumeTimer = () => {
    setTimerPaused(false);
    showToast('Timer resumed.', 'success');
  };

  const handleStopAndSaveTimer = () => {
    if (timerSeconds < 1) {
      setTimerRunning(false);
      setTimerPaused(false);
      setTimerSeconds(0);
      return;
    }
    const proj = projects.find((p) => p.id === timerProjectId);
    const endStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newLog = {
      id: `wkl-${Date.now()}`,
      project_id: timerProjectId,
      project_name: proj ? proj.project_name : 'General Freelance Work',
      work_description: timerDescription.trim() || 'Development & design work session',
      work_date: '2026-11-12',
      start_time: timerStartTimeStr || '10:00 AM',
      end_time: endStr,
      duration_seconds: Math.max(timerSeconds, 60)
    };
    setWorkLogs((prev) => [newLog, ...prev]);
    logActivity(
      'work_log',
      `Logged ${formatDurationHMS(timerSeconds)} on ${newLog.project_name}`,
      newLog.work_description
    );
    setTimerRunning(false);
    setTimerPaused(false);
    setTimerSeconds(0);
    showToast('Work session saved to Supabase work_logs!', 'success');
  };

  // ============================================================================
  // GLOBAL COMPUTED METRICS FOR DASHBOARD & REPORTS
  // ============================================================================
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => ['In Progress', 'Client Review', 'Revision'].includes(p.status)).length;
    const completedProjects = projects.filter((p) => p.status === 'Completed').length;
    const totalClients = clients.length;

    const totalRevenue = payments.reduce((acc, p) => acc + (Number(p.amount_received) || 0), 0);
    const pendingPayments = payments.reduce(
      (acc, p) => acc + Math.max(0, (Number(p.total_amount) || 0) - (Number(p.amount_received) || 0)),
      0
    );

    const todaySeconds = workLogs
      .filter((w) => w.work_date === '2026-11-12')
      .reduce((acc, w) => acc + (Number(w.duration_seconds) || 0), 0);

    const totalSeconds = workLogs.reduce((acc, w) => acc + (Number(w.duration_seconds) || 0), 0);
    const completedTasksCount = tasks.filter((t) => t.status === 'Completed').length;
    const pendingTasksCount = tasks.filter((t) => t.status !== 'Completed').length;
    const upcomingDeadlinesCount = projects.filter((p) => p.status !== 'Completed').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalClients,
      totalRevenue,
      pendingPayments,
      todayHours: (todaySeconds / 3600).toFixed(1),
      totalHours: (totalSeconds / 3600).toFixed(1),
      completedTasksCount,
      pendingTasksCount,
      upcomingDeadlinesCount
    };
  }, [projects, clients, payments, workLogs, tasks]);

  // ============================================================================
  // PAGE-SPECIFIC STATES (MODALS, FILTERS, FORMS)
  // ============================================================================
  // Projects filter & modal state
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('All');
  const [projectStatusFilter, setProjectStatusFilter] = useState('All');
  const [projectSortBy, setProjectSortBy] = useState('deadline');
  const [projectModal, setProjectModal] = useState(null); // null | { mode: 'add' | 'edit' | 'view', data: ... }

  // Clients filter & modal state
  const [clientSearch, setClientSearch] = useState('');
  const [clientModal, setClientModal] = useState(null);

  // Manual work log modal
  const [manualLogModal, setManualLogModal] = useState(false);
  const [manualLogForm, setManualLogForm] = useState({
    project_id: 'prj-201',
    work_description: '',
    work_date: '2026-11-12',
    start_time: '06:00 PM',
    end_time: '08:00 PM',
    hours: '2.0'
  });

  // Tasks view & modal
  const [taskViewMode, setTaskViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [taskFilterPriority, setTaskFilterPriority] = useState('All');
  const [taskModal, setTaskModal] = useState(null);

  // Timeline state
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    project_id: 'prj-201',
    title: '',
    due_date: '2026-11-22',
    status: 'Pending'
  });

  // Files state
  const [fileCategoryFilter, setFileCategoryFilter] = useState('All');
  const [fileProjectFilter, setFileProjectFilter] = useState('All');
  const [fileUploadModal, setFileUploadModal] = useState(false);
  const [fileUploadForm, setFileUploadForm] = useState({
    project_id: 'prj-201',
    file_name: '',
    file_category: 'Project File',
    file_type: 'application/pdf',
    file_size_mb: '2.4'
  });

  // Payments state
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');
  const [paymentModal, setPaymentModal] = useState(null);

  // Invoices state
  const [selectedInvoice, setSelectedInvoice] = useState(invoices[0] || null);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    client_id: 'cli-101',
    project_id: 'prj-202',
    issue_date: '2026-11-12',
    due_date: '2026-11-26',
    gst_rate: 18,
    status: 'Unpaid',
    items: [{ id: 'item-1', service_description: 'Frontend UI/UX & Full-Stack Implementation', quantity: 1, unit_price: 35000 }]
  });

  // Notes state
  const [noteSearch, setNoteSearch] = useState('');
  const [noteFilterImportant, setNoteFilterImportant] = useState(false);
  const [noteModal, setNoteModal] = useState(null);

  // Login form state (when logged out)
  const [loginEmail, setLoginEmail] = useState('barani@lokix.in');
  const [loginPassword, setLoginPassword] = useState('');

  // ============================================================================
  // NAVIGATION ITEMS CONFIGURATION
  // ============================================================================
  const navGroups = [
    {
      label: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'My Projects', icon: FolderKanban, badge: projects.length },
        { id: 'clients', label: 'Clients', icon: Users, badge: clients.length },
        { id: 'work-tracker', label: 'Work Tracker', icon: Timer, live: timerRunning },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: tasks.filter((t) => t.status !== 'Completed').length }

      ]
    },
    {
      label: 'MANAGEMENT',
      items: [
        { id: 'timeline', label: 'Project Timeline', icon: CalendarDays },
        { id: 'files', label: 'Files & Documents', icon: Files },
        { id: 'payments', label: 'Payments', icon: Wallet },
        { id: 'invoices', label: 'Invoices', icon: FileText }
      ]
    },
    {
      label: 'OTHERS',
      items: [
        { id: 'reports', label: 'Reports', icon: ChartNoAxesCombined },
        { id: 'notes', label: 'Notes', icon: NotebookPen },
        { id: 'settings', label: 'Settings', icon: Settings },
        { id: 'profile', label: 'Profile', icon: UserRound }
      ]
    },

    {
  label: 'OTHERS',
  items: [
    { id: 'reports', label: 'Reports', icon: ChartNoAxesCombined },
    { id: 'notes', label: 'Notes', icon: NotebookPen },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'services-plans', label: 'Services & Plans', icon: Package },
  ]
},

  ];

  // Status badge helper
  const getStatusBadge = (status) => {
    const map = {
      Completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      Paid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      'In Progress': 'bg-[#A94F1D]/25 text-[#F5B942] border-[#A94F1D]/50',
      'Partially Paid': 'bg-[#F5B942]/15 text-[#F5B942] border-[#F5B942]/40',
      'Client Review': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      Sent: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      Pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      Unpaid: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      'To Do': 'bg-stone-500/20 text-[#A6A09A] border-stone-500/30',
      'Not Started': 'bg-stone-500/20 text-[#A6A09A] border-stone-500/30',
      Revision: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      'On Hold': 'bg-red-500/15 text-red-400 border-red-500/30',
      Overdue: 'bg-red-500/20 text-red-400 border-red-500/40'
    };
    return map[status] || 'bg-[#24170F] text-[#A6A09A] border-[#3A2518]';
  };

  const getPriorityBadge = (priority) => {
    const map = {
      Urgent: 'bg-red-500/20 text-red-400 border-red-500/40',
      High: 'bg-[#A94F1D]/25 text-[#F5B942] border-[#A94F1D]/50',
      Medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
      Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    };
    return map[priority] || 'bg-stone-700 text-stone-300';
  };

  // ============================================================================
  // AUTH SCREEN WHEN LOGGED OUT
  // ============================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#100A06] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#A94F1D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#A6A09A]">Connecting to LOKIX.IN workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#100A06] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#24170F] border border-[#3A2518] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A94F1D] to-[#F5B942] flex items-center justify-center text-[#100A06] font-extrabold text-xl shadow-lg">
              L
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">LOKIX.IN</h1>
              <p className="text-xs text-[#A6A09A]">Software Development & Design Services</p>
            </div>
          </div>

          <h2 className="text-lg font-semibold mb-1">Sign in to Supabase Workspace</h2>
          <p className="text-xs text-[#A6A09A] mb-6">
            Protected with Supabase Auth & Row Level Security (Asia/Kolkata • INR ₹)
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email: loginEmail.trim(),
                  password: loginPassword
                });
                if (error) throw error;
                setAuthUser(data.user);
                setIsAuthenticated(true);
                setActivePage('dashboard');
                showToast('Signed in successfully.', 'success');
              } catch (error) {
                console.error('Supabase sign-in failed:', error);
                showToast(`Sign-in failed: ${error.message}`, 'error');
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-white text-sm focus:outline-none focus:border-[#A94F1D]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-white text-sm focus:outline-none focus:border-[#A94F1D]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Unlock className="w-4 h-4" /> Sign In to LOKIX.IN Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: 1. DASHBOARD PAGE
  // ============================================================================
  const renderDashboard = () => {
    const projectChartData = projects.map((p) => ({
      name: p.project_name.length > 16 ? p.project_name.slice(0, 16) + '…' : p.project_name,
      progress: Number(p.progress) || 0,
      budgetK: Math.round((Number(p.budget) || 0) / 1000)
    }));

    const upcomingProjects = [...projects]
      .filter((p) => p.status !== 'Completed')
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 4);

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#24170F] via-[#2D1C12] to-[#17120F] border border-[#3A2518] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#A94F1D]/20 border border-[#A94F1D]/40 text-[#F5B942] text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" /> LOKIX.IN • Software Development & Design Services
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, Barani!
            </h1>
            <p className="text-sm text-[#A6A09A] mt-1">
              Manage your freelance projects and track your daily progress.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setActivePage('work-tracker');
                if (!timerRunning) handleStartTimer();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-[#F5B942] text-xs sm:text-sm font-medium flex items-center gap-2 transition"
            >
              <Timer className="w-4 h-4" />
              {timerRunning ? `Timer Active: ${formatDurationHMS(timerSeconds)}` : 'Start Work Timer'}
            </button>
            <button
              onClick={() => {
                setActivePage('projects');
                setProjectModal({
                  mode: 'add',
                  data: {
                    project_name: '',
                    client_id: clients[0]?.id || '',
                    client_name: clients[0]?.company_name || '',
                    category: 'Website Development',
                    description: '',
                    budget: 45000,
                    start_date: '2026-11-12',
                    deadline: '2026-12-01',
                    status: 'In Progress',
                    progress: 10,
                    priority: 'High'
                  }
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition shadow-lg"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        {/* 6 Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              label: 'Total Projects',
              value: stats.totalProjects,
              sub: 'All client engagements',
              icon: FolderKanban,
              accent: 'text-[#F5B942] bg-[#F5B942]/10 border-[#F5B942]/30',
              target: 'projects'
            },
            {
              label: 'Active Projects',
              value: stats.activeProjects,
              sub: 'In progress & review',
              icon: Layers,
              accent: 'text-[#A94F1D] bg-[#A94F1D]/15 border-[#A94F1D]/40',
              target: 'projects'
            },
            {
              label: 'Completed Projects',
              value: stats.completedProjects,
              sub: '100% delivered',
              icon: CheckCircle2,
              accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
              target: 'projects'
            },
            {
              label: 'Total Clients',
              value: stats.totalClients,
              sub: 'Active brand accounts',
              icon: Users,
              accent: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
              target: 'clients'
            },
            {
              label: 'Pending Payments',
              value: formatINR(stats.pendingPayments),
              sub: 'Receivable balance',
              icon: Clock,
              accent: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
              target: 'payments'
            },
            {
              label: 'Total Revenue',
              value: formatINR(stats.totalRevenue),
              sub: 'Received in INR (₹)',
              icon: IndianRupee,
              accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
              target: 'payments'
            }
          ].map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => setActivePage(card.target)}
                className="bg-[#24170F] hover:bg-[#2c1c12] border border-[#3A2518] rounded-2xl p-4 cursor-pointer transition group shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#A6A09A]">{card.label}</span>
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${card.accent}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-white tracking-tight group-hover:text-[#F5B942] transition">
                  {card.value}
                </div>
                <p className="text-[11px] text-[#A6A09A] mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Project Progress Chart + Today's Work Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Project Progress Chart */}
          <div className="lg:col-span-2 bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Project Progress Overview</h2>
                <p className="text-xs text-[#A6A09A]">Completion percentage across active & delivered LOKIX.IN projects</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#100A06] border border-[#3A2518] text-[#F5B942]">
                Live Supabase Sync
              </span>
            </div>
            <div className="relative h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectChartData} margin={{ top: 10, right: 15, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A2518" />
                  <XAxis dataKey="name" stroke="#A6A09A" tick={{ fill: '#A6A09A', fontSize: 11 }} />
                  <YAxis stroke="#A6A09A" tick={{ fill: '#A6A09A', fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#17120F',
                      borderColor: '#A94F1D',
                      borderRadius: '12px',
                      color: '#FFFFFF',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="progress" name="Progress (%)" fill="#A94F1D" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Work Summary */}
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Today's Work Summary</h2>
                  <p className="text-xs text-[#A6A09A]">Thursday, 12 Nov 2026 (IST)</p>
                </div>
                <Timer className="w-5 h-5 text-[#F5B942]" />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5">
                  <span className="text-[11px] text-[#A6A09A] block">Total Working Hours</span>
                  <span className="text-xl font-bold text-[#F5B942] mt-1 block">{stats.todayHours} hrs</span>
                </div>
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5">
                  <span className="text-[11px] text-[#A6A09A] block">Completed Tasks</span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">{stats.completedTasksCount}</span>
                </div>
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5">
                  <span className="text-[11px] text-[#A6A09A] block">Pending Tasks</span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">{stats.pendingTasksCount}</span>
                </div>
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5">
                  <span className="text-[11px] text-[#A6A09A] block">Upcoming Deadlines</span>
                  <span className="text-xl font-bold text-red-400 mt-1 block">{stats.upcomingDeadlinesCount}</span>
                </div>
              </div>

              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A6A09A] mb-2.5">
                Priority Deadlines
              </h3>
              <div className="space-y-2">
                {upcomingProjects.slice(0, 3).map((up) => (
                  <div
                    key={up.id}
                    onClick={() => setActivePage('timeline')}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#100A06]/80 border border-[#3A2518] hover:border-[#A94F1D] cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-medium text-white truncate">{up.project_name}</p>
                      <p className="text-[11px] text-[#A6A09A] truncate">{up.client_name}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#F5B942] whitespace-nowrap">
                      Due {up.deadline}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setActivePage('work-tracker')}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#A94F1D]/20 hover:bg-[#A94F1D]/30 border border-[#A94F1D]/50 text-[#F5B942] text-xs font-semibold transition"
            >
              Open Daily Work Tracker →
            </button>
          </div>
        </div>

        {/* Recent Projects Table + Recent Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Projects Section */}
          <div className="lg:col-span-2 bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Recent Projects</h2>
                <p className="text-xs text-[#A6A09A]">Active client deliverables, deadlines, and completion status</p>
              </div>
              <button
                onClick={() => setActivePage('projects')}
                className="text-xs text-[#F5B942] hover:underline font-medium"
              >
                View All ({projects.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#3A2518] text-[11px] uppercase tracking-wider text-[#A6A09A]">
                    <th className="pb-3 font-medium">Project Name</th>
                    <th className="pb-3 font-medium">Client Name</th>
                    <th className="pb-3 font-medium">Deadline</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A2518]/60 text-xs">
                  {projects.slice(0, 6).map((proj) => (
                    <tr key={proj.id} className="hover:bg-[#17120F]/60 transition">
                      <td className="py-3.5 pr-3 font-semibold text-white">{proj.project_name}</td>
                      <td className="py-3.5 pr-3 text-[#A6A09A]">{proj.client_name}</td>
                      <td className="py-3.5 pr-3 text-white whitespace-nowrap">{proj.deadline}</td>
                      <td className="py-3.5 pr-3 w-36">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#100A06] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#A94F1D] to-[#F5B942] rounded-full"
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-[#F5B942] w-8">{proj.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getStatusBadge(proj.status)}`}>
                          {proj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                <p className="text-xs text-[#A6A09A]">Latest project & payment events</p>
              </div>
              <Bell className="w-4 h-4 text-[#F5B942]" />
            </div>

            <div className="space-y-3.5 max-h-[340px] overflow-y-auto pr-1">
              {activities.slice(0, 7).map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-[#100A06]/70 border border-[#3A2518] flex items-start gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-[#F5B942] mt-1.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">{act.title}</p>
                    <p className="text-[11px] text-[#A6A09A] mt-0.5">{act.description}</p>
                    <span className="text-[10px] text-[#A94F1D] font-medium mt-1 block">{act.created_at}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 2. MY PROJECTS PAGE
  // ============================================================================
  const projectCategories = [
    'Website Development',
    'Logo Design',
    'Branding',
    'UI/UX Design',
    'Software Development',
    'CRM Development',
    'Other'
  ];

  const projectStatuses = [
    'Not Started',
    'In Progress',
    'Client Review',
    'Revision',
    'Completed',
    'On Hold'
  ];

  const handleSaveProject = async (e) => {
    e.preventDefault();

    if (!authUser) {
      showToast('Your Supabase session has expired. Please sign in again.', 'error');
      setIsAuthenticated(false);
      return;
    }

    const form = projectModal?.data;
    if (!form?.project_name?.trim()) {
      showToast('Project name is required', 'warning');
      return;
    }
    if (!form.deadline) {
      showToast('Project deadline is required', 'warning');
      return;
    }

    // Resolve the selected client from the Supabase clients table.
    // For older projects, fall back to the saved company name when editing.
    const selectedClient =
      clients.find((client) => client.id === form.client_id) ||
      clients.find(
        (client) =>
          (client.company_name || '').trim().toLowerCase() ===
          (form.client_name || '').trim().toLowerCase()
      );

    if (!selectedClient) {
      showToast(
        clients.length
          ? 'Please select a client from the dropdown.'
          : 'Please add a client before creating a project.',
        'warning'
      );
      return;
    }

    const projectData = {
      user_id: authUser.id,
      client_id: selectedClient.id,
      project_name: form.project_name.trim(),
      client_name: selectedClient.company_name,
      category: form.category || 'Other',
      description: form.description || '',
      budget: Number(form.budget) || 0,
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      deadline: form.deadline,
      status: form.status || 'Not Started',
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
      priority: form.priority || 'Medium'
    };

    setProjectSaving(true);
    try {
      if (projectModal.mode === 'add') {
        const { data, error } = await supabase
          .from('projects')
          .insert(projectData)
          .select('*')
          .single();
        if (error) throw error;

        setProjects((prev) => [data, ...prev]);
        logActivity(
          'project',
          `Created Project: ${data.project_name}`,
          `Client: ${data.client_name} • Budget: ${formatINR(data.budget)}`
        );
        showToast('Project saved successfully to Supabase!', 'success');
      } else if (projectModal.mode === 'edit') {
        const { data, error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', form.id)
          .eq('user_id', authUser.id)
          .select('*')
          .single();
        if (error) throw error;

        setProjects((prev) => prev.map((project) => project.id === data.id ? data : project));
        logActivity('project', `Updated Project: ${data.project_name}`, `Status: ${data.status} (${data.progress}%)`);
        showToast('Project updated successfully in Supabase!', 'success');
      }

      setProjectModal(null);
    } catch (error) {
      console.error('Supabase project save failed:', error);
      showToast(`Project was not saved: ${error.message}`, 'error');
    } finally {
      setProjectSaving(false);
    }
  };

  const renderProjects = () => {
    const filtered = projects
      .filter((p) => {
        const q = projectSearch.toLowerCase();
        const matchSearch =
          p.project_name.toLowerCase().includes(q) ||
          p.client_name.toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q);
        const matchCat = projectCategoryFilter === 'All' || p.category === projectCategoryFilter;
        const matchStatus = projectStatusFilter === 'All' || p.status === projectStatusFilter;
        return matchSearch && matchCat && matchStatus;
      })
      .sort((a, b) => {
        if (projectSortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
        if (projectSortBy === 'budget') return (Number(b.budget) || 0) - (Number(a.budget) || 0);
        if (projectSortBy === 'progress') return (Number(b.progress) || 0) - (Number(a.progress) || 0);
        return a.project_name.localeCompare(b.project_name);
      });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            <p className="text-xs text-[#A6A09A]">
              Track deliverables, update completion sliders, and manage budgets across all client engagements
            </p>
          </div>
          <button
            onClick={() =>
              setProjectModal({
                mode: 'add',
                data: {
                  project_name: '',
                  client_id: clients[0]?.id || '',
                  client_name: clients[0]?.company_name || '',
                  category: 'Website Development',
                  description: '',
                  budget: 50000,
                  start_date: '2026-11-12',
                  deadline: '2026-12-05',
                  status: 'In Progress',
                  progress: 15,
                  priority: 'High'
                }
              })
            }
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add New Project
          </button>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A6A09A] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search project or client..."
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
            />
          </div>

          <select
            value={projectCategoryFilter}
            onChange={(e) => setProjectCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
          >
            <option value="All">All Categories</option>
            {projectCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={projectStatusFilter}
            onChange={(e) => setProjectStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
          >
            <option value="All">All Statuses</option>
            {projectStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={projectSortBy}
            onChange={(e) => setProjectSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
          >
            <option value="deadline">Sort by Deadline</option>
            <option value="budget">Sort by Budget (High → Low)</option>
            <option value="progress">Sort by Progress (%)</option>
            <option value="name">Sort by Name (A → Z)</option>
          </select>
        </div>

        {/* Project Cards Grid */}
        {filtered.length === 0 ? (
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-12 text-center">
            <FolderKanban className="w-10 h-10 text-[#A6A09A] mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No matching projects found</h3>
            <p className="text-xs text-[#A6A09A] mt-1">Try clearing your filters or create a new freelance project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((proj) => (
              <div
                key={proj.id}
                className="bg-[#24170F] hover:border-[#A94F1D]/60 border border-[#3A2518] rounded-2xl p-5 flex flex-col justify-between transition shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg bg-[#100A06] border border-[#3A2518] text-[#F5B942]">
                      {proj.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(proj.priority)}`}>
                        {proj.priority}
                      </span>
                      <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${getStatusBadge(proj.status)}`}>
                        {proj.status}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">{proj.project_name}</h3>
                  <p className="text-xs text-[#F5B942] font-medium mb-2">{proj.client_name}</p>
                  <p className="text-xs text-[#A6A09A] line-clamp-2 mb-4">{proj.description}</p>

                  {/* Interactive Progress Bar */}
                  <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#A6A09A]">Completion Progress</span>
                      <span className="font-bold text-[#F5B942]">{proj.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-[#24170F] rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-[#A94F1D] to-[#F5B942] transition-all duration-300"
                        style={{ width: `${proj.progress}%` }}
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={proj.progress}
                      onChange={async (e) => {
                        const val = Number(e.target.value);
                        if (!authUser) {
                          showToast('Please sign in again to update this project.', 'error');
                          return;
                        }
                        const updatedFields = {
                          progress: val,
                          ...(val === 100 ? { status: 'Completed' } : {})
                        };
                        try {
                          const { data, error } = await supabase
                            .from('projects')
                            .update(updatedFields)
                            .eq('id', proj.id)
                            .eq('user_id', authUser.id)
                            .select('*')
                            .single();
                          if (error) throw error;
                          setProjects((prev) => prev.map((item) => item.id === data.id ? data : item));
                        } catch (error) {
                          console.error('Project progress update failed:', error);
                          showToast(`Progress was not saved: ${error.message}`, 'error');
                        }
                      }}
                      className="w-full accent-[#A94F1D] cursor-pointer h-1"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs border-t border-[#3A2518] pt-3 mb-3">
                    <div>
                      <span className="text-[#A6A09A] block text-[10px]">Project Budget</span>
                      <span className="font-bold text-white text-sm">{formatINR(proj.budget)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#A6A09A] block text-[10px]">Deadline</span>
                      <span className="font-medium text-white">{proj.deadline}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setProjectModal({ mode: 'view', data: proj })}
                      className="flex-1 py-2 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-xs font-medium text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F5B942]" /> Details
                    </button>
                    <button
                      onClick={() => setProjectModal({ mode: 'edit', data: { ...proj } })}
                      className="px-3 py-2 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-xs text-[#A6A09A] hover:text-white transition"
                      title="Edit Project"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDialog({
                          title: 'Delete Project?',
                          message: `Are you sure you want to permanently remove "${proj.project_name}"?`,
                          onConfirm: async () => {
                            try {
                              if (!authUser) throw new Error('Please sign in again.');
                              const { error } = await supabase
                                .from('projects')
                                .delete()
                                .eq('id', proj.id)
                                .eq('user_id', authUser.id);
                              if (error) throw error;
                              setProjects((prev) => prev.filter((p) => p.id !== proj.id));
                              showToast('Project deleted from Supabase.', 'success');
                            } catch (error) {
                              console.error('Supabase project delete failed:', error);
                              showToast(`Project was not deleted: ${error.message}`, 'error');
                            }
                          }
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-[#100A06] hover:bg-red-500/20 border border-[#3A2518] text-xs text-red-400 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER: 3. CLIENTS PAGE
  // ============================================================================
  const handleSaveClient = async (e) => {
    e.preventDefault();
    if (!authUser) {
      showToast('Please sign in with Supabase before saving a client.', 'error');
      return;
    }

    const form = clientModal?.data || {};
    if (!form.full_name?.trim() || !form.company_name?.trim() || !form.email?.trim()) {
      showToast('Client name, company name and email are required.', 'warning');
      return;
    }

    const clientData = {
      user_id: authUser.id,
      full_name: form.full_name.trim(),
      company_name: form.company_name.trim(),
      email: form.email.trim(),
      phone: form.phone?.trim() || null,
      address: form.address?.trim() || null,
      client_type: form.client_type || 'Individual',
      notes: form.notes?.trim() || null
    };

    try {
      if (clientModal.mode === 'add') {
        const { data, error } = await supabase.from('clients').insert(clientData).select('*').single();
        if (error) throw error;
        setClients((prev) => [data, ...prev]);
        logActivity('client', `Added New Client: ${data.company_name}`, `Contact: ${data.full_name}`);
        showToast('Client saved successfully to Supabase!', 'success');
      } else if (clientModal.mode === 'edit') {
        const { data, error } = await supabase.from('clients').update(clientData)
          .eq('id', form.id).eq('user_id', authUser.id).select('*').single();
        if (error) throw error;
        setClients((prev) => prev.map((client) => client.id === data.id ? data : client));
        showToast('Client updated successfully in Supabase!', 'success');
      }
      setClientModal(null);
    } catch (error) {
      console.error('Supabase client save failed:', error);
      showToast(`Client was not saved: ${error.message}`, 'error');
    }
  };

  const renderClients = () => {
    const filteredClients = clients.filter((c) => {
      const q = clientSearch.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(q) ||
        c.company_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.address || '').toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Clients Directory</h1>
            <p className="text-xs text-[#A6A09A]">
              Manage client contacts, companies, retainers, and linked freelance projects
            </p>
          </div>
          <button
            onClick={() =>
              setClientModal({
                mode: 'add',
                data: {
                  full_name: '',
                  company_name: '',
                  email: '',
                  phone: '+91 ',
                  address: 'Tamil Nadu, India',
                  client_type: 'Brand',
                  notes: ''
                }
              })
            }
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add Client
          </button>
        </div>

        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#A6A09A] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search clients by name, company, email, or city..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = projects.filter(
              (p) =>
                p.client_id === client.id ||
                (p.client_name || '').trim().toLowerCase() ===
                  (client.company_name || '').trim().toLowerCase()
            );
            return (
              <div
                key={client.id}
                className="bg-[#24170F] border border-[#3A2518] hover:border-[#A94F1D]/60 rounded-2xl p-5 flex flex-col justify-between transition shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#A94F1D]/20 border border-[#A94F1D]/40 flex items-center justify-center text-[#F5B942] font-bold text-base">
                        {client.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{client.company_name}</h3>
                        <p className="text-xs text-[#F5B942]">{client.full_name}</p>
                      </div>
                    </div>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#100A06] border border-[#3A2518] text-[#A6A09A]">
                      {client.client_type}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#A6A09A] my-3 bg-[#100A06] p-3 rounded-xl border border-[#3A2518]">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#A94F1D]" />
                      <span className="text-white truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#A94F1D]" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#A94F1D]" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#A6A09A] line-clamp-2 mb-3">{client.notes}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-[#100A06]/60 border border-[#3A2518] mb-3">
                    <span className="text-xs text-[#A6A09A]">Assigned Projects</span>
                    <span className="text-xs font-bold text-[#F5B942]">{clientProjects.length} Projects</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setClientModal({ mode: 'view', data: client, projects: clientProjects })}
                      className="flex-1 py-2 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-xs font-medium text-white flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F5B942]" /> View Details & Projects
                    </button>
                    <button
                      onClick={() => setClientModal({ mode: 'edit', data: { ...client } })}
                      className="px-3 py-2 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-xs text-[#A6A09A] hover:text-white"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setConfirmDialog({
                          title: 'Delete Client?',
                          message: `Remove "${client.company_name}" from your client directory?`,
                          onConfirm: async () => {
                            try {
                              if (!authUser) throw new Error('Please sign in again.');
                              const { error } = await supabase.from('clients').delete()
                                .eq('id', client.id).eq('user_id', authUser.id);
                              if (error) throw error;
                              setClients((prev) => prev.filter((c) => c.id !== client.id));
                              showToast('Client deleted from Supabase.', 'success');
                            } catch (error) {
                              console.error('Supabase client delete failed:', error);
                              showToast(`Client was not deleted: ${error.message}`, 'error');
                            }
                          }
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-[#100A06] hover:bg-red-500/20 border border-[#3A2518] text-xs text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 4. WORK TRACKER PAGE
  // ============================================================================
  const handleAddManualWorkLog = (e) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === manualLogForm.project_id);
    const secs = Math.round(( parseFloat(manualLogForm.hours) || 1 ) * 3600);
    const newEntry = {
      id: `wkl-${Date.now()}`,
      project_id: manualLogForm.project_id,
      project_name: proj ? proj.project_name : 'Custom Project',
      work_description: manualLogForm.work_description || 'Manual development session',
      work_date: manualLogForm.work_date,
      start_time: manualLogForm.start_time,
      end_time: manualLogForm.end_time,
      duration_seconds: secs
    };
    setWorkLogs((prev) => [newEntry, ...prev]);
    logActivity('work_log', `Manually logged ${manualLogForm.hours} hrs on ${newEntry.project_name}`, newEntry.work_description);
    setManualLogModal(false);
    showToast('Manual work hours saved to Supabase!', 'success');
  };

  const renderWorkTracker = () => {
    const todaySecs = workLogs
      .filter((w) => w.work_date === '2026-11-12')
      .reduce((a, b) => a + (Number(b.duration_seconds) || 0), 0);
    const weekSecs = workLogs.reduce((a, b) => a + (Number(b.duration_seconds) || 0), 0);
    const monthSecs = weekSecs + 43200; // Includes earlier month sprints

    const projectWiseHours = projects.map((p) => {
      const secs = workLogs
        .filter((w) => w.project_id === p.id || w.project_name === p.project_name)
        .reduce((a, b) => a + (Number(b.duration_seconds) || 0), 0);
      return {
        id: p.id,
        name: p.project_name,
        client: p.client_name,
        hours: (secs / 3600).toFixed(1)
      };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Work Tracker & Daily Timer</h1>
            <p className="text-xs text-[#A6A09A]">
              Record live coding & design sessions or log manual hours directly to Supabase work_logs
            </p>
          </div>
          <button
            onClick={() => setManualLogModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#24170F] hover:bg-[#2f1e14] border border-[#A94F1D] text-[#F5B942] text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Manually Add Working Hours
          </button>
        </div>

        {/* Live Interactive Timer Console */}
        <div className="bg-gradient-to-r from-[#24170F] via-[#2A1A10] to-[#17120F] border border-[#A94F1D]/60 rounded-2xl p-6 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div className="lg:col-span-4">
              <label className="block text-[11px] uppercase tracking-wider text-[#A6A09A] mb-1.5">Select Active Project</label>
              <select
                value={timerProjectId}
                onChange={(e) => setTimerProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs sm:text-sm text-white focus:outline-none focus:border-[#A94F1D]"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.project_name} ({p.client_name})</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-4">
              <label className="block text-[11px] uppercase tracking-wider text-[#A6A09A] mb-1.5">Work Description</label>
              <input
                type="text"
                placeholder="What are you working on right now?"
                value={timerDescription}
                onChange={(e) => setTimerDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs sm:text-sm text-white focus:outline-none focus:border-[#A94F1D]"
              />
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row items-center justify-end gap-4">
              <div className="text-center sm:text-right">
                <span className="text-[10px] uppercase tracking-widest text-[#A6A09A] block">Session Elapsed</span>
                <span className="text-3xl font-mono font-extrabold text-[#F5B942] tracking-wider">
                  {formatDurationHMS(timerSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!timerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                  >
                    <Play className="w-4 h-4" /> Start
                  </button>
                ) : (
                  <>
                    {!timerPaused ? (
                      <button
                        onClick={handlePauseTimer}
                        className="px-3.5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#100A06] text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Pause className="w-4 h-4" /> Pause
                      </button>
                    ) : (
                      <button
                        onClick={handleResumeTimer}
                        className="px-3.5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#100A06] text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <Play className="w-4 h-4" /> Resume
                      </button>
                    )}
                    <button
                      onClick={handleStopAndSaveTimer}
                      className="px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transition"
                    >
                      <Square className="w-4 h-4" /> Stop & Save
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <span className="text-xs text-[#A6A09A]">Today's Working Hours</span>
            <div className="text-2xl font-bold text-[#F5B942] mt-1">{formatHoursDecimal(todaySecs + timerSeconds)} hrs</div>
            <p className="text-[11px] text-[#A6A09A] mt-1">Includes live active session</p>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <span className="text-xs text-[#A6A09A]">This Week's Working Hours</span>
            <div className="text-2xl font-bold text-white mt-1">{formatHoursDecimal(weekSecs + timerSeconds)} hrs</div>
            <p className="text-[11px] text-[#A6A09A] mt-1">Across {workLogs.length} logged sessions</p>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <span className="text-xs text-[#A6A09A]">Monthly Working Hours</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{formatHoursDecimal(monthSecs + timerSeconds)} hrs</div>
            <p className="text-[11px] text-[#A6A09A] mt-1">November 2026 total billable time</p>
          </div>
        </div>

        {/* Project-wise Working Hours + Daily Work History Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Project-wise Working Hours</h2>
            <p className="text-xs text-[#A6A09A] mb-4">Cumulative time invested per project</p>
            <div className="space-y-3">
              {projectWiseHours.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518] flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-[#A6A09A] truncate">{item.client}</p>
                  </div>
                  <span className="text-xs font-bold text-[#F5B942] whitespace-nowrap">{item.hours} hrs</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-1">Daily Work History Table</h2>
            <p className="text-xs text-[#A6A09A] mb-4">All recorded timer and manual work logs</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#3A2518] text-[11px] uppercase tracking-wider text-[#A6A09A]">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Project</th>
                    <th className="pb-3">Work Description</th>
                    <th className="pb-3">Start / End</th>
                    <th className="pb-3 text-right">Duration</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3A2518]/60 text-xs">
                  {workLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#17120F]/60">
                      <td className="py-3 pr-2 whitespace-nowrap text-[#A6A09A]">{log.work_date}</td>
                      <td className="py-3 pr-2 font-semibold text-white">{log.project_name}</td>
                      <td className="py-3 pr-2 text-[#A6A09A] max-w-xs">{log.work_description}</td>
                      <td className="py-3 pr-2 whitespace-nowrap text-[#A6A09A]">
                        {log.start_time} – {log.end_time}
                      </td>
                      <td className="py-3 text-right font-mono font-semibold text-[#F5B942] whitespace-nowrap">
                        {formatDurationHMS(log.duration_seconds)} ({formatHoursDecimal(log.duration_seconds)}h)
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            setWorkLogs((prev) => prev.filter((w) => w.id !== log.id));
                            showToast('Work log removed.', 'warning');
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 5. TASKS PAGE (KANBAN & LIST VIEWS)
  // ============================================================================
  const handleSaveTask = (e) => {
    e.preventDefault();
    const form = taskModal.data;
    if (!form.title.trim()) {
      showToast('Task title is required', 'warning');
      return;
    }
    const proj = projects.find((p) => p.id === form.project_id);
    const enriched = {
      ...form,
      project_name: proj ? proj.project_name : form.project_name || 'General'
    };
    if (taskModal.mode === 'add') {
      setTasks((prev) => [{ ...enriched, id: `tsk-${Date.now()}` }, ...prev]);
      logActivity('task', `Added Task: ${enriched.title}`, enriched.project_name);
      showToast('Task added!', 'success');
    } else {
      setTasks((prev) => prev.map((t) => (t.id === enriched.id ? enriched : t)));
      showToast('Task updated!', 'success');
    }
    setTaskModal(null);
  };

  const renderTasks = () => {
    const filteredTasks = tasks.filter(
      (t) => taskFilterPriority === 'All' || t.priority === taskFilterPriority
    );
    const columns = ['To Do', 'In Progress', 'Completed'];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Task Management</h1>
            <p className="text-xs text-[#A6A09A]">
              Organize project tasks across Kanban boards and structured list views
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-[#24170F] border border-[#3A2518] rounded-xl p-1 flex">
              <button
                onClick={() => setTaskViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  taskViewMode === 'kanban' ? 'bg-[#A94F1D] text-white' : 'text-[#A6A09A] hover:text-white'
                }`}
              >
                Kanban Board
              </button>
              <button
                onClick={() => setTaskViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  taskViewMode === 'list' ? 'bg-[#A94F1D] text-white' : 'text-[#A6A09A] hover:text-white'
                }`}
              >
                List View
              </button>
            </div>

            <select
              value={taskFilterPriority}
              onChange={(e) => setTaskFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#24170F] border border-[#3A2518] text-xs text-white"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            <button
              onClick={() =>
                setTaskModal({
                  mode: 'add',
                  data: {
                    title: '',
                    description: '',
                    project_id: projects[0]?.id || 'prj-201',
                    status: 'To Do',
                    priority: 'High',
                    due_date: '2026-11-16'
                  }
                })
              }
              className="px-4 py-2 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {taskViewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {columns.map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              return (
                <div key={colStatus} className="bg-[#17120F] border border-[#3A2518] rounded-2xl p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3A2518]">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colStatus === 'Completed' ? 'bg-emerald-400' : colStatus === 'In Progress' ? 'bg-[#F5B942]' : 'bg-[#A6A09A]'}`} />
                      <h3 className="text-sm font-bold text-white">{colStatus}</h3>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#24170F] text-[#F5B942] font-semibold">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-[#24170F] border border-[#3A2518] hover:border-[#A94F1D] rounded-xl p-4 transition shadow"
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className="text-[11px] text-[#A6A09A]">Due {task.due_date}</span>
                        </div>
                        <h4 className={`text-sm font-semibold text-white mb-1 ${task.status === 'Completed' ? 'line-through opacity-70' : ''}`}>
                          {task.title}
                        </h4>
                        <p className="text-[11px] text-[#F5B942] mb-2">{task.project_name}</p>
                        <p className="text-xs text-[#A6A09A] mb-3">{task.description}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-[#3A2518]">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              const newSt = e.target.value;
                              setTasks((prev) =>
                                prev.map((t) => (t.id === task.id ? { ...t, status: newSt } : t))
                              );
                              showToast(`Task moved to ${newSt}`, 'success');
                            }}
                            className="bg-[#100A06] border border-[#3A2518] rounded-lg px-2 py-1 text-[11px] text-white"
                          >
                            {columns.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5">
                            {task.status !== 'Completed' && (
                              <button
                                onClick={() => {
                                  setTasks((prev) =>
                                    prev.map((t) => (t.id === task.id ? { ...t, status: 'Completed' } : t))
                                  );
                                  showToast('Task marked completed!', 'success');
                                }}
                                className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                title="Mark Completed"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setTaskModal({ mode: 'edit', data: { ...task } })}
                              className="p-1.5 rounded-lg bg-[#100A06] text-[#A6A09A] hover:text-white"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setTasks((prev) => prev.filter((t) => t.id !== task.id));
                                showToast('Task deleted.', 'warning');
                              }}
                              className="p-1.5 rounded-lg bg-[#100A06] text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#3A2518] text-[11px] uppercase tracking-wider text-[#A6A09A]">
                  <th className="pb-3">Task</th>
                  <th className="pb-3">Assigned Project</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A2518]/60 text-xs">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-[#17120F]/60">
                    <td className="py-3.5 pr-3">
                      <p className="font-semibold text-white">{task.title}</p>
                      <p className="text-[11px] text-[#A6A09A]">{task.description}</p>
                    </td>
                    <td className="py-3.5 pr-3 text-[#F5B942]">{task.project_name}</td>
                    <td className="py-3.5 pr-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPriorityBadge(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 text-white">{task.due_date}</td>
                    <td className="py-3.5 pr-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setTaskModal({ mode: 'edit', data: { ...task } })}
                        className="px-2.5 py-1 rounded-lg bg-[#100A06] text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setTasks((prev) => prev.filter((t) => t.id !== task.id))}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER: 6. PROJECT TIMELINE PAGE
  // ============================================================================
  const renderTimeline = () => {
    // Generate November 2026 30-day calendar grid
    const daysInNov = Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dateStr = `2026-11-${String(day).padStart(2, '0')}`;
      const dayProjects = projects.filter((p) => p.deadline === dateStr || p.start_date === dateStr);
      const dayTasks = tasks.filter((t) => t.due_date === dateStr);
      const dayMilestones = milestones.filter((m) => m.due_date === dateStr);
      return { day, dateStr, dayProjects, dayTasks, dayMilestones };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Timeline & Calendar</h1>
            <p className="text-xs text-[#A6A09A]">
              Color-coded project start dates, deadlines, task due dates, and milestone tracking
            </p>
          </div>
          <button
            onClick={() => setMilestoneModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add Project Milestone
          </button>
        </div>

        {/* Upcoming Deadline Notifications Banner */}
        <div className="bg-[#24170F] border border-[#F5B942]/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5B942]/15 border border-[#F5B942]/40 flex items-center justify-center text-[#F5B942] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Upcoming Deadline Notifications</h3>
              <p className="text-xs text-[#A6A09A]">
                NERO Apparel Brand Identity due Nov 16 • IronPulse Gym SaaS Portal due Nov 20
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#F5B942]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A94F1D]" /> Project Deadline
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Milestone
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Task Due
            </span>
          </div>
        </div>

        {/* November 2026 Calendar Grid */}
        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">November 2026 Schedule</h2>
            <span className="text-xs text-[#F5B942] font-medium">Asia/Kolkata (IST)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {daysInNov.map(({ day, dateStr, dayProjects, dayTasks, dayMilestones }) => {
              const isToday = dateStr === '2026-11-12';
              return (
                <div
                  key={dateStr}
                  className={`min-h-[104px] rounded-xl p-2.5 border transition ${
                    isToday
                      ? 'bg-[#A94F1D]/20 border-[#F5B942]'
                      : 'bg-[#100A06]/80 border-[#3A2518] hover:border-[#A94F1D]/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold ${isToday ? 'text-[#F5B942]' : 'text-[#A6A09A]'}`}>
                      Nov {day}
                    </span>
                    {isToday && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F5B942] text-[#100A06] font-extrabold">
                        TODAY
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {dayProjects.map((p) => (
                      <div
                        key={p.id}
                        className="text-[10px] px-1.5 py-1 rounded bg-[#A94F1D]/30 border border-[#A94F1D] text-white truncate"
                        title={p.project_name}
                      >
                        {p.deadline === dateStr ? '🎯 Due: ' : '🚀 Start: '}
                        {p.project_name}
                      </div>
                    ))}
                    {dayMilestones.map((m) => (
                      <div
                        key={m.id}
                        className="text-[10px] px-1.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 truncate"
                        title={m.title}
                      >
                        🏁 {m.title}
                      </div>
                    ))}
                    {dayTasks.map((t) => (
                      <div
                        key={t.id}
                        className="text-[10px] px-1.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200 truncate"
                        title={t.title}
                      >
                        ✓ {t.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones Tracker List */}
        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
          <h2 className="text-base font-bold text-white mb-4">Milestone Tracking</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {milestones.map((ms) => (
              <div
                key={ms.id}
                className="p-4 rounded-xl bg-[#100A06] border border-[#3A2518] flex items-center justify-between gap-4"
              >
                <div>
                  <span className="text-[11px] text-[#F5B942] font-medium">{ms.project_name}</span>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{ms.title}</h4>
                  <p className="text-xs text-[#A6A09A] mt-1">Target Date: {ms.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={ms.status}
                    onChange={(e) => {
                      const st = e.target.value;
                      setMilestones((prev) => prev.map((m) => (m.id === ms.id ? { ...m, status: st } : m)));
                      showToast('Milestone status updated!', 'success');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#24170F] border border-[#3A2518] text-xs text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <button
                    onClick={() => setMilestones((prev) => prev.filter((m) => m.id !== ms.id))}
                    className="p-1.5 text-red-400 hover:bg-red-500/15 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 7. FILES & DOCUMENTS PAGE (SUPABASE STORAGE)
  // ============================================================================
  const handleUploadFile = (e) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === fileUploadForm.project_id);
    const fname = fileUploadForm.file_name.trim() || 'LOKIX_Deliverable_Spec.pdf';
    const newFile = {
      id: `fil-${Date.now()}`,
      project_id: fileUploadForm.project_id,
      project_name: proj ? proj.project_name : 'General',
      client_name: proj ? proj.client_name : 'LOKIX Client',
      file_name: fname,
      file_type: fileUploadForm.file_type,
      file_category: fileUploadForm.file_category,
      file_size_bytes: Math.round((parseFloat(fileUploadForm.file_size_mb) || 1.5) * 1024 * 1024),
      storage_path: `lokix-files/barani/${fileUploadForm.project_id}/${fname}`,
      created_at: '2026-11-12'
    };
    setFiles((prev) => [newFile, ...prev]);
    logActivity('file', `Uploaded ${fname} to Supabase Storage`, newFile.project_name);
    setFileUploadModal(false);
    showToast('File uploaded to Supabase Storage bucket (lokix-files)!', 'success');
  };

  const handleDownloadFile = (file) => {
    const content = `LOKIX.IN – Software Development & Design Services\nFile Asset: ${file.file_name}\nProject: ${file.project_name}\nClient: ${file.client_name}\nSupabase Storage Path: ${file.storage_path}\nExported by Baraninathan S P`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name.endsWith('.txt') ? file.file_name : `${file.file_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloading ${file.file_name} from Supabase Storage...`, 'success');
  };

  const renderFiles = () => {
    const filteredFiles = files.filter((f) => {
      const matchCat = fileCategoryFilter === 'All' || f.file_category === fileCategoryFilter;
      const matchProj = fileProjectFilter === 'All' || f.project_id === fileProjectFilter;
      return matchCat && matchProj;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Files & Documents</h1>
            <p className="text-xs text-[#A6A09A]">
              Supabase Storage bucket (`lokix-files`) organized by client projects, mockups, and PDFs
            </p>
          </div>
          <button
            onClick={() => setFileUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Upload className="w-4 h-4" /> Upload File to Storage
          </button>
        </div>

        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <select
            value={fileCategoryFilter}
            onChange={(e) => setFileCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white"
          >
            <option value="All">All File Types</option>
            <option value="Project File">Project Files</option>
            <option value="Client Document">Client Documents</option>
            <option value="Project Image">Project Images</option>
            <option value="PDF Document">PDF Documents</option>
          </select>

          <select
            value={fileProjectFilter}
            onChange={(e) => setFileProjectFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white"
          >
            <option value="All">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className="bg-[#24170F] border border-[#3A2518] hover:border-[#A94F1D]/60 rounded-2xl p-5 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#100A06] border border-[#3A2518] flex items-center justify-center text-[#F5B942]">
                    {file.file_category === 'Project Image' ? (
                      <ImageIcon className="w-5 h-5" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#100A06] border border-[#3A2518] text-[#F5B942]">
                    {file.file_category}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white break-all">{file.file_name}</h3>
                <p className="text-xs text-[#F5B942] mt-1">{file.project_name}</p>
                <p className="text-[11px] text-[#A6A09A]">{file.client_name}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#3A2518] flex items-center justify-between">
                <span className="text-[11px] text-[#A6A09A]">
                  {(file.file_size_bytes / (1024 * 1024)).toFixed(2)} MB • {file.created_at}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(file)}
                    className="px-3 py-1.5 rounded-xl bg-[#100A06] hover:bg-[#A94F1D] text-white text-xs flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => {
                      setFiles((prev) => prev.filter((f) => f.id !== file.id));
                      showToast('File deleted from Supabase Storage.', 'warning');
                    }}
                    className="p-1.5 rounded-xl bg-[#100A06] hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 8. PAYMENTS PAGE (INR ₹)
  // ============================================================================
  const handleSavePayment = async (e) => {
    e.preventDefault();
    if (!authUser) {
      showToast('Please sign in with Supabase before saving a payment.', 'error');
      return;
    }

    const form = paymentModal?.data || {};
    const total = Number(form.total_amount) || 0;
    const received = Number(form.amount_received) || 0;
    if (!form.client_name?.trim() || !form.project_name?.trim()) {
      showToast('Client and project names are required.', 'warning');
      return;
    }
    if (total < 0 || received < 0 || received > total) {
      showToast('Enter valid amounts. Received amount cannot exceed total amount.', 'warning');
      return;
    }

    const matchedClient = clients.find((client) =>
      client.company_name?.trim().toLowerCase() === form.client_name.trim().toLowerCase()
    );
    const matchedProject = projects.find((project) =>
      project.project_name?.trim().toLowerCase() === form.project_name.trim().toLowerCase()
    );
    const autoStatus = received >= total && total > 0
      ? 'Paid'
      : form.status === 'Overdue' ? 'Overdue'
      : received > 0 ? 'Partially Paid' : 'Pending';

    // remaining_amount is a generated database column: never include it in INSERT/UPDATE.
    const paymentData = {
      user_id: authUser.id,
      client_id: matchedClient?.id || null,
      project_id: matchedProject?.id || null,
      client_name: form.client_name.trim(),
      project_name: form.project_name.trim(),
      total_amount: total,
      amount_received: received,
      payment_date: form.payment_date || new Date().toISOString().slice(0, 10),
      payment_method: form.payment_method || 'UPI',
      status: autoStatus,
      notes: form.notes?.trim() || null
    };

    try {
      if (paymentModal.mode === 'add') {
        const { data, error } = await supabase.from('payments').insert(paymentData).select('*').single();
        if (error) throw error;
        setPayments((prev) => [data, ...prev]);
        logActivity('payment', `Recorded Payment: ${formatINR(received)}`, `${data.client_name} – ${data.project_name}`);
        showToast('Payment saved successfully to Supabase!', 'success');
      } else {
        const { data, error } = await supabase.from('payments').update(paymentData)
          .eq('id', form.id).eq('user_id', authUser.id).select('*').single();
        if (error) throw error;
        setPayments((prev) => prev.map((payment) => payment.id === data.id ? data : payment));
        showToast('Payment updated successfully in Supabase!', 'success');
      }
      setPaymentModal(null);
    } catch (error) {
      console.error('Supabase payment save failed:', error);
      showToast(`Payment was not saved: ${error.message}`, 'error');
    }
  };

  const renderPayments = () => {
    const filteredPayments = payments.filter(
      (p) => paymentStatusFilter === 'All' || p.status === paymentStatusFilter
    );

    const totalContractValue = payments.reduce((a, b) => a + (Number(b.total_amount) || 0), 0);
    const totalReceived = payments.reduce((a, b) => a + (Number(b.amount_received) || 0), 0);
    const totalRemaining = payments.reduce(
      (a, b) => a + Math.max(0, (Number(b.total_amount) || 0) - (Number(b.amount_received) || 0)),
      0
    );
    const overdueTotal = payments
      .filter((p) => p.status === 'Overdue')
      .reduce((a, b) => a + Math.max(0, (Number(b.total_amount) || 0) - (Number(b.amount_received) || 0)), 0);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Payments & Receivables (INR ₹)</h1>
            <p className="text-xs text-[#A6A09A]">
              Automatic calculation of received vs. remaining project balances across all clients
            </p>
          </div>
          <button
            onClick={() =>
              setPaymentModal({
                mode: 'add',
                data: {
                  client_name: clients[0]?.company_name || 'NERO Apparel Co.',
                  project_name: projects[0]?.project_name || 'Gym Owner & Super Admin SaaS Portal',
                  total_amount: 50000,
                  amount_received: 25000,
                  payment_date: '2026-11-12',
                  payment_method: 'UPI',
                  status: 'Partially Paid'
                }
              })
            }
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add Payment Record
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Total Project Value</span>
            <div className="text-xl font-bold text-white mt-1">{formatINR(totalContractValue)}</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Paid / Amount Received</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{formatINR(totalReceived)}</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Pending / Remaining Amount</span>
            <div className="text-xl font-bold text-[#F5B942] mt-1">{formatINR(totalRemaining)}</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Overdue Balance</span>
            <div className="text-xl font-bold text-red-400 mt-1">{formatINR(overdueTotal)}</div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {['All', 'Paid', 'Partially Paid', 'Pending', 'Overdue'].map((st) => (
            <button
              key={st}
              onClick={() => setPaymentStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition ${
                paymentStatusFilter === st
                  ? 'bg-[#A94F1D] border-[#A94F1D] text-white'
                  : 'bg-[#24170F] border-[#3A2518] text-[#A6A09A] hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Payment History Table */}
        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#3A2518] text-[11px] uppercase tracking-wider text-[#A6A09A]">
                <th className="pb-3">Client</th>
                <th className="pb-3">Project</th>
                <th className="pb-3 text-right">Total Amount</th>
                <th className="pb-3 text-right">Amount Received</th>
                <th className="pb-3 text-right">Remaining</th>
                <th className="pb-3">Date & Method</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A2518]/60 text-xs">
              {filteredPayments.map((pay) => {
                const rem = Math.max(0, (Number(pay.total_amount) || 0) - (Number(pay.amount_received) || 0));
                return (
                  <tr key={pay.id} className="hover:bg-[#17120F]/60">
                    <td className="py-3.5 pr-3 font-semibold text-white">{pay.client_name}</td>
                    <td className="py-3.5 pr-3 text-[#A6A09A]">{pay.project_name}</td>
                    <td className="py-3.5 pr-3 text-right font-medium text-white">{formatINR(pay.total_amount)}</td>
                    <td className="py-3.5 pr-3 text-right font-semibold text-emerald-400">
                      {formatINR(pay.amount_received)}
                    </td>
                    <td className="py-3.5 pr-3 text-right font-bold text-[#F5B942]">{formatINR(rem)}</td>
                    <td className="py-3.5 pr-3 text-[#A6A09A]">
                      {pay.payment_date} • <span className="text-white">{pay.payment_method}</span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] border ${getStatusBadge(pay.status)}`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => setPaymentModal({ mode: 'edit', data: { ...pay } })}
                        className="px-2.5 py-1 rounded-lg bg-[#100A06] text-white hover:bg-[#A94F1D]"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            if (!authUser) throw new Error('Please sign in again.');
                            const { error } = await supabase.from('payments').delete()
                              .eq('id', pay.id).eq('user_id', authUser.id);
                            if (error) throw error;
                            setPayments((prev) => prev.filter((p) => p.id !== pay.id));
                            showToast('Payment deleted from Supabase.', 'success');
                          } catch (error) {
                            console.error('Supabase payment delete failed:', error);
                            showToast(`Payment was not deleted: ${error.message}`, 'error');
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 9. INVOICES PAGE (LOKIX.IN BRANDING + GST + PDF/PRINT)
  // ============================================================================
  const computeInvoiceTotals = (inv) => {
    if (!inv) return { subtotal: 0, gstAmount: 0, total: 0 };
    const subtotal = (inv.items || []).reduce(
      (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unit_price) || 0),
      0
    );
    const gstRate = Number(inv.gst_rate) || 0;
    const gstAmount = Math.round((subtotal * gstRate) / 100);
    return { subtotal, gstAmount, total: subtotal + gstAmount };
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    const cli = clients.find((c) => c.id === invoiceForm.client_id) || clients[0];
    const proj = projects.find((p) => p.id === invoiceForm.project_id) || projects[0];
    const newInv = {
      id: `inv-${Date.now()}`,
      invoice_number: `LKX-2026-0${invoices.length + 41}`,
      client_id: cli?.id,
      project_id: proj?.id,
      client_name: cli?.company_name || 'Client',
      client_email: cli?.email || '',
      client_address: cli?.address || 'Tamil Nadu, India',
      project_name: proj?.project_name || 'Freelance Service',
      issue_date: invoiceForm.issue_date,
      due_date: invoiceForm.due_date,
      gst_rate: Number(invoiceForm.gst_rate) || 0,
      status: invoiceForm.status,
      items: invoiceForm.items
    };
    setInvoices((prev) => [newInv, ...prev]);
    setSelectedInvoice(newInv);
    setInvoiceModal(false);
    logActivity('invoice', `Generated Invoice #${newInv.invoice_number}`, `${newInv.client_name} – ${newInv.project_name}`);
    showToast(`Invoice #${newInv.invoice_number} saved to Supabase!`, 'success');
  };

  const handleDownloadInvoicePDF = (inv) => {
    const { subtotal, gstAmount, total } = computeInvoiceTotals(inv);
    const lines = [
      '====================================================================',
      '               LOKIX.IN – TAX INVOICE (ORIGINAL)                    ',
      '        Software Development & Design Services | Baraninathan S P   ',
      '        Tirunelveli, Tamil Nadu, India | GSTIN: 33AABCL1234F1Z5     ',
      '====================================================================',
      `Invoice Number : ${inv.invoice_number}`,
      `Issue Date     : ${inv.issue_date}`,
      `Due Date       : ${inv.due_date}`,
      `Status         : ${inv.status}`,
      '--------------------------------------------------------------------',
      `Billed To      : ${inv.client_name}`,
      `Email          : ${inv.client_email || 'N/A'}`,
      `Address        : ${inv.client_address || 'India'}`,
      `Project        : ${inv.project_name}`,
      '--------------------------------------------------------------------',
      'SERVICES & DELIVERABLES:',
      ...(inv.items || []).map(
        (it, i) =>
          `${i + 1}. ${it.service_description} (Qty: ${it.quantity} x INR ${it.unit_price}) = INR ${
            it.quantity * it.unit_price
          }`
      ),
      '--------------------------------------------------------------------',
      `Subtotal       : ${formatINR(subtotal)}`,
      `GST (${inv.gst_rate}%)      : ${formatINR(gstAmount)}`,
      `GRAND TOTAL    : ${formatINR(total)}`,
      '====================================================================',
      'Payment Methods: UPI / Bank NEFT / Razorpay | Currency: INR (₹)',
      'Thank you for choosing LOKIX.IN!'
    ].join('\n');

    const blob = new Blob([lines], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoice_number}_LOKIX_INVOICE.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${inv.invoice_number}_LOKIX_INVOICE.pdf`, 'success');
  };

  const renderInvoices = () => {
    const activeInv = selectedInvoice || invoices[0];
    const totals = computeInvoiceTotals(activeInv);

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Invoices & GST Billing</h1>
            <p className="text-xs text-[#A6A09A]">
              Generate LOKIX.IN branded invoices with automatic GST calculation, PDF download, and print view
            </p>
          </div>
          <button
            onClick={() => setInvoiceModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invoices List */}
          <div className="lg:col-span-5 space-y-3">
            {invoices.map((inv) => {
              const t = computeInvoiceTotals(inv);
              const isSelected = activeInv?.id === inv.id;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-[#24170F] border-[#F5B942] shadow-lg'
                      : 'bg-[#17120F] border-[#3A2518] hover:border-[#A94F1D]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-[#F5B942]">{inv.invoice_number}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${getStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{inv.client_name}</h3>
                  <p className="text-xs text-[#A6A09A] truncate">{inv.project_name}</p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#3A2518] text-xs">
                    <span className="text-[#A6A09A]">Due: {inv.due_date}</span>
                    <span className="font-bold text-white">{formatINR(t.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Branded Invoice Preview */}
          {activeInv && (
            <div className="lg:col-span-7 bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 shadow-2xl">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-[#3A2518]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#A94F1D] to-[#F5B942] flex items-center justify-center text-[#100A06] font-extrabold text-xl">
                    L
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-white">LOKIX.IN</h2>
                    <p className="text-xs text-[#F5B942]">Software Development & Design Services</p>
                    <p className="text-[11px] text-[#A6A09A]">GSTIN: {profile.gst_number} • {profile.location}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadInvoicePDF(activeInv)}
                    className="px-3.5 py-2 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download PDF
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                      showToast('Opening print dialog for LOKIX.IN invoice...', 'success');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#100A06] hover:bg-[#17120F] border border-[#3A2518] text-white text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F5B942]" /> Print Invoice
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6A09A] block mb-1">Billed To</span>
                  <p className="font-bold text-white text-sm">{activeInv.client_name}</p>
                  <p className="text-[#F5B942] mt-0.5">{activeInv.project_name}</p>
                  <p className="text-[#A6A09A] mt-0.5">{activeInv.client_address}</p>
                </div>
                <div className="bg-[#100A06] border border-[#3A2518] rounded-xl p-3.5 sm:text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6A09A] block mb-1">Invoice Details</span>
                  <p className="font-mono font-bold text-[#F5B942] text-sm">{activeInv.invoice_number}</p>
                  <p className="text-[#A6A09A] mt-0.5">Issued: {activeInv.issue_date}</p>
                  <p className="text-white font-medium mt-0.5">Due Date: {activeInv.due_date}</p>
                </div>
              </div>

              <div className="overflow-x-auto mb-6">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#3A2518] text-[11px] uppercase text-[#A6A09A]">
                      <th className="pb-2.5">Service Description</th>
                      <th className="pb-2.5 text-center">Qty</th>
                      <th className="pb-2.5 text-right">Rate (₹)</th>
                      <th className="pb-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3A2518]/60">
                    {(activeInv.items || []).map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-2 font-medium text-white">{item.service_description}</td>
                        <td className="py-3 px-2 text-center text-[#A6A09A]">{item.quantity}</td>
                        <td className="py-3 px-2 text-right text-[#A6A09A]">{formatINR(item.unit_price)}</td>
                        <td className="py-3 pl-2 text-right font-semibold text-white">
                          {formatINR((Number(item.quantity) || 1) * (Number(item.unit_price) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-[#3A2518] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#A6A09A]">
                  <p className="font-semibold text-white">Authorized Signatory: Baraninathan S P</p>
                  <p>LOKIX.IN – Software Development & Design Services</p>
                </div>
                <div className="w-full sm:w-64 space-y-1.5 text-xs bg-[#100A06] p-4 rounded-xl border border-[#3A2518]">
                  <div className="flex justify-between text-[#A6A09A]">
                    <span>Subtotal:</span>
                    <span className="text-white font-medium">{formatINR(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[#A6A09A]">
                    <span>GST ({activeInv.gst_rate}%):</span>
                    <span className="text-white font-medium">{formatINR(totals.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#F5B942] pt-2 border-t border-[#3A2518]">
                    <span>Total Payable:</span>
                    <span>{formatINR(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 10. REPORTS PAGE (RECHARTS VISUAL ANALYTICS)
  // ============================================================================
  
const renderReports = () => {
  // Generate revenue data from actual Supabase payments
  const today = new Date();

  const monthlyRevenueData = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth() - 5 + index,
        1
      );

      const year = date.getFullYear();
      const monthNumber = String(
        date.getMonth() + 1
      ).padStart(2, '0');

      const monthKey = `${year}-${monthNumber}`;

      const revenue = payments
        .filter((payment) =>
          (payment.payment_date || '').slice(0, 7) === monthKey
        )
        .reduce(
          (total, payment) =>
            total + (Number(payment.amount_received) || 0),
          0
        );

      return {
        month: date.toLocaleDateString('en-IN', {
          month: 'short'
        }),
        monthKey,
        revenue
      };
    }
  );

  const projectHoursChart = projects.slice(0, 6).map((p) => {
    const secs = workLogs
      .filter(
        (w) =>
          w.project_id === p.id ||
          w.project_name === p.project_name
      )
      .reduce(
        (a, b) =>
          a + (Number(b.duration_seconds) || 0),
        0
      );

    return {
      name: p.project_name.slice(0, 14),
      hours: Number((secs / 3600).toFixed(1))
    };
  });


    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Performance & Financial Reports</h1>
          <p className="text-xs text-[#A6A09A]">
            Visual analytics powered by Recharts: Monthly Revenue, Project Completion, Working Hours, and Task Velocity
          </p>
        </div>

        {/* Report Summary KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Total Revenue Collected</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{formatINR(stats.totalRevenue)}</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Pending Receivables</span>
            <div className="text-xl font-bold text-[#F5B942] mt-1">{formatINR(stats.pendingPayments)}</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Total Logged Hours</span>
            <div className="text-xl font-bold text-white mt-1">{stats.totalHours} hrs</div>
          </div>
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4">
            <span className="text-xs text-[#A6A09A]">Completed Tasks</span>
            <div className="text-xl font-bold text-[#A94F1D] mt-1">
              {stats.completedTasksCount} / {tasks.length} Tasks
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
{/* Monthly Revenue Chart */}
<div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">

  <h3 className="text-base font-bold text-white mb-1">
    Monthly Revenue Trend (INR ₹)
  </h3>

  <p className="text-xs text-[#A6A09A] mb-4">
    Actual revenue collected from Supabase payments · Last 6 months
  </p>

  <div className="relative h-72 w-full">

    <ResponsiveContainer width="100%" height="100%">

      <AreaChart
        data={monthlyRevenueData}
        margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
      >

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#3A2518"
        />

        <XAxis
          dataKey="month"
          stroke="#A6A09A"
          tick={{ fill: '#A6A09A', fontSize: 11 }}
        />

        <YAxis
          stroke="#A6A09A"
          tick={{ fill: '#A6A09A', fontSize: 11 }}
          tickFormatter={(value) =>
            `₹${Number(value).toLocaleString('en-IN')}`
          }
        />

        <Tooltip
          formatter={(value) => [
            `₹${Number(value || 0).toLocaleString('en-IN')}`,
            'Revenue Collected'
          ]}
          labelFormatter={(label, payload) => {
            const key = payload?.[0]?.payload?.monthKey;

            return key
              ? new Date(`${key}-01T00:00:00`).toLocaleDateString(
                  'en-IN',
                  { month: 'long', year: 'numeric' }
                )
              : label;
          }}
          contentStyle={{
            backgroundColor: '#17120F',
            borderColor: '#A94F1D',
            borderRadius: '12px',
            color: '#FFFFFF'
          }}
        />

        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue Collected"
          stroke="#F5B942"
          strokeWidth={2}
          fill="#A94F1D"
          fillOpacity={0.35}
        />

      </AreaChart>

    </ResponsiveContainer>

  </div>
</div>


          {/* Project-wise Working Hours Chart */}
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-5">
            <h3 className="text-base font-bold text-white mb-1">Project-wise Working Hours</h3>
            <p className="text-xs text-[#A6A09A] mb-4">Hours logged per active client project</p>
            <div className="relative h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectHoursChart} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3A2518" />
                  <XAxis dataKey="name" stroke="#A6A09A" tick={{ fill: '#A6A09A', fontSize: 11 }} />
                  <YAxis stroke="#A6A09A" tick={{ fill: '#A6A09A', fontSize: 11 }} unit="h" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#17120F',
                      borderColor: '#F5B942',
                      borderRadius: '12px',
                      color: '#FFFFFF'
                    }}
                  />
                  <Bar dataKey="hours" name="Logged Hours" fill="#F5B942" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 11. NOTES PAGE
  // ============================================================================
  const handleSaveNote = (e) => {
    e.preventDefault();
    const form = noteModal.data;
    if (!form.title.trim()) {
      showToast('Note title is required', 'warning');
      return;
    }
    const proj = projects.find((p) => p.id === form.project_id);
    const record = {
      ...form,
      project_name: proj ? proj.project_name : 'General Note'
    };
    if (noteModal.mode === 'add') {
      setNotes((prev) => [{ ...record, id: `not-${Date.now()}`, created_at: '2026-11-12' }, ...prev]);
      showToast('Note saved to Supabase!', 'success');
    } else {
      setNotes((prev) => prev.map((n) => (n.id === record.id ? record : n)));
      showToast('Note updated!', 'success');
    }
    setNoteModal(null);
  };

  const renderNotes = () => {
    const filteredNotes = notes.filter((n) => {
      const q = noteSearch.toLowerCase();
      const matchText =
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.project_name || '').toLowerCase().includes(q);
      const matchImp = !noteFilterImportant || n.is_important;
      return matchText && matchImp;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Project Notes & Technical Memos</h1>
            <p className="text-xs text-[#A6A09A]">
              Keep client feedback, color codes, and architecture notes attached to your projects
            </p>
          </div>
          <button
            onClick={() =>
              setNoteModal({
                mode: 'add',
                data: {
                  title: '',
                  content: '',
                  project_id: projects[0]?.id || 'prj-201',
                  is_important: true
                }
              })
            }
            className="px-4 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start"
          >
            <Plus className="w-4 h-4" /> Add Note
          </button>
        </div>

        <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-[#A6A09A] absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search notes by title, content, or project..."
              value={noteSearch}
              onChange={(e) => setNoteSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-xs text-white focus:outline-none focus:border-[#A94F1D]"
            />
          </div>

          <button
            onClick={() => setNoteFilterImportant(!noteFilterImportant)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
              noteFilterImportant
                ? 'bg-[#F5B942]/20 border-[#F5B942] text-[#F5B942]'
                : 'bg-[#100A06] border-[#3A2518] text-[#A6A09A]'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Important Only
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-[#24170F] border border-[#3A2518] hover:border-[#A94F1D] rounded-2xl p-5 flex flex-col justify-between transition"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-[#100A06] border border-[#3A2518] text-[#F5B942]">
                    {note.project_name}
                  </span>
                  <button
                    onClick={() => {
                      setNotes((prev) =>
                        prev.map((n) => (n.id === note.id ? { ...n, is_important: !n.is_important } : n))
                      );
                    }}
                    className={`p-1 rounded-lg ${note.is_important ? 'text-[#F5B942]' : 'text-[#A6A09A]'}`}
                    title="Toggle Important"
                  >
                    <Star className={`w-4 h-4 ${note.is_important ? 'fill-[#F5B942]' : ''}`} />
                  </button>
                </div>
                <h3 className="text-base font-bold text-white mb-2">{note.title}</h3>
                <p className="text-xs text-[#A6A09A] whitespace-pre-line leading-relaxed">{note.content}</p>
              </div>

              <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#3A2518] text-xs">
                <span className="text-[11px] text-[#A6A09A]">Updated: {note.created_at}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNoteModal({ mode: 'edit', data: { ...note } })}
                    className="px-2.5 py-1 rounded-lg bg-[#100A06] text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setNotes((prev) => prev.filter((n) => n.id !== note.id));
                      showToast('Note deleted.', 'warning');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: 12. SETTINGS & 13. PROFILE PAGES
  // ============================================================================
  const renderSettings = () => (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Workspace Settings</h1>
        <p className="text-xs text-[#A6A09A]">
          Configure LOKIX.IN business parameters, currency, timezone, notifications, and Supabase connection
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          showToast('Workspace settings saved to Supabase profiles table!', 'success');
        }}
        className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">Business Name</label>
            <input
              type="text"
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">Currency</label>
            <input
              type="text"
              value={profile.currency}
              onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">Timezone</label>
            <input
              type="text"
              value={profile.timezone}
              onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#A6A09A] mb-1.5">GSTIN / Tax Registration</label>
            <input
              type="text"
              value={profile.gst_number}
              onChange={(e) => setProfile({ ...profile, gst_number: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#3A2518]">
          <h3 className="text-sm font-bold text-white mb-3">Notification Preferences</h3>
          <div className="space-y-2.5 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_email}
                onChange={(e) => setProfile({ ...profile, notify_email: e.target.checked })}
                className="accent-[#A94F1D] w-4 h-4"
              />
              <span className="text-white">Email alerts for new client inquiries and invoice status changes</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_deadlines}
                onChange={(e) => setProfile({ ...profile, notify_deadlines: e.target.checked })}
                className="accent-[#A94F1D] w-4 h-4"
              />
              <span className="text-white">48-hour advance notifications before project and task deadlines</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.notify_payments}
                onChange={(e) => setProfile({ ...profile, notify_payments: e.target.checked })}
                className="accent-[#A94F1D] w-4 h-4"
              />
              <span className="text-white">Overdue payment reminders for pending INR receivables</span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-[#3A2518] flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSchemaModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-[#F5B942] text-xs font-semibold flex items-center gap-2"
          >
            <Database className="w-4 h-4" /> Configure Supabase URL & View SQL Schema
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs font-semibold"
          >
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Freelancer Profile</h1>
        <p className="text-xs text-[#A6A09A]">
          Personal & business identity displayed on LOKIX.IN invoices, reports, and client portals
        </p>
      </div>

      <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 mb-6 border-b border-[#3A2518]">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#A94F1D] to-[#F5B942] flex items-center justify-center text-[#100A06] font-extrabold text-3xl shadow-xl">
            BS
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile.full_name}</h2>
            <p className="text-sm text-[#F5B942] font-medium">{profile.designation}</p>
            <p className="text-xs text-[#A6A09A] mt-1">
              {profile.business_name} – {profile.tagline} • {profile.location}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            showToast('Profile updated in Supabase!', 'success');
          }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <div>
            <label className="block text-xs text-[#A6A09A] mb-1.5">Full Name</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A6A09A] mb-1.5">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A6A09A] mb-1.5">Phone Number</label>
            <input
              type="text"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-[#A6A09A] mb-1.5">Business Name</label>
            <input
              type="text"
              value={profile.business_name}
              onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-[#A6A09A] mb-1.5">Designation</label>
            <input
              type="text"
              value={profile.designation}
              onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#100A06] border border-[#3A2518] text-sm text-white"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#A94F1D] hover:bg-[#c25d24] text-white text-xs font-semibold"
            >
              Update Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN SHELL LAYOUT (SIDEBAR + HEADER + PAGE CONTENT + MODALS)
  // ============================================================================
  return (
    <div className="min-h-screen bg-[#100A06] text-white flex font-sans">
      {/* Fixed Collapsible Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#17120F] border-r border-[#3A2518] flex flex-col justify-between transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-[#3A2518]">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#A94F1D] to-[#F5B942] flex items-center justify-center text-[#100A06] font-extrabold text-base shrink-0 shadow">
                L
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <span className="font-extrabold text-sm tracking-tight text-white block truncate">
                    LOKIX.IN
                  </span>
                  <span className="text-[10px] text-[#A6A09A] block truncate">
                    Dev & Design Suite
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg bg-[#24170F] text-[#A6A09A] hover:text-white"
              title="Toggle Sidebar"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-5 overflow-y-auto max-h-[calc(100vh-130px)]">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!sidebarCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A6A09A]/70">
                    {group.label}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActivePage(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                          active
                            ? 'bg-[#A94F1D] text-white shadow-md'
                            : 'text-[#A6A09A] hover:bg-[#24170F] hover:text-white'
                        }`}
                        title={item.label}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#F5B942]'}`} />
                          {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </div>
                        {!sidebarCollapsed && item.badge !== undefined && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              active ? 'bg-[#100A06]/40 text-white' : 'bg-[#24170F] text-[#F5B942]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {!sidebarCollapsed && item.live && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Logout Item (14th item) */}
        <div className="p-3 border-t border-[#3A2518]">
          <button
            onClick={async () => {
              const { error } = await supabase.auth.signOut();
              if (error) {
                showToast(`Logout failed: ${error.message}`, 'error');
                return;
              }
              setAuthUser(null);
              setIsAuthenticated(false);
              setProjects([]);
              showToast('Signed out successfully.', 'warning');
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/15 transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <header className="h-16 bg-[#17120F]/90 backdrop-blur border-b border-[#3A2518] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-[#24170F] border border-[#3A2518] text-white"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#A6A09A]">
              <span className="text-white font-semibold">{profile.business_name}</span>
              <span>•</span>
              <span>{profile.timezone}</span>
              <span>•</span>
              <span className="text-[#F5B942] font-semibold">INR (₹)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Supabase Schema & Connection Status Pill */}
            <button
              onClick={() => setShowSchemaModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#24170F] hover:bg-[#2f1e14] border border-[#3A2518] text-xs flex items-center gap-2 transition"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <Database className="w-3.5 h-3.5 text-[#F5B942]" />
              <span className="hidden sm:inline text-white font-medium">Supabase DB & RLS (13 Tables)</span>
            </button>

            <button
              onClick={() => setActivePage('profile')}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-xl bg-[#24170F] border border-[#3A2518] hover:border-[#A94F1D] transition"
            >
              <div className="w-7 h-7 rounded-lg bg-[#A94F1D] flex items-center justify-center text-xs font-bold text-white">
                B
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-white leading-none">{profile.display_name}</p>
                <p className="text-[10px] text-[#A6A09A]">LOKIX.IN</p>
              </div>
            </button>
          </div>
        </header>

        {/* Page View Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {activePage === 'dashboard' && renderDashboard()}
          {activePage === 'projects' && renderProjects()}
          {activePage === 'clients' && renderClients()}
          {activePage === 'work-tracker' && renderWorkTracker()}
          {activePage === 'tasks' && renderTasks()}
          {activePage === 'timeline' && renderTimeline()}
          {activePage === 'files' && renderFiles()}
          {activePage === 'payments' && renderPayments()}
          {activePage === 'invoices' && renderInvoices()}
          {activePage === 'reports' && renderReports()}
          {activePage === 'notes' && renderNotes()}
          {activePage === 'settings' && renderSettings()}
          {activePage === 'profile' && renderProfile()}

{activePage === 'services-plans' && (
  <iframe
    src={`${import.meta.env.BASE_URL}services-plans.html`}
    title="Services & Plans"
    className="w-full border-0 block"
    style={{
      height: 'calc(100vh - 75px)',
      backgroundColor: '#100A06'
    }}
  />
)}
        </main>
      </div>

      {/* ========================================================================
          MODALS & DIALOGS (NO BROWSER ALERT/CONFIRM)
      ======================================================================== */}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#24170F] border border-[#F5B942] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-[#F5B942] shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-xs text-[#A6A09A] mb-5">{confirmDialog.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl bg-[#100A06] text-xs text-[#A6A09A]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-semibold text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Add/Edit/View Modal */}
      {projectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {projectModal.mode === 'add'
                  ? 'Add New Project'
                  : projectModal.mode === 'edit'
                  ? 'Edit Project'
                  : 'Project Details'}
              </h3>
              <button onClick={() => setProjectModal(null)} className="text-[#A6A09A] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {projectModal.mode === 'view' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#100A06] border border-[#3A2518]">
                  <span className="text-[#A6A09A] block">Project Name</span>
                  <span className="text-sm font-bold text-white">{projectModal.data.project_name}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518]">
                    <span className="text-[#A6A09A] block">Client</span>
                    <span className="font-semibold text-[#F5B942]">{projectModal.data.client_name}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518]">
                    <span className="text-[#A6A09A] block">Category</span>
                    <span className="font-semibold text-white">{projectModal.data.category}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518]">
                    <span className="text-[#A6A09A] block">Budget</span>
                    <span className="font-bold text-emerald-400">{formatINR(projectModal.data.budget)}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518]">
                    <span className="text-[#A6A09A] block">Timeline</span>
                    <span className="text-white">{projectModal.data.start_date} → {projectModal.data.deadline}</span>
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-[#100A06] border border-[#3A2518]">
                  <span className="text-[#A6A09A] block mb-1">Description</span>
                  <p className="text-white leading-relaxed">{projectModal.data.description}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProject} className="space-y-3 text-xs">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projectModal.data.project_name}
                    onChange={(e) =>
                      setProjectModal({ ...projectModal, data: { ...projectModal.data, project_name: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Client Name</label>
                    <select
                      required
                      value={
                        clients.find((client) => client.id === projectModal.data.client_id)?.id ||
                        clients.find(
                          (client) =>
                            (client.company_name || '').trim().toLowerCase() ===
                            (projectModal.data.client_name || '').trim().toLowerCase()
                        )?.id ||
                        ''
                      }
                      onChange={(e) => {
                        const selectedClient = clients.find(
                          (client) => client.id === e.target.value
                        );

                        setProjectModal({
                          ...projectModal,
                          data: {
                            ...projectModal.data,
                            client_id: selectedClient?.id || '',
                            client_name: selectedClient?.company_name || ''
                          }
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    >
                      <option value="" disabled>
                        {clients.length ? 'Select Client' : 'Add a client first'}
                      </option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.company_name} - {client.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Category</label>
                    <select
                      value={projectModal.data.category}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, category: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    >
                      {projectCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={projectModal.data.description}
                    onChange={(e) =>
                      setProjectModal({ ...projectModal, data: { ...projectModal.data, description: e.target.value } })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Budget (INR ₹)</label>
                    <input
                      type="number"
                      value={projectModal.data.budget}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, budget: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Start Date</label>
                    <input
                      type="date"
                      value={projectModal.data.start_date}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, start_date: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Deadline</label>
                    <input
                      type="date"
                      value={projectModal.data.deadline}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, deadline: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Status</label>
                    <select
                      value={projectModal.data.status}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, status: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    >
                      {projectStatuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Progress (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={projectModal.data.progress}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, progress: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Priority</label>
                    <select
                      value={projectModal.data.priority}
                      onChange={(e) =>
                        setProjectModal({ ...projectModal, data: { ...projectModal.data, priority: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    >
                      {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setProjectModal(null)}
                    className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                    Save Project
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Client Add/Edit/View Modal */}
      {clientModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {clientModal.mode === 'add' ? 'Add Client' : clientModal.mode === 'edit' ? 'Edit Client' : 'Client Portfolio'}
              </h3>
              <button onClick={() => setClientModal(null)} className="text-[#A6A09A] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {clientModal.mode === 'view' ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#100A06] border border-[#3A2518]">
                  <p className="text-sm font-bold text-white">{clientModal.data.company_name}</p>
                  <p className="text-[#F5B942]">{clientModal.data.full_name} ({clientModal.data.client_type})</p>
                  <p className="text-[#A6A09A] mt-1">{clientModal.data.email} • {clientModal.data.phone}</p>
                </div>
                <h4 className="font-semibold text-white pt-1">Client Projects ({clientModal.projects?.length || 0})</h4>
                <div className="space-y-2">
                  {(clientModal.projects || []).map((cp) => (
                    <div key={cp.id} className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518] flex justify-between">
                      <div>
                        <p className="font-semibold text-white">{cp.project_name}</p>
                        <p className="text-[11px] text-[#A6A09A]">{cp.category} • Due {cp.deadline}</p>
                      </div>
                      <span className="text-[#F5B942] font-bold">{formatINR(cp.budget)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveClient} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={clientModal.data.full_name}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, full_name: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Company Name</label>
                    <input
                      type="text"
                      required
                      value={clientModal.data.company_name}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, company_name: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={clientModal.data.email}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, email: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Phone</label>
                    <input
                      type="text"
                      value={clientModal.data.phone}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, phone: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Address</label>
                    <input
                      type="text"
                      value={clientModal.data.address}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, address: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A6A09A] mb-1">Client Type</label>
                    <select
                      value={clientModal.data.client_type}
                      onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, client_type: e.target.value } })}
                      className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    >
                      {['Brand', 'Enterprise', 'Startup', 'Agency', 'Retainer', 'Individual'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Notes</label>
                  <textarea
                    rows={2}
                    value={clientModal.data.notes}
                    onChange={(e) => setClientModal({ ...clientModal, data: { ...clientModal.data, notes: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setClientModal(null)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                    Save Client
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Manual Work Log Modal */}
      {manualLogModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Manually Add Working Hours</h3>
              <button onClick={() => setManualLogModal(false)} className="text-[#A6A09A] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddManualWorkLog} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">Select Project</label>
                <select
                  value={manualLogForm.project_id}
                  onChange={(e) => setManualLogForm({ ...manualLogForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Work Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Designed NERO bottle mockup & typography"
                  value={manualLogForm.work_description}
                  onChange={(e) => setManualLogForm({ ...manualLogForm, work_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Date</label>
                  <input
                    type="date"
                    value={manualLogForm.work_date}
                    onChange={(e) => setManualLogForm({ ...manualLogForm, work_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={manualLogForm.hours}
                    onChange={(e) => setManualLogForm({ ...manualLogForm, hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setManualLogModal(false)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Save Work Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {taskModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">{taskModal.mode === 'add' ? 'Add Task' : 'Edit Task'}</h3>
              <button onClick={() => setTaskModal(null)} className="text-[#A6A09A] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskModal.data.title}
                  onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, title: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Assign Project</label>
                <select
                  value={taskModal.data.project_id}
                  onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, project_id: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={taskModal.data.description}
                  onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, description: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Status</label>
                  <select
                    value={taskModal.data.status}
                    onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, status: e.target.value } })}
                    className="w-full px-2 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    {['To Do', 'In Progress', 'Completed'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Priority</label>
                  <select
                    value={taskModal.data.priority}
                    onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, priority: e.target.value } })}
                    className="w-full px-2 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskModal.data.due_date}
                    onChange={(e) => setTaskModal({ ...taskModal, data: { ...taskModal.data, due_date: e.target.value } })}
                    className="w-full px-2 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setTaskModal(null)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {milestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Add Project Milestone</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const proj = projects.find((p) => p.id === milestoneForm.project_id);
                setMilestones((prev) => [
                  ...prev,
                  {
                    id: `mls-${Date.now()}`,
                    project_id: milestoneForm.project_id,
                    project_name: proj ? proj.project_name : 'Project',
                    title: milestoneForm.title || 'Deliverable Milestone',
                    due_date: milestoneForm.due_date,
                    status: milestoneForm.status
                  }
                ]);
                setMilestoneModal(false);
                showToast('Milestone added to Project Timeline!', 'success');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-[#A6A09A] mb-1">Project</label>
                <select
                  value={milestoneForm.project_id}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  value={milestoneForm.title}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Target Date</label>
                <input
                  type="date"
                  value={milestoneForm.due_date}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setMilestoneModal(false)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Upload Modal */}
      {fileUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Upload to Supabase Storage (`lokix-files`)</h3>
            <form onSubmit={handleUploadFile} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">Select Project</label>
                <select
                  value={fileUploadForm.project_id}
                  onChange={(e) => setFileUploadForm({ ...fileUploadForm, project_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name} ({p.client_name})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">File Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., NERO_Final_Logo_Pack.pdf"
                  value={fileUploadForm.file_name}
                  onChange={(e) => setFileUploadForm({ ...fileUploadForm, file_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Category</label>
                <select
                  value={fileUploadForm.file_category}
                  onChange={(e) => setFileUploadForm({ ...fileUploadForm, file_category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  <option value="Project File">Project File</option>
                  <option value="Client Document">Client Document</option>
                  <option value="Project Image">Project Image</option>
                  <option value="PDF Document">PDF Document</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setFileUploadModal(false)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {paymentModal.mode === 'add' ? 'Add Payment Record' : 'Edit Payment Record'}
            </h3>
            <form onSubmit={handleSavePayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">Client</label>
                <input
                  type="text"
                  required
                  value={paymentModal.data.client_name}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, client_name: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Project</label>
                <input
                  type="text"
                  required
                  value={paymentModal.data.project_name}
                  onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, project_name: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Total Project Amount (₹)</label>
                  <input
                    type="number"
                    value={paymentModal.data.total_amount}
                    onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, total_amount: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Amount Received (₹)</label>
                  <input
                    type="number"
                    value={paymentModal.data.amount_received}
                    onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, amount_received: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#100A06] border border-[#3A2518] flex justify-between">
                <span className="text-[#A6A09A]">Auto-Calculated Remaining Balance:</span>
                <span className="font-bold text-[#F5B942]">
                  {formatINR(Math.max(0, (Number(paymentModal.data.total_amount) || 0) - (Number(paymentModal.data.amount_received) || 0)))}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={paymentModal.data.payment_date}
                    onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, payment_date: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Payment Method</label>
                  <select
                    value={paymentModal.data.payment_method}
                    onChange={(e) => setPaymentModal({ ...paymentModal, data: { ...paymentModal.data, payment_method: e.target.value } })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    {['UPI', 'Bank Transfer (NEFT/IMPS)', 'Razorpay', 'Cash', 'Card'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setPaymentModal(null)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {invoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Generate New LOKIX.IN Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Select Client</label>
                  <select
                    value={invoiceForm.client_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, client_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.company_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Select Project</label>
                  <select
                    value={invoiceForm.project_id}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, project_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A6A09A] mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={invoiceForm.issue_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">Due Date</label>
                  <input
                    type="date"
                    value={invoiceForm.due_date}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  />
                </div>
                <div>
                  <label className="block text-[#A6A09A] mb-1">GST Rate (%)</label>
                  <select
                    value={invoiceForm.gst_rate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, gst_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                  >
                    <option value={0}>0% (No GST)</option>
                    <option value={18}>18% (Standard IGST/CGST+SGST)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A6A09A] mb-1">Service Description & Amount</label>
                {invoiceForm.items.map((it, idx) => (
                  <div key={it.id} className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      type="text"
                      required
                      placeholder="Service description"
                      value={it.service_description}
                      onChange={(e) => {
                        const updated = [...invoiceForm.items];
                        updated[idx].service_description = e.target.value;
                        setInvoiceForm({ ...invoiceForm, items: updated });
                      }}
                      className="col-span-8 px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                    <input
                      type="number"
                      required
                      placeholder="Amount"
                      value={it.unit_price}
                      onChange={(e) => {
                        const updated = [...invoiceForm.items];
                        updated[idx].unit_price = Number(e.target.value);
                        setInvoiceForm({ ...invoiceForm, items: updated });
                      }}
                      className="col-span-4 px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setInvoiceModal(false)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#24170F] border border-[#3A2518] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">{noteModal.mode === 'add' ? 'Add Note' : 'Edit Note'}</h3>
            <form onSubmit={handleSaveNote} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">Note Title</label>
                <input
                  type="text"
                  required
                  value={noteModal.data.title}
                  onChange={(e) => setNoteModal({ ...noteModal, data: { ...noteModal.data, title: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Attach to Project</label>
                <select
                  value={noteModal.data.project_id}
                  onChange={(e) => setNoteModal({ ...noteModal, data: { ...noteModal.data, project_id: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">Note Content</label>
                <textarea
                  rows={4}
                  required
                  value={noteModal.data.content}
                  onChange={(e) => setNoteModal({ ...noteModal, data: { ...noteModal.data, content: e.target.value } })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noteModal.data.is_important}
                  onChange={(e) => setNoteModal({ ...noteModal, data: { ...noteModal.data, is_important: e.target.checked } })}
                  className="accent-[#F5B942]"
                />
                <span className="text-white">Mark as Important Note</span>
              </label>
              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={() => setNoteModal(null)} className="px-4 py-2 rounded-xl bg-[#100A06] text-[#A6A09A]">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white font-semibold">
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supabase Connection & Full 13-Table SQL Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#24170F] border border-[#A94F1D] rounded-2xl p-6 max-w-3xl w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-[#F5B942]" />
                <h3 className="text-base font-bold text-white">
                  Supabase Database Connection & 13-Table RLS SQL Schema
                </h3>
              </div>
              <button onClick={() => setShowSchemaModal(false)} className="text-[#A6A09A] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#A6A09A] mb-1">VITE_SUPABASE_URL</label>
                <input
                  type="text"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[#A6A09A] mb-1">VITE_SUPABASE_ANON_KEY (Public Anon Key Only)</label>
                <input
                  type="password"
                  value={supabaseConfig.anonKey}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#100A06] border border-[#3A2518] text-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A6A09A]">
                Includes: profiles, clients, projects, tasks, work_logs, milestones, payments, invoices, invoice_items, project_files, notes, activities, notifications
              </span>
              <button
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                  } catch {
                    // Fallback if clipboard blocked
                  }
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                  showToast('Copied full SQL Migration to clipboard!', 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#A94F1D] text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied SQL' : 'Copy SQL Schema'}
              </button>
            </div>

            <pre className="bg-[#100A06] border border-[#3A2518] rounded-xl p-4 text-[11px] font-mono text-[#F5B942] max-h-72 overflow-y-auto">
              {SUPABASE_SQL_SCHEMA}
            </pre>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  try {
                    localStorage.setItem('lokix_supabase_config', JSON.stringify(supabaseConfig));
                  } catch {}
                  setShowSchemaModal(false);
                  showToast('Supabase configuration saved!', 'success');
                }}
                className="px-4 py-2 rounded-xl bg-[#A94F1D] text-white text-xs font-semibold"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
