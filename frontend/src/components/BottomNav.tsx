"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  if (!isSignedIn) return null;

  // Don't show bottom nav on onboarding pages, wait, maybe we should?
  // Usually onboarding has its own full screen flow.
  if (pathname?.startsWith('/onboarding')) return null;

  const tabs = [
    { name: "Home", href: "/dashboard", icon: "🏠" },
    { name: "Videos", href: "/dashboard/feed", icon: "▶️" },
    { name: "Find", href: "/marketplace", icon: "🔍" },
    { name: "Progress", href: "/dashboard/progress", icon: "📈" }
  ];

  return (
    <>
      {/* Spacer to prevent content from hiding behind the absolute bottom nav */}
      <div className="bottom-nav-spacer" style={{ height: '70px', display: 'none' }} />
      
      <nav 
        className="bottom-nav" 
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '70px',
          backgroundColor: 'var(--card-bg)',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 1000,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {tabs.map(tab => {
          const isActive = pathname === tab.href || (tab.href !== '/dashboard' && pathname?.startsWith(tab.href));
          return (
            <Link 
              key={tab.name} 
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                textDecoration: 'none',
                color: isActive ? 'var(--primary)' : 'var(--muted-foreground)',
                flex: 1,
                height: '100%'
              }}
            >
              <div style={{ fontSize: '1.25rem', opacity: isActive ? 1 : 0.7 }}>{tab.icon}</div>
              <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 700 : 500 }}>{tab.name}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* Media query to hide the bottom nav on desktop screens */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          .bottom-nav {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .bottom-nav-spacer {
            display: block !important;
          }
          /* Hide desktop headers if needed by class name */
          .desktop-header {
            display: none !important;
          }
          /* Hide desktop nav links in universal headers */
          .desktop-nav-links {
            display: none !important;
          }
        }
      `}} />
    </>
  );
}
