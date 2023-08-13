import { ChatDatasource } from '../domain/datasources/ChatDatasource';

export class GetRosterUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	public async execute() {
		await this.chatDatasource.getContacts();
	}

}