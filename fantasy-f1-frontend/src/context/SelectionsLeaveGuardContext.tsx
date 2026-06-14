import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

interface SelectionsLeaveGuardContextValue {
  isActive: boolean;
  setIsActive: (active: boolean) => void;
  requestLeave: (action: () => void) => void;
}

const SelectionsLeaveGuardContext = createContext<SelectionsLeaveGuardContextValue | null>(null);

export const SelectionsLeaveGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const skipGuardRef = useRef(false);

  const requestLeave = useCallback(
    (action: () => void) => {
      if (!isActive || skipGuardRef.current) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setModalOpen(true);
    },
    [isActive]
  );

  const confirmLeave = () => {
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    setModalOpen(false);
    skipGuardRef.current = true;
    setIsActive(false);
    action?.();
    skipGuardRef.current = false;
  };

  const cancelLeave = () => {
    pendingActionRef.current = null;
    setModalOpen(false);
  };

  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    const pushGuardState = () => {
      window.history.pushState({ selectionsLeaveGuard: true }, '');
    };

    pushGuardState();

    const handlePopState = () => {
      pushGuardState();
      pendingActionRef.current = () => {
        skipGuardRef.current = true;
        setIsActive(false);
        window.history.back();
        skipGuardRef.current = false;
      };
      setModalOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isActive]);

  return (
    <SelectionsLeaveGuardContext.Provider value={{ isActive, setIsActive, requestLeave }}>
      {children}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div
            className="bg-gray-900 rounded-xl border border-white/20 p-6 max-w-md w-full shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="selections-leave-guard-title"
          >
            <h2 id="selections-leave-guard-title" className="text-xl font-bold text-white mb-3">
              Leave without confirming?
            </h2>
            <p className="text-white/80 mb-6">
              Your selections have not been made or confirmed. Are you sure you want to go back?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                type="button"
                onClick={cancelLeave}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Stay on page
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
              >
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </SelectionsLeaveGuardContext.Provider>
  );
};

export function useSelectionsLeaveGuard(): SelectionsLeaveGuardContextValue {
  const context = useContext(SelectionsLeaveGuardContext);
  if (!context) {
    throw new Error('useSelectionsLeaveGuard must be used within SelectionsLeaveGuardProvider');
  }
  return context;
}

/** Safe hook for AppLayout — no-op when provider is absent */
export function useSelectionsLeaveGuardOptional(): SelectionsLeaveGuardContextValue | null {
  return useContext(SelectionsLeaveGuardContext);
}
