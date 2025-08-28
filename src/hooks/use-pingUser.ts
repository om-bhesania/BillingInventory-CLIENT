import { useEffect, useState } from "react";
import { pingUser, type PingUser } from "@/apis/pingapi";

export const usePingUser = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<PingUser | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pingUser();
      if (res?.tokenValidity && res.user) {
        setUser(res.user);
        // optionally cache
        sessionStorage.setItem("ping_user", JSON.stringify(res.user));
      } else {
        setUser(null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to fetch user");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
  }, []);

  return { user, loading, error, refetch: run };
};


