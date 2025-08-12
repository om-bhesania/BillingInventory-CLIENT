import { API_URL } from "@/services/apiuri";
import { service } from "@/services/service";
import { useEffect, useState } from "react";

export const useFetchRolesAndPerms = () => {
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchRolesAndPerms = async () => {
      const response = await service({
        url: API_URL.role.getAll,
        method: "GET",
      });
      setResponse(response);
    };
    fetchRolesAndPerms();
  }, []);

  return response;
};

