"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { create } from "@/services/service";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Definindo a estrutura do cliente
interface Address {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Consumer {
  name: string;
  email: string;
  phone: string;
  address: Address;
}

export default function NovoClientePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(false);

  // Estado inicial do formulário
  const [formData, setFormData] = useState<Consumer>({
    name: "",
    email: "",
    phone: "",
    address: {
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
    },
  });

  // Função para aplicar máscara ao telefone celular (xx) xxxxx-xxxx
  const applyPhoneMask = (value: string) => {
    // Remove todos os caracteres não numéricos
    const phoneNumber = value.replace(/\D/g, "");

    if (phoneNumber.length <= 0) return "";
    if (phoneNumber.length <= 2) return `(${phoneNumber}`;
    if (phoneNumber.length <= 7)
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
      2,
      7
    )}-${phoneNumber.slice(7, 11)}`;
  };

  // Função para aplicar máscara ao CEP xxxxx-xxx
  const applyCepMask = (value: string) => {
    // Remove todos os caracteres não numéricos
    const cep = value.replace(/\D/g, "");

    if (cep.length <= 5) return cep;
    return `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
  };

  // Atualiza os campos do formulário
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;

    if (id === "phone") {
      // Aplica máscara ao telefone
      const maskedPhone = applyPhoneMask(value);
      setFormData((prev) => ({
        ...prev,
        [id]: maskedPhone,
      }));
    } else if (id === "zipCode") {
      // Aplica máscara ao CEP
      const maskedCep = applyCepMask(value);
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [id]: maskedCep,
        },
      }));

      // Se o CEP for apagado, limpa os campos de endereço
      if (value.replace(/\D/g, "").length === 0) {
        setFormData((prev) => ({
          ...prev,
          address: {
            ...prev.address,
            zipCode: "",
            street: "",
            neighborhood: "",
            city: "",
            state: "",
          },
        }));
      } else if (value.replace(/\D/g, "").length === 8) {
        // Se tiver 8 dígitos, busca o CEP imediatamente
        fetchAddressByCep(value.replace(/\D/g, ""));
      }
    } else if (id in formData.address) {
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [id]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [id]: value,
      }));
    }
  };

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      if (response.data.erro) {
        toast({ title: "CEP não encontrado", variant: "destructive" });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          street: response.data.logradouro,
          neighborhood: response.data.bairro,
          city: response.data.localidade,
          state: response.data.uf,
        },
      }));
    } catch (error) {
      toast({ title: "Erro ao buscar CEP", variant: "destructive" });
      console.error("Erro ao buscar CEP:", error);
    }
  };

  // Mantemos a função handleCepBlur para compatibilidade, mas ela agora apenas chama fetchAddressByCep
  const handleCepBlur = () => {
    const cep = formData.address.zipCode.replace(/\D/g, "");
    fetchAddressByCep(cep);
  };

  // Envia os dados do formulário para a API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await create("consumers", formData, {});
      toast({ title: "Cliente cadastrado com sucesso!" });
      router.push("/dashboard/clientes");
    } catch (error) {
      toast({
        title: "Erro ao cadastrar cliente",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Novo Cliente"
        description="Adicione um novo cliente à base de dados"
      >
        <Link href="/dashboard/clientes">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </DashboardHeader>

      <div className="grid gap-6">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Cliente</CardTitle>
              <CardDescription>
                Preencha os dados do novo cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    required
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Celular</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    placeholder="00000-000"
                    required
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    onBlur={handleCepBlur}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  placeholder="Rua"
                  required
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    placeholder="123"
                    required
                    value={formData.address.number}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    placeholder="Bairro"
                    required
                    value={formData.address.neighborhood}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    required
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  placeholder="Estado"
                  required
                  value={formData.address.state}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais sobre o cliente"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="ml-auto" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </DashboardShell>
  );
}
