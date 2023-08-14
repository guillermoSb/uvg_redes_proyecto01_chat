import { ChatDatasource } from '../domain/datasources/ChatDatasource';


export class LogoutUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}
	public async execute() {
		await this.chatDatasource.logout();
	}
}