import { Client, client, xml, } from '@xmpp/client';
import readline from 'readline';
import debug from '@xmpp/debug';
import { RosterToUserListMapper } from './infrastructure/mapper/RosterMapper';
import { Roster } from './domain/Roster';


// -----------------  CONFIGURATION -----------------
const SERVER_URL = 'alumchat.xyz';
const TEST_USER = 'san191517test';
const TEST_PASSWORD = '1234567';
const RESOURCE = 'macbook';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const currentRoster = new Roster([]);
// -----------------  CONFIGURATION -----------------


const initializeXmppClient = (username: string, password: string) => {
	xmpp = client({
		service: `xmpp://${SERVER_URL}`,
		domain: SERVER_URL,
		resource: RESOURCE,
		username,
		password,
		
	});
	// debug(xmpp, true);
	xmpp.start().catch(console.error);

	xmpp.on('error', (err) => {
		console.error(err);
	});

	xmpp.on('offline', () => {
		console.log('Goodbye!');
	});

	xmpp.on('stanza', async (stanza) => {
		if (stanza.is('iq') && stanza.attrs.type === 'result' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
			const incomingRoster = RosterToUserListMapper.fromXmppResponse(stanza);
			const currentUsers = currentRoster.users;
			//Check if the user is already in the roster
			const newUsers = incomingRoster.users.filter((user) => !currentUsers.some(currentUser => currentUser.jid === user.jid));
			currentRoster.users = [...currentUsers, ...newUsers];
			currentRoster.users.map((currentRosterUser) => {
				const newUser = incomingRoster.users.find((incomingUser) => incomingUser.jid === currentRosterUser.jid);
				if (newUser) {
					currentRosterUser.name = newUser.name;
				}
				return currentRosterUser;
			});
			console.log(currentRoster.toString());
		} else if (stanza.is('iq') && stanza.attrs.type === 'set' && stanza.getChild('query')?.attrs.xmlns === 'jabber:iq:roster') {
			// get the id
			const id = stanza.attrs.id;
			// get the item
			const item = stanza.getChild('query')?.getChild('item');
			// get the jid
			const jid = item?.attrs.jid;
			// get the ask 
			const ask = item?.attrs.ask;
			if (ask === 'unsubscribe') {
				await xmpp.send(xml('iq', { type: 'result', id, to: jid }));
				currentRoster.removeUserFromRoster(jid);
			}
		} else if (stanza.is('presence')) {
			
			if (stanza.attrs.type === 'subscribe') {
				// Accept all subscription requests
				console.log('Accepting subscription request from: ', stanza.getAttr('from'));
				await xmpp.send(xml('presence', { to: stanza.getAttr('from'), type: 'subscribed' }));
			} else if (stanza.attrs.type === 'unavailable') {
				const from = stanza.getAttr('from').split('/')[0];
				currentRoster.setUserStatus(from, 'offline');
			} else if (stanza.getAttr('from') !== TEST_USER + '@' + SERVER_URL + '/' + RESOURCE) {
				const from = stanza.getAttr('from').split('/')[0];
				currentRoster.setUserStatus(from, 'online');
			}
		} else if (stanza.is('message')) {
			if (stanza.getChild('body') && stanza.getAttr('type') === 'chat') {
				// console.log(stanza.toString());
				const from = stanza.getAttr('from').split('/')[0];
				const body = stanza.getChild('body')?.getText();
				console.log(`\nIncoming message from ${from}: ${body}`);
			}
		}
		// console.log('Incoming stanza: ', stanza.toString());
	});

	xmpp.on('online', async () => {
		await xmpp.send(xml('presence'));	// Send presence to all contacts
		// <iq type="get" id="info-request">
		//<query xmlns="http://jabber.org/protocol/disco#info" node="info-node"/>
		//</iq>
		// await xmpp.send(xml('iq', {type: 'get', id: 'info-request'}, xml('query', {xmlns: 'http://jabber.org/protocol/disco#info', node: 'san191517test3@alumchatxyz'})));
		chatPrompt();
	});
};

/**
 * Chat with a contact
 * @param contactJid 
 */
const chat = (contactJid: string) => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter your message (type "exitchat" to exit): ', async (answer) => {
		if (answer === 'exitchat') {
			rl.close();
			return chatPrompt();
		}
		console.log(`You entered: ${answer}`);
		rl.close();
		await xmpp.send(xml('message', { to: contactJid, type: 'chat' }, xml('body', {}, answer)));
		return chat(contactJid);
	});
};

const chatPrompt = () => {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	console.log(`
		1. Get all contacts
		2. Add contact
		3. Remove contact
		4. Update status
		5. Start chatting
		6. Exit
		100. Remove account
	`);

	rl.question('Enter your command: ', async (answer) => {
		console.log(`You entered: ${answer}`);
		rl.close();
		if (answer == '1') {
			await xmpp.send(xml('iq', {type: 'get'}, xml('query', {xmlns: 'jabber:iq:roster'})));
			chatPrompt();
		} else if (answer == '2') {
			const rl2 = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl2.question('Enter the contact jid: ', async (contactJid) => {
				console.log(`You entered: ${contactJid}`);
				await xmpp.send(xml('presence', { to: contactJid, type: 'subscribe' }));
				rl2.close();
				return chatPrompt();
			});
			
		} else if (answer == '3') {
			const rl2 = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl2.question('Enter the contact jid: ', async (contactJid) => {
				console.log(`You entered: ${contactJid}`);
				await xmpp.send(xml('iq', {type: 'set' }, xml('query', {xmlns: 'jabber:iq:roster'}, xml('item', {jid: contactJid, subscription: 'remove'}))));
				rl2.close();
				return chatPrompt();
			});
			
		} else if (answer == '5') {
			const rl2 = readline.createInterface({
				input: process.stdin,
				output: process.stdout,
			});
			rl2.question('Enter the contact jid: ', async (contactJid) => {
				console.log(`You entered: ${contactJid}`);
				rl2.close();
				return chat(contactJid);
			});
			
		} else if (answer == '6') {
			await xmpp.stop();
			return rl.close();
		} else if (answer == '100') {
			// Remove account
			await xmpp.send(xml('iq', { type: 'set' }, xml('query', { xmlns: 'jabber:iq:register' }, xml('remove'))));
			await xmpp.stop();
			return rl.close();
		}
		
	});
};


// ----------------- Client  -----------------
let xmpp: Client;
initializeXmppClient(TEST_USER, TEST_PASSWORD);


// ----------------- Client  -----------------
