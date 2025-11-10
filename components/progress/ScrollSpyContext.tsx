import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface SectionRef {
  id: string;
  element: HTMLElement;
  label: string;
  icon: React.ReactNode;
}

interface ScrollSpyContextType {
  activeSection: string;
  registerSection: (id: string, element: HTMLElement, label: string, icon: React.ReactNode) => void;
  unregisterSection: (id: string) => void;
  scrollToSection: (id: string) => void;
}

const ScrollSpyContext = createContext<ScrollSpyContextType | undefined>(undefined);

export const ScrollSpyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const sectionsRef = useRef<Map<string, SectionRef>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const registerSection = useCallback((id: string, element: HTMLElement, label: string, icon: React.ReactNode) => {
    sectionsRef.current.set(id, { id, element, label, icon });
    
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  const unregisterSection = useCallback((id: string) => {
    const section = sectionsRef.current.get(id);
    if (section && observerRef.current) {
      observerRef.current.unobserve(section.element);
    }
    sectionsRef.current.delete(id);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const section = sectionsRef.current.get(id);
    if (section) {
      const stickyHeight = 140; // Account for sticky chip bar height
      const elementPosition = section.element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - stickyHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setActiveSection(id);
    }
  }, []);

  useEffect(() => {
    const stickyHeight = 140;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const id = entry.target.getAttribute('data-section-id');
            if (id) {
              setActiveSection(id);
            }
          }
        });
      },
      {
        rootMargin: `-${stickyHeight}px 0px -40% 0px`,
        threshold: [0, 0.5, 1]
      }
    );

    // Observe already registered sections
    sectionsRef.current.forEach((section) => {
      observerRef.current?.observe(section.element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <ScrollSpyContext.Provider value={{ activeSection, registerSection, unregisterSection, scrollToSection }}>
      {children}
    </ScrollSpyContext.Provider>
  );
};

export const useScrollSpy = () => {
  const context = useContext(ScrollSpyContext);
  if (!context) {
    throw new Error('useScrollSpy must be used within ScrollSpyProvider');
  }
  return context;
};

export const useProgressSections = () => {
  const context = useContext(ScrollSpyContext);
  if (!context) {
    throw new Error('useProgressSections must be used within ScrollSpyProvider');
  }
  return context;
};
