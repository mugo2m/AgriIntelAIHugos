"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Image as ImageIcon, Upload, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth.action";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useOfflineTranslation } from '@/lib/hooks/useOfflineTranslation';

export default function Navigation() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const { t } = useOfflineTranslation();

  // Safe translation helper
  const safeT = (key: string, params?: any): string => {
    try {
      const result = t(key, params);
      // Handle if result is a Promise
      if (result && typeof result.then === 'function') {
        console.warn(`Translation for "${key}" returned a Promise`);
        return key;
      }
      return typeof result === 'string' ? result : String(result || '');
    } catch (e) {
      console.error('Translation error for key:', key, e);
      return key;
    }
  };

  useEffect(() => {
    // Check if user is admin (you can get this from your auth)
    const checkAdmin = async () => {
      // Simple check - replace with your actual admin logic
      const userEmail = localStorage.getItem('userEmail');
      setIsAdmin(userEmail === "your-email@gmail.com");
    };
    checkAdmin();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    toast.success(safeT('signed_out'));
    window.location.href = "/sign-in";
  };

  const navItems = [
    { href: "/", label: safeT('home'), icon: Home },
    { href: "/ask-multimodal", label: safeT('ask_with_images'), icon: ImageIcon },
  ];

  if (isAdmin) {
    navItems.push({ href: "/admin/multimodal", label: safeT('upload_documents'), icon: Upload });
  }

  return (
    <nav className="bg-white border-b border-gray-200 py-3 px-6">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-blue-900">
            🌾 {safeT('app_name')}
          </Link>
          <div className="flex gap-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-green-100 text-green-700"
                      : "hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {safeT('sign_out')}
        </button>
      </div>
    </nav>
  );
}