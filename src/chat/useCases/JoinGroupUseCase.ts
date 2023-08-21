import { ChatDatasource } from '../domain/datasources/ChatDatasource';


/**
 * Join a chat group
 */
export class JoinGroupUseCase {
	public chatDatasource: ChatDatasource;

	constructor(chatDatasource: ChatDatasource) {
		this.chatDatasource = chatDatasource;
	}

	/**
	 * Join a group
	 * @param groupJid 
	 * @param nick 
	 */
	public async execute(groupJid: string, nick: string) {
		await this.chatDatasource.joingGroup(groupJid, nick);
	}
}