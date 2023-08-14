import { CLIChat } from './chat/presentation/CLIChat';
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';	// Accept self-signed certificates
const cliChat = new CghoLIChat();
cliChat.login();

