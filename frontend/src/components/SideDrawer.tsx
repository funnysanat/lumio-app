"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function SideDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  const [mounted, setMounted] = useState(false);

  // Close drawer on route change and handle mounting
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isSignedIn) return null;

  const isTherapistView = pathname?.startsWith('/therapist');

  const parentLinks = [
    { icon: "🏠", label: "Dashboard", href: "/dashboard" },
    { icon: "💬", label: "Ask Therapist", href: "/marketplace/ask" },
    { icon: "📅", label: "Events & Workshops", href: "/marketplace/workshops" },
    { icon: "🔍", label: "Find a Therapist", href: "/marketplace" },
    { icon: "▶️", label: "Therapy Videos", href: "/dashboard/feed" },
    { icon: "⚙️", label: "Settings", href: "/settings" }
  ];

  const therapistLinks = [
    { icon: "🏠", label: "Dashboard", href: "/therapist/dashboard" },
    { icon: "👥", label: "Workshops", href: "/therapist/group-sessions" },
    { icon: "💬", label: "Consultations", href: "/therapist/consultations" },
    { icon: "⚙️", label: "Edit Profile", href: "/therapist/settings" }
  ];

  const links = isTherapistView ? therapistLinks : parentLinks;

  const drawerOverlay = (
    <div 
      style={{ 
        position: "fixed", 
        inset: 0, 
        zIndex: 999999,
        pointerEvents: isOpen ? "auto" : "none"
      }}
    >
      <div 
        style={{
          position: "absolute", 
          inset: 0, 
          background: "rgba(0,0,0,0.5)",
          opacity: isOpen ? 1 : 0,
          transition: "opacity 0.3s ease"
        }}
        onClick={() => setIsOpen(false)}
      />
      <div 
        style={{ 
          position: "absolute", 
          top: 0, 
          bottom: 0, 
          left: 0, 
          width: "280px", 
          background: "var(--card-bg)", 
          boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--foreground)" }}>
            {isTherapistView ? "Therapist Menu" : "Lumio Menu"}
          </span>
          <button 
            onClick={() => setIsOpen(false)}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted-foreground)' }}
          >
            ✕
          </button>
        </div>
        
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, overflowY: "auto" }}>
          {links.map(link => (
            <Link 
              key={link.label} 
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{ 
                padding: "1rem", 
                borderRadius: "0.5rem", 
                textDecoration: "none", 
                color: "var(--foreground)", 
                fontWeight: 600,
                background: pathname === link.href ? "rgba(99,102,241,0.1)" : "transparent",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}
            >
              <span style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", width: "24px" }}>
                {link.icon}
              </span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button 
        className="mobile-hamburger"
        onClick={() => setIsOpen(true)}
        style={{ 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer', 
          fontSize: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'var(--foreground)',
          marginRight: '0.5rem'
        }}
        aria-label="Open Menu"
      >
        ☰
      </button>

      {mounted && typeof document !== "undefined" && createPortal(drawerOverlay, document.body)}
    </>
  );
}
