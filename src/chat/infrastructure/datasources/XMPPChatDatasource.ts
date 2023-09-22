import debug from '@xmpp/debug';
import { Client, client, xml } from '@xmpp/client';

import { ChatDatasource } from '../../domain/datasources/ChatDatasource';
import { Roster } from '../../domain/entities/Roster';
import { RosterMapper } from '../mapper/RosterMapper';
import { VCardMapper } from '../mapper/VCardMapper';
import { VCard } from '../../domain/entities/VCard';
import net from 'net';
import fs from 'fs';
import path from 'path';

export class XMPPChatDatasource implements ChatDatasource {
	public static readonly SERVER_URL = 'alumchat.xyz';
	public static readonly RESOURCE = 'macbook';
	private _currentId: string = '';
	private xmpp: Client;	// Client that this datasource will use

	// Listeners
	private _onOnline: () => void = () => { };
	private _onLoginError: (error: Error) => void = () => { };
	private _onRosterReceived: (roster: Roster) => void = () => { };
	private _onError: (error: Error) => void = () => { };
	private _onPresenceReceived: (jid: string, connectionStatus: string, status?: string) => void = () => { };
	private _onMessageReceived: (from: string, message: string, type: string) => void = () => { };
	private _onVcardReceived: (vCard: VCard) => void = () => { };


	constructor(id: string, password: string) {
		this.xmpp = client({
			service: 'xmpp://alumchat.xyz',
			domain: 'alumchat.xyz',
			resource: 'macbook',
			username: id,
			password: password,
		});
		this._currentId = id;
		// Send register iq of id registration
	}

