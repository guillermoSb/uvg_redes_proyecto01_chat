import { client, xml } from '@xmpp/client';

import debug from '@xmpp/debug';

const SERVER_URL = 'alumchat.xyz';
const TEST_USER = 'san191517test2';
const TEST_PASSWORD = '12345678';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const xmpp = client({
	service: `xmpp://${SERVER_URL}`,
	domain: `${SERVER_URL}`,
	username: TEST_USER,
	password: TEST_PASSWORD,
});

debug(xmpp, true);


xmpp.on('error', (err) => {
	console.error(err);
});

xmpp.on('offline', () => {
	console.log('offline');
});


xmpp.on('online', async (address) => {
	await xmpp.send(xml('presence'));
});

xmpp.start().catch(console.error);
