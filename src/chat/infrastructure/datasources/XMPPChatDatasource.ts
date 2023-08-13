import debug from '@xmpp/debug';
import { Client, client, xml } from '@xmpp/client';
import { ChatDatasource } from '../../domain/datasources/ChatDatasource';
import { Roster } from '../../domain/entities/Roster';
import { RosterMapper } from '../mapper/RosterMapper';
export class XMPPChatDatasource implements ChatDatasource {
	
	private xmpp: Client;	// Client that this datasource will use

	private _onOnline: () => void = () => { };
	private _onRosterReceived: (roster: Roster) => void = () => { };
	private _onError: (error: Error) => void = () => { };
	private _onLoginError: (error: Error) => void = () => { };

	constructor(id: string, password: string) {
		this.xmpp = client({
			service: 'xmpp://alumchat.xyz',
			domain: 'alumchat.xyz',
			resource: 'macbook',
			username: id,
			password: password,
		});
	}

	/**
	 * Start the XMPP client
	 */
	public async start({ debugMode = false}) {
		await this.attachListeners();
		await this.xmpp.start().catch(this._onLoginError);
		debug(this.xmpp, debugMode);
	}


	/**
	 * Stop the XMPP client
	 */
	public async stop() {
		await this.xmpp.stop();
	}

	/**
	 * Get the roster of the client
	 */
	async getContacts(): Promise<void> {
		await this.xmpp.send(xml('iq', {type: 'get'}, xml('query', {xmlns: 'jabber:iq:roster'})));
	}

	/**
	 * Send a message to an user
	 * @param to 
	 * @param message 
	 */
	sendMessage(to: string, message: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	addContact(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	removeContact(id: string): Promise<void> {
		throw new Error('Method not implemented.');
	}


	public async attachListeners() {
		console.log('attached listeners');
		this.xmpp.on('online', async () => {
			this._onOnline();
		});
		this.xmpp.on('error', async (error) => {
			this._onError(error);
		});
		this.xmpp.on('stanza', async (stanza) => { 
			if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
				const incomingRoster = RosterMapper.fromXmppResponse(stanza);
				this._onRosterReceived(incomingRoster);
			}
		});
	}


	set onRosterReceived(onRosterReceived: (roster: Roster) => Promise<void>) {
		this._onRosterReceived = onRosterReceived;
	}

	set onOnline(onOnline: () => Promise<void>) {
		this._onOnline = async () => {
			// send presence
			await this.xmpp.send(xml('presence'));
			onOnline();
		};
	}

	set onError(onError: (error: Error) =>void) {
		this._onError = onError;
	}

	set onLoginError(onLoginError: (error: Error) => void) {
		this._onLoginError = onLoginError;
	}

}