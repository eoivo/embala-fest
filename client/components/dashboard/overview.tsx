"use client";

import { useState, useEffect } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calendar } from "lucide-react";
import {
  dashboardService,
  VendasPorPeriodo,
} from "../../app/dashboard/dashboardService";
import { useToast } from "../../hooks/use-toast";

interface OverviewProps {
  data: Array<{
    name: string;
    total: number;
  }>;
}

export function Overview({ data }: OverviewProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [periodType, setPeriodType] = useState<"semana" | "mes" | "custom">(
    "semana"
  );
  const [vendasPorPeriodo, setVendasPorPeriodo] =
    useState<VendasPorPeriodo | null>(null);
  const [formattedData, setFormattedData] = useState(data);

  const semanas = [
    { label: "Últimos 7 dias", value: "atual" },
    { label: "Semana passada", value: "passada" },
    { label: "Há 2 semanas", value: "2semanas" },
    { label: "Há 3 semanas", value: "3semanas" },
  ];

  const meses = [
    { label: "Abril 2025", value: "04-2025" },
    { label: "Março 2025", value: "03-2025" },
    { label: "Fevereiro 2025", value: "02-2025" },
    { label: "Janeiro 2025", value: "01-2025" },
    { label: "Dezembro 2024", value: "12-2024" },
    { label: "Novembro 2024", value: "11-2024" },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState(semanas[0].value);

  const calcularPeriodo = (tipo: string, periodo: string): [string, string] => {
    const hoje = new Date();

    if (tipo === "semana") {
      if (periodo === "atual") {
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - 6);
        inicioSemana.setHours(0, 0, 0, 0);

        const fimSemana = new Date(hoje);
        fimSemana.setHours(23, 59, 59, 999);

        return [
          inicioSemana.toISOString().split("T")[0],
          fimSemana.toISOString().split("T")[0],
        ];
      } else {
        const inicioSemana = new Date(hoje);
        const fimSemana = new Date(hoje);

        const diaSemana = inicioSemana.getDay();
        const diferenca = diaSemana === 0 ? 6 : diaSemana - 1;
        inicioSemana.setDate(inicioSemana.getDate() - diferenca);
        inicioSemana.setHours(0, 0, 0, 0);

        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);

        if (periodo === "passada") {
          inicioSemana.setDate(inicioSemana.getDate() - 7);
          fimSemana.setDate(fimSemana.getDate() - 7);
        } else if (periodo === "2semanas") {
          inicioSemana.setDate(inicioSemana.getDate() - 14);
          fimSemana.setDate(fimSemana.getDate() - 14);
        } else if (periodo === "3semanas") {
          inicioSemana.setDate(inicioSemana.getDate() - 21);
          fimSemana.setDate(fimSemana.getDate() - 21);
        }

        return [
          inicioSemana.toISOString().split("T")[0],
          fimSemana.toISOString().split("T")[0],
        ];
      }
    } else if (tipo === "mes") {
      const [mes, ano] = periodo.split("-");
      const mesNum = parseInt(mes, 10) - 1;
      const anoNum = parseInt(ano, 10);

      const inicioMes = new Date();
      inicioMes.setFullYear(anoNum, mesNum, 1);
      inicioMes.setHours(0, 0, 0, 0);

      const fimMes = new Date();
      fimMes.setFullYear(anoNum, mesNum + 1, 0);
      fimMes.setHours(23, 59, 59, 999);

      return [
        inicioMes.toISOString().split("T")[0],
        fimMes.toISOString().split("T")[0],
      ];
    }

    const inicioDefault = new Date(hoje);
    inicioDefault.setDate(inicioDefault.getDate() - 6);
    inicioDefault.setHours(0, 0, 0, 0);

    return [
      inicioDefault.toISOString().split("T")[0],
      hoje.toISOString().split("T")[0],
    ];
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const [dataInicio, dataFim] = calcularPeriodo(
          periodType,
          selectedPeriod
        );

        const resultado = await dashboardService.getVendasPorPeriodo(
          dataInicio,
          dataFim
        );
        setVendasPorPeriodo(resultado);
      } catch (error: unknown) {
        toast({
          title: "Erro ao carregar vendas",
          description:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar os dados de vendas do período",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [periodType, selectedPeriod, toast]);

  useEffect(() => {
    if (vendasPorPeriodo) {
      const formattedData = vendasPorPeriodo.vendas.map((item) => {
        if (
          typeof item.data === "string" &&
          item.data.match(/^\d{4}-\d{2}-\d{2}$/)
        ) {
          try {
            const [_ano, mes, dia] = item.data.split("-").map(Number);

            const dataFormatada = `${dia.toString().padStart(2, "0")}/${mes
              .toString()
              .padStart(2, "0")}`;

            return {
              name: dataFormatada,
              total: item.total,
              originalDate: item.data,
            };
          } catch (e) {
            return { name: item.data, total: item.total };
          }
        }
        return { name: item.data, total: item.total };
      });

      setFormattedData(formattedData);
    }
  }, [vendasPorPeriodo]);

  const formatadorReais = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <div className="flex flex-col gap-2">
          <Label>Período</Label>
          <Select
            value={periodType}
            onValueChange={(value: "semana" | "mes" | "custom") => {
              setPeriodType(value);
              if (value === "semana") {
                setSelectedPeriod(semanas[0].value);
              } else if (value === "mes") {
                setSelectedPeriod(meses[0].value);
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semana">Semana</SelectItem>
              <SelectItem value="mes">Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {periodType === "semana" && (
          <div className="flex flex-col gap-2">
            <Label>Selecione a semana</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione a semana" />
              </SelectTrigger>
              <SelectContent>
                {semanas.map((semana) => (
                  <SelectItem key={semana.value} value={semana.value}>
                    {semana.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {periodType === "mes" && (
          <div className="flex flex-col gap-2">
            <Label>Selecione o mês</Label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {meses.map((mes) => (
                  <SelectItem key={mes.value} value={mes.value}>
                    {mes.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="ml-auto text-right">
          <div className="text-sm text-muted-foreground mb-1">
            Total no período
          </div>
          <div className="text-2xl font-bold">
            {formatadorReais.format(vendasPorPeriodo?.totalPeriodo || 0)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[350px] bg-accent/10 rounded-md">
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      ) : formattedData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={formattedData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.2}
            />
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$${value}`}
            />
            <Tooltip
              formatter={(value) => [
                formatadorReais.format(Number(value)),
                "Vendas",
              ]}
              labelFormatter={(value) => `Data: ${value}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
            />
            <Bar
              dataKey="total"
              fill="#e779c1"
              radius={[4, 4, 0, 0]}
              barSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex justify-center items-center h-[350px] bg-accent/10 rounded-md">
          <div className="text-center">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhuma venda encontrada neste período
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
