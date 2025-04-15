import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { scheduledTasksService } from "../services/scheduledTasks.js";
import { AuthRequest } from "../middleware/auth.js";

export const getAutoCloseSettings = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const settings = scheduledTasksService.getScheduleInfo();
      res.json(settings);
    } catch (error: any) {
      res.status(500);
      throw new Error(error.message || "Erro ao obter configurações");
    }
  }
);

export const updateAutoCloseSettings = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    try {
      const { hours, minutes } = req.body;

      if (req.user.role !== "admin") {
        res.status(403);
        throw new Error(
          "Apenas administradores podem alterar esta configuração"
        );
      }

      if (hours === undefined || minutes === undefined) {
        res.status(400);
        throw new Error("É necessário informar horas e minutos");
      }

      const hoursNum = parseInt(hours);
      const minutesNum = parseInt(minutes);

      const result = scheduledTasksService.setAutoCloseTime(
        hoursNum,
        minutesNum
      );

      res.json({
        success: true,
        message: `Horário de fechamento automático alterado para ${result.description}`,
        settings: result,
      });
    } catch (error: any) {
      res.status(res.statusCode === 200 ? 500 : res.statusCode);
      throw new Error(
        error.message || "Erro ao configurar fechamento automático"
      );
    }
  }
);
