import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

interface ApiActivityContextValue {
  inFlightCount: number;
  isLoading: boolean;
}

const ApiActivityContext = createContext<ApiActivityContextValue | undefined>(undefined);

export const ApiActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inFlightCount, setInFlightCount] = useState(0);
  const pendingRef = useRef(0);

  const increment = useCallback(() => {
    pendingRef.current += 1;
    setInFlightCount(pendingRef.current);
  }, []);

  const decrement = useCallback(() => {
    pendingRef.current = Math.max(0, pendingRef.current - 1);
    setInFlightCount(pendingRef.current);
  }, []);

  useEffect(() => {
    const handleStart = () => increment();
    const handleEnd = () => decrement();

    window.addEventListener("api:request-start", handleStart as EventListener);
    window.addEventListener("api:request-end", handleEnd as EventListener);

    return () => {
      window.removeEventListener("api:request-start", handleStart as EventListener);
      window.removeEventListener("api:request-end", handleEnd as EventListener);
    };
  }, [increment, decrement]);

  const value = useMemo<ApiActivityContextValue>(() => ({
    inFlightCount,
    isLoading: inFlightCount > 0,
  }), [inFlightCount]);

  return (
    <ApiActivityContext.Provider value={value}>
      {children}
    </ApiActivityContext.Provider>
  );
};

export const useApiActivity = (): ApiActivityContextValue => {
  const ctx = useContext(ApiActivityContext);
  if (!ctx) throw new Error("useApiActivity must be used within ApiActivityProvider");
  return ctx;
};


