import { IStatementsRepository } from "../../../../modules/statements/repositories/IStatementsRepository";
import { IUsersRepository } from "./../../../../modules/users/repositories/IUsersRepository";
import { inject, injectable } from "tsyringe";
import { AppError } from "../../../../shared/errors/AppError";

enum OperationType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  TRANSFER = 'transfer'
}

interface IRequest {
  user_from: string;
  user_to: string
  amount: number;
  description: string;
}

@injectable()
class TransferStatementUseCase {
  constructor(
    @inject("UsersRepository")
    private usersRepository: IUsersRepository,
    @inject("StatementsRepository")
    private statementsRepository: IStatementsRepository
  ) {

  }
  public async execute({ user_from, user_to, amount, description }: IRequest): Promise<void> {
    const userToExists = await this.usersRepository.findById(user_to);

    if (!userToExists) {
      throw new AppError("User to does not exists", 400);
    }

    const { balance } = await this.statementsRepository.getUserBalance({ user_id: user_from });

    if (amount > balance) {
      throw new AppError("Insufficient funds", 400);
    }

    await this.statementsRepository.create({ user_id: user_from, type: OperationType.WITHDRAW, amount, description });

    const userFromData = await this.usersRepository.findById(user_from);

    await this.statementsRepository.create({ user_id: user_to, sender_id:user_from, type: OperationType.TRANSFER, amount, description: `Transfer receive from ${userFromData?.name}`});
}
}


export { TransferStatementUseCase }
