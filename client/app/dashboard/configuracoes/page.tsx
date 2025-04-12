"use client";

import type React from "react";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Clock, Store } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  getAutoCloseSettings,
  updateAutoCloseSettings,
  getStoreSettings,
  updateStoreSettings,
} from "@/services/service";

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [storeLoading, setStoreLoading] = useState(false);
  const [autoCloseLoading, setAutoCloseLoading] = useState(false);
  const [autoCloseHour, setAutoCloseHour] = useState("0");
  const [autoCloseMinute, setAutoCloseMinute] = useState("0");
  const [autoCloseDescription, setAutoCloseDescription] = useState("");

  // Estado para configurações da loja
  const [storeSettings, setStoreSettings] = useState({
    storeName: "",
    cnpj: "",
    phone: "",
    email: "",
    address: "",
    openingHours: "",
    paymentMethods: {
      cash: true,
      credit: true,
      debit: true,
      pix: true,
    },
  });

  // Buscar configurações de fechamento automático
  useEffect(() => {
    const fetchAutoCloseSettings = async () => {
      try {
        const settings = await getAutoCloseSettings();
        if (settings) {
          // Extrair hora e minuto da descrição ou do agendamento
          // O formato do agendamento é "minutes hours * * *"
          const parts = settings.schedule.split(" ");
          setAutoCloseMinute(parts[0]);
          setAutoCloseHour(parts[1]);
          setAutoCloseDescription(settings.description);
        }
      } catch (error) {
        console.error("Erro ao carregar configurações de fechamento:", error);
      }
    };

    const fetchStoreSettings = async () => {
      try {
        const settings = await getStoreSettings();
        if (settings) {
          setStoreSettings({
            storeName: settings.storeName,
            cnpj: settings.cnpj,
            phone: settings.phone,
            email: settings.email,
            address: settings.address,
            openingHours: settings.openingHours,
            paymentMethods: {
              cash: settings.paymentMethods.cash,
              credit: settings.paymentMethods.credit,
              debit: settings.paymentMethods.debit,
              pix: settings.paymentMethods.pix,
            },
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configurações da loja:", error);
      }
    };

    fetchAutoCloseSettings();
    fetchStoreSettings();
  }, []);

  const handleStoreSettingsChange = (
    field: string,
    value: string | boolean
  ) => {
    if (field.startsWith("paymentMethod.")) {
      const method = field.split(".")[1];
      setStoreSettings({
        ...storeSettings,
        paymentMethods: {
          ...storeSettings.paymentMethods,
          [method]: value as boolean,
        },
      });
    } else {
      setStoreSettings({
        ...storeSettings,
        [field]: value,
      });
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoreLoading(true);

    try {
      const response = await updateStoreSettings(storeSettings);

      if (response && response.success) {
        toast({
          title: "Configurações salvas",
          description:
            "As configurações da loja foram atualizadas com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description:
          error.message ||
          "Não foi possível atualizar as configurações da loja.",
        variant: "destructive",
      });
    } finally {
      setStoreLoading(false);
    }
  };

  const handleSaveAutoCloseSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setAutoCloseLoading(true);

    try {
      const response = await updateAutoCloseSettings({
        hours: parseInt(autoCloseHour),
        minutes: parseInt(autoCloseMinute),
      });

      if (response) {
        setAutoCloseDescription(response.settings.description);
        toast({
          title: "Configuração salva",
          description:
            response.message ||
            "Horário de fechamento automático atualizado com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description:
          error.message ||
          "Não foi possível atualizar o horário de fechamento.",
        variant: "destructive",
      });
    } finally {
      setAutoCloseLoading(false);
    }
  };

  // Gerar as horas para o select
  const hoursOptions = Array.from({ length: 24 }, (_, i) => i);
  // Gerar as opções de minutos (0, 15, 30, 45)
  const minutesOptions = [0, 15, 30, 45];

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Configurações"
        description="Gerencie as configurações do sistema"
      />

      <Tabs defaultValue="loja">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="sistema">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="loja" className="mt-4">
          <Card>
            <form onSubmit={handleSaveStoreSettings}>
              <CardHeader>
                <CardTitle>Configurações da Loja</CardTitle>
                <CardDescription>
                  Configure as informações da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="nome-loja">Nome da Loja</Label>
                  <Input
                    id="nome-loja"
                    value={storeSettings.storeName}
                    onChange={(e) =>
                      handleStoreSettingsChange("storeName", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={storeSettings.cnpj}
                    onChange={(e) =>
                      handleStoreSettingsChange("cnpj", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone-loja">Telefone</Label>
                  <Input
                    id="telefone-loja"
                    value={storeSettings.phone}
                    onChange={(e) =>
                      handleStoreSettingsChange("phone", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-loja">Email</Label>
                  <Input
                    id="email-loja"
                    type="email"
                    value={storeSettings.email}
                    onChange={(e) =>
                      handleStoreSettingsChange("email", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco-loja">Endereço</Label>
                  <Textarea
                    id="endereco-loja"
                    value={storeSettings.address}
                    onChange={(e) =>
                      handleStoreSettingsChange("address", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horario-funcionamento">
                    Horário de Funcionamento
                  </Label>
                  <Input
                    id="horario-funcionamento"
                    value={storeSettings.openingHours}
                    onChange={(e) =>
                      handleStoreSettingsChange("openingHours", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Opções de Pagamento Aceitas</Label>
                  <div className="flex flex-col space-y-2">
                    <div className="flex flex-row space-x-8">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="pagamento-dinheiro"
                          checked={storeSettings.paymentMethods.cash}
                          onCheckedChange={(checked) =>
                            handleStoreSettingsChange(
                              "paymentMethod.cash",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="pagamento-dinheiro">Dinheiro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          style={{ marginLeft: "52px" }}
                          id="pagamento-cartao-credito"
                          checked={storeSettings.paymentMethods.credit}
                          onCheckedChange={(checked) =>
                            handleStoreSettingsChange(
                              "paymentMethod.credit",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="pagamento-cartao-credito">
                          Cartão de Crédito
                        </Label>
                      </div>
                    </div>
                    <div className="flex flex-row space-x-8">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="pagamento-cartao-debito"
                          checked={storeSettings.paymentMethods.debit}
                          onCheckedChange={(checked) =>
                            handleStoreSettingsChange(
                              "paymentMethod.debit",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="pagamento-cartao-debito">
                          Cartão de Débito
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          style={{ marginLeft: "-05px" }}
                          id="pagamento-pix"
                          checked={storeSettings.paymentMethods.pix}
                          onCheckedChange={(checked) =>
                            handleStoreSettingsChange(
                              "paymentMethod.pix",
                              checked
                            )
                          }
                        />
                        <Label htmlFor="pagamento-pix">PIX</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={storeLoading}
                >
                  {storeLoading ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Store className="mr-2 h-4 w-4" />
                      Salvar Informações da Loja
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="sistema" className="mt-4">
          <Card>
            <form onSubmit={handleSaveAutoCloseSettings}>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configure as opções de funcionamento do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    Fechamento Automático de Caixa
                  </h3>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Importante</AlertTitle>
                    <AlertDescription>
                      O sistema fechará automaticamente todos os caixas abertos
                      no horário definido. Atualmente configurado para:{" "}
                      <strong>{autoCloseDescription}</strong>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="close-hour">Hora</Label>
                      <Select
                        value={autoCloseHour}
                        onValueChange={setAutoCloseHour}
                      >
                        <SelectTrigger id="close-hour">
                          <SelectValue placeholder="Selecione a hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {hoursOptions.map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="close-minute">Minuto</Label>
                      <Select
                        value={autoCloseMinute}
                        onValueChange={setAutoCloseMinute}
                      >
                        <SelectTrigger id="close-minute">
                          <SelectValue placeholder="Selecione o minuto" />
                        </SelectTrigger>
                        <SelectContent>
                          {minutesOptions.map((minute) => (
                            <SelectItem key={minute} value={minute.toString()}>
                              {minute.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">
                      Notificar usuários sobre fechamento automático
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Enviar notificação 15 minutos antes do fechamento
                      automático
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="ml-auto"
                  disabled={autoCloseLoading}
                >
                  {autoCloseLoading ? (
                    "Salvando..."
                  ) : (
                    <>
                      <Clock className="mr-2 h-4 w-4" />
                      Salvar Configurações de Fechamento
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
