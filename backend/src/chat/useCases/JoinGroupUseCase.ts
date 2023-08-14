import { ChatDatasource } from '../domain/datasources/ChatDatasource';


export class JoinGroupUseCase {
	public chatDatasource: ChatDatasource;
	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}
	public async execute(groupJid: string, nick: string) {
		await this.chatDatasource.joingGroup(groupJid, nick);
	}
}