import cron from "node-cron";
import { logger } from "../config/logger.js";
import { Register } from "../models/register.js";
import { User } from "../models/user.js";
import mongoose from "mongoose";

class ScheduledTasksService {
  private autoCloseSchedule: string = "0 0 * * *";
  private cronJob: cron.ScheduledTask | null = null;

  init() {
    logger.info("Iniciando serviço de tarefas agendadas");
    this.scheduleAutoCloseRegisters();
  }

  scheduleAutoCloseRegisters() {
    if (this.cronJob) {
      this.cronJob.stop();
    }

    this.cronJob = cron.schedule(this.autoCloseSchedule, async () => {
      try {
        logger.info("Iniciando fechamento automático de caixas");

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

        const adminUser = await User.findOne({ role: "admin" });

        if (!adminUser) {
          logger.error(
            "Nenhum usuário administrador encontrado para associar ao fechamento automático"
          );
          return;
        }

        for (const register of openRegisters) {
          try {
            const typedRegister = register as unknown as {
              _id: mongoose.Types.ObjectId;
              initialBalance: number;
            };

            const registerId = typedRegister._id.toString();
            const registerForUpdate = await Register.findById(registerId);

            if (!registerForUpdate) {
              logger.error(
                `Caixa não encontrado para fechamento: ${registerId}`
              );
              continue;
            }

            const salesTotal =
              await this.calculateRegisterSalesTotal(registerId);

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
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(
        "Horário inválido. Hora deve estar entre 0-23 e minutos entre 0-59."
      );
    }

    this.autoCloseSchedule = `${minutes} ${hours} * * *`;

    this.scheduleAutoCloseRegisters();

    return {
      schedule: this.autoCloseSchedule,
      description: this.getScheduleTimeDescription(),
    };
  }

  getScheduleInfo() {
    return {
      schedule: this.autoCloseSchedule,
      description: this.getScheduleTimeDescription(),
      isActive: !!this.cronJob,
    };
  }

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

  async calculateRegisterSalesTotal(
    registerId: string | mongoose.Types.ObjectId
  ) {
    try {
      const register = await Register.findById(registerId).populate("sales");

      if (!register || !register.sales || !Array.isArray(register.sales)) {
        return 0;
      }

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
