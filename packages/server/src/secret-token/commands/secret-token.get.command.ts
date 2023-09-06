import { ISecretTokenFindInput } from '@metad/contracts';
import { ICommand } from '@nestjs/cqrs';

export class SecretTokenGetCommand implements ICommand {
	static readonly type = '[Secret Token] Get';

	constructor(
		public readonly input: ISecretTokenFindInput
	) {}
}