	public register(username: string, password: string) {
		// cliChat.register('san191517newuser@alumchat.xyz', '123456');
		const xmppServer = 'alumchat.xyz';
		const xmppPort = 5222;
		const registrationStanza = `
			<iq type='set' id='register_id'>
				<query xmlns='jabber:iq:register'>
					<username>${username}</username>
					<password>${password}</password>
				</query>
			</iq>
		`;

		const socket = new net.Socket();

		socket.connect({port: xmppPort, host: xmppServer}, () => {
			socket.write(`<stream:stream to="'alumchat.xyz'" xmlns="jabber:client" xmlns:stream="http://etherx.jabber.org/streams" version="1.0">`)
			socket.write(registrationStanza)
		
		});
		socket.on('error', (err) => {
			console.log(err)
		});
		socket.on('data', (data) => {
			socket.end()
		})
		socket.on('end', () => {
			console.log('User registered, you can now login')
		})
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
	 * Get a Vcard
	 * @param joid 
	 */
	async getVCard(joid: string): Promise<void> {
		await this.xmpp.send(xml('iq', { type: 'get', to: joid + '@alumchat.xyz' }, xml('vCard', { xmlns: 'vcard-temp' })));
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
		return this.xmpp.send(xml('message', { to: to + '@alumchat.xyz', type: 'chat' }, xml('body', {}, message)));
	}


	/**
	 * Sends a message to a group
	 * @param to 
	 * @param message 
	 * @returns 
	 */
	sendMessageToGroup(to: string, message: string): Promise<void> {
		return this.xmpp.send(xml('message', { to: to + '@conference.alumchat.xyz', type: 'groupchat' }, xml('body', {}, message)));
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
		// Remove from roster
		return await this.xmpp.send(xml('iq', { type: 'set' }, xml('query', { xmlns: 'jabber:iq:roster' }, xml('item', { jid: to, subscription: 'remove' }))));
	}


	/**
	 * Update user status
	 * @param connectionStatus
	 * @param status 
	 */
	async updateStatus(connectionStatus: string, status: string): Promise<void> {
		await this.xmpp.send(xml('presence', {}, xml('status', {}, status), xml('show', {}, connectionStatus)));
	}


	/**
	 * Attach the listeners to the xmpp client
	 */
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
			if (stanza.is('presence')) {
				if (stanza.attrs.type === 'subscribe') {
					return await this.xmpp.send(xml('presence', { to: stanza.getAttr('from'), type: 'subscribed' })); // Accept all subscription requests
				} else if (stanza.getAttr('from') !== this._currentId + '@' + XMPPChatDatasource.SERVER_URL + '/' + XMPPChatDatasource.RESOURCE) {
					const from = stanza.getAttr('from').split('/')[0];
					let status: string | null = null;
					let connectionStatus = 'offline';
					if (stanza.getChild('status')) {
						status = stanza.getChild('status')?.getText() ?? null;
					}
					if (stanza.attrs.type === 'unavailable') {
						connectionStatus = 'offline';
					} else {
						connectionStatus = 'online';
					}
					if (stanza.getChild('show')) {
					
						connectionStatus = stanza.getChild('show')?.getText() ?? 'offline';
					}
					this._onPresenceReceived(from, connectionStatus, status ?? undefined);
				}
			}  

			// Message
			if (stanza.is('message')) {
				const from = stanza.getAttr('from');
				// check if has child composing
				if (stanza.getChild('composing')) {
					this._onMessageReceived(from, '', 'composing');
				} else if (stanza.getChild('body')) {

					const body = stanza.getChild('body')?.getText();
					// check if the body starts with file://
					if (body?.startsWith('file-')) {
						const fileExt = body.split('://')[0].split('-')[1];
						const base64String = body.split('://')[1];
						const buffer = Buffer.from(base64String, 'base64');
						const filePath = path.join(__dirname, '../../../downloads', `${Date.now()}.${fileExt}`);
						fs.writeFileSync(filePath, buffer);
						this._onMessageReceived(from,`File received: ${filePath}`, stanza.attrs.type);
					} else {
						this._onMessageReceived(from, body ?? '', stanza.attrs.type);

					}
				} else if (stanza.getChild('active')) {
					this._onMessageReceived(from, '', 'active');
				} else if (stanza.getChild('inactive')) {
					this._onMessageReceived(from, '', 'inactive');
				}
			}

			// Iq
			if (stanza.is('iq')) {
				// console.log(stanza.toString())
			}
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
			} else if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('vCard')?.attrs.xmlns === 'vcard-temp') {

				const vcard = VCardMapper.fromXmppResponse(stanza.getChild('vCard')!);
				this._onVcardReceived(vcard);
			}
		});
	}


	/**
	 * Send a file
	 * @param to 
	 * @param name 
	 * @returns 
	 */
	async sendFile(to: string, name: string): Promise<boolean> {
		const filePath = path.join(__dirname, '../../../uploads', name);
		let fileExt = path.extname(filePath);
		fileExt = fileExt.substring(1);
		if (!fs.existsSync(filePath)) {
			
			return false;
		}
		const file = fs.readFileSync(filePath)
		const base64String = file.toString('base64');
		this.sendMessage(to, `file-${fileExt}://${base64String}`);
		return true;
	}


	/**
	 * Join a group
	 * @param groupJid 
	 * @param nick 
	 */
	async joingGroup(groupJid: string, nick: string): Promise<void> {
		// send presence stanza to join group
		await this.xmpp.send(xml('presence', { to: groupJid + '@conference.alumchat.xyz/' + nick }));
	}

	/**
	 * Removes an user account
	 */
	async removeAccount(): Promise<void> {
		await this.xmpp.send(xml('iq', { type: 'set' }, xml('query', { xmlns: 'jabber:iq:register' }, xml('remove'))));
	}


	// Setters for listeners


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

	set onPresenceReceived(onPresenceReceived: (jid: string, connectionStatus: string, status?: string) => void) {
		this._onPresenceReceived = onPresenceReceived;
	}

	set onMessageReceived(onMessageReceived: (from: string, message: string, type:string) => void) {
		this._onMessageReceived = onMessageReceived;
	}

	set onVcardReceived(onVcardReceived: (vCard: VCard) => void) {
		this._onVcardReceived = onVcardReceived;
	}


}