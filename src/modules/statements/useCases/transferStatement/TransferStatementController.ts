import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { TransferStatementUseCase } from './TransferStatementUseCase';

class TransferStatementController {
  async execute(request: Request, response: Response): Promise<Response> {
    const { amount, description } = request.body;
    const user_from = request.user.id;
    const { user_id: user_to } = request.params;

    const transferStatementUseCase = container.resolve(TransferStatementUseCase);

    await transferStatementUseCase.execute({ user_from, user_to, amount, description })

    return response.send();
  }
}

export { TransferStatementController }
