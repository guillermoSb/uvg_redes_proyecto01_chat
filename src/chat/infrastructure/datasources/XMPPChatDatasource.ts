import debug from '@xmpp/debug';
import { Client, client, xml } from '@xmpp/client';
import { ChatDatasource } from '../../domain/datasources/ChatDatasource';
import { Roster } from '../../domain/entities/Roster';
import { RosterMapper } from '../mapper/RosterMapper';
export class XMPPChatDatasource implements ChatDatasource {
	
	private xmpp: Client;	// Client that this datasource will use

	// Listeners
	private _onOnline: () => void = () => { };
	private _onLoginError: (error: Error) => void = () => { };
	private _onRosterReceived: (roster: Roster) => void = () => { };
	private _onError: (error: Error) => void = () => { };


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
	 * Get the roster of the client
	 */
	async getContacts(): Promise<void> {
		await this.xmpp.send(xml('iq', {type: 'get'}, xml('query', {xmlns: 'jabber:iq:roster'})));
	}

	async logout(): Promise<void> {
		await this.xmpp.stop();		
	}

	/**
	 * Send a message to an user
	 * @param to 
	 * @param message 
	 */
	sendMessage(to: string, message: string): Promise<void> {
		throw new Error('Method not implemented.');
	}

	/**
	 * Adds a contact to the roster
	 * @param id 
	 */
	async addContact(id: string): Promise<void> {
		const to = id + '@alumchat.xyz';
		await this.xmpp.send(xml('presence', { to, type: 'subscribe' }));
	}

	/**
	 * Removes a contact
	 * @param id 
	 */
	async removeContact(id: string): Promise<void> {
		const to = id + '@alumchat.xyz';
		return await this.xmpp.send(xml('iq', { type: 'set' }, xml('query', { xmlns: 'jabber:iq:roster' }, xml('item', { jid: to, subscription: 'remove' }))));
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
			// Presence
			if (stanza.is('presence') && stanza.attrs.type === 'subscribe') {
				// Accept all subscription requests
				return await this.xmpp.send(xml('presence', { to: stanza.getAttr('from'), type: 'subscribed' }));
			} 

			// Iq
			if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
				const incomingRoster = RosterMapper.fromXmppResponse(stanza);
				return this._onRosterReceived(incomingRoster);
			} else if (stanza.is('iq') && stanza.attrs.type === 'set' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
				const id = stanza.attrs.id;
				const item = stanza.getChild('query')?.getChild('item');
				const jid = item?.attrs.jid;
				const ask = item?.attrs.ask;
				if (ask === 'unsubscribe') {
					await this.xmpp.send(xml('iq', { type: 'result', id, to: jid }));
				}
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