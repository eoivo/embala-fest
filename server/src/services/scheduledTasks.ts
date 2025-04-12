import cron from "node-cron";
import { logger } from "../config/logger.js";
import { Register } from "../models/register.js";
import { User } from "../models/user.js";
import mongoose from "mongoose";

/**
 * Serviço para gerenciar tarefas agendadas do sistema
 */
class ScheduledTasksService {
  private autoCloseSchedule: string = "0 0 * * *"; // Padrão: 00:00 todos os dias
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Inicia todas as tarefas agendadas
   */
  init() {
    logger.info("Iniciando serviço de tarefas agendadas");
    this.scheduleAutoCloseRegisters();
  }

  /**
   * Agenda o fechamento automático dos caixas
   * Executa no horário configurado (padrão: meia-noite)
   */
  scheduleAutoCloseRegisters() {
    // Cancelar job anterior se existir
    if (this.cronJob) {
      this.cronJob.stop();
    }

    // Criar novo job com o horário configurado
    this.cronJob = cron.schedule(this.autoCloseSchedule, async () => {
      try {
        logger.info("Iniciando fechamento automático de caixas");

        // Encontrar todos os caixas abertos
        const openRegisters = await Register.find({ status: "open" });

        if (openRegisters.length === 0) {
          logger.info(
            "Nenhum caixa aberto encontrado para fechamento automático"
          );
          return;
        }

        logger.info(
          `Encontrados ${openRegisters.length} caixas abertos para fechamento automático`
        );

        // Encontrar um usuário administrador para associar ao fechamento
        const adminUser = await User.findOne({ role: "admin" });

        if (!adminUser) {
          logger.error(
            "Nenhum usuário administrador encontrado para associar ao fechamento automático"
          );
          return;
        }

        // Fechar cada caixa
        for (const register of openRegisters) {
          try {
            // Usar type assertion para garantir que TypeScript reconheça o tipo correto
            const typedRegister = register as unknown as {
              _id: mongoose.Types.ObjectId;
              initialBalance: number;
            };

            // Usar o ID para buscar o registro novamente
            const registerId = typedRegister._id.toString();
            const registerForUpdate = await Register.findById(registerId);

            if (!registerForUpdate) {
              logger.error(
                `Caixa não encontrado para fechamento: ${registerId}`
              );
              continue;
            }

            // Calcular os totais do caixa
            const salesTotal =
              await this.calculateRegisterSalesTotal(registerId);

            // Atualizar o registro do caixa
            registerForUpdate.finalBalance =
              registerForUpdate.initialBalance + salesTotal;
            registerForUpdate.status = "closed";
            registerForUpdate.closedAt = new Date();
            registerForUpdate.closedBy = adminUser._id;
            registerForUpdate.closingNotes = "Fechamento automático do sistema";

            await registerForUpdate.save();

            logger.info(
              `Caixa ID: ${registerId} fechado automaticamente. Valor final: R$ ${registerForUpdate.finalBalance.toFixed(2)}`
            );
          } catch (regError) {
            // Usar o mesmo type assertion para o log de erro
            const typedRegister = register as unknown as {
              _id: mongoose.Types.ObjectId;
            };
            logger.error(
              `Erro ao processar o caixa: ${typedRegister._id.toString()}`,
              regError
            );
          }
        }

        logger.info("Processo de fechamento automático concluído com sucesso");
      } catch (error) {
        logger.error("Erro durante o fechamento automático de caixas:", error);
      }
    });

    logger.info(
      `Fechamento automático de caixas agendado para: ${this.getScheduleTimeDescription()}`
    );
  }

  /**
   * Altera o horário de fechamento automático do caixa
   * @param hours Hora (0-23)
   * @param minutes Minutos (0-59)
   */
  setAutoCloseTime(hours: number, minutes: number) {
    // Validar valores
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(
        "Horário inválido. Hora deve estar entre 0-23 e minutos entre 0-59."
      );
    }

    // Formatar expressão cron: minuto hora * * *
    this.autoCloseSchedule = `${minutes} ${hours} * * *`;

    // Reagendar a tarefa com o novo horário
    this.scheduleAutoCloseRegisters();

    return {
      schedule: this.autoCloseSchedule,
      description: this.getScheduleTimeDescription(),
    };
  }

  /**
   * Obtém informações da configuração de agendamento atual
   */
  getScheduleInfo() {
    return {
      schedule: this.autoCloseSchedule,
      description: this.getScheduleTimeDescription(),
      isActive: !!this.cronJob,
    };
  }

  /**
   * Obtém descrição legível do horário agendado
   */
  private getScheduleTimeDescription(): string {
    const parts = this.autoCloseSchedule.split(" ");
    const minutes = parts[0];
    const hours = parts[1];

    if (minutes === "0") {
      return `${hours}:00 todos os dias`;
    } else {
      return `${hours}:${minutes} todos os dias`;
    }
  }

  /**
   * Calcula o total de vendas associadas a um caixa
   */
  async calculateRegisterSalesTotal(
    registerId: string | mongoose.Types.ObjectId
  ) {
    try {
      const register = await Register.findById(registerId).populate("sales");

      if (!register || !register.sales || !Array.isArray(register.sales)) {
        return 0;
      }

      // Calcular o total das vendas
      let salesTotal = 0;
      register.sales.forEach((sale: any) => {
        if (
          sale &&
          typeof sale === "object" &&
          sale.status === "completed" &&
          typeof sale.total === "number"
        ) {
          salesTotal += sale.total;
        }
      });

      return salesTotal;
    } catch (error) {
      logger.error(
        `Erro ao calcular total de vendas para o caixa ${registerId}:`,
        error
      );
      return 0;
    }
  }
}

export const scheduledTasksService = new ScheduledTasksService();
