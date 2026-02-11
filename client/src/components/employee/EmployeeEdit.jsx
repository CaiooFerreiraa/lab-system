import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { employeeApi } from "../../services/api";
import EmployeeForm from "./EmployeeForm";
import Loader from "../common/Loader";

export default function EmployeeEdit() {
  const { registration } = useParams();
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await employeeApi.getOne(registration);
        const data = res.data || res;
        setInitialData({
          registration: data.matricula,
          name: data.nome,
          lastName: data.sobrenome,
          shift: data.turno,
          phoneNumber: data.telefone,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [registration]);

  if (loading) return <Loader />;
  if (!initialData) return <p>Funcionário não encontrado.</p>;

  return <EmployeeForm initialData={initialData} isEdit />;
}
