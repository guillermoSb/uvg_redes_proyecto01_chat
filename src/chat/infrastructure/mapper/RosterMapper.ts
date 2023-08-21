import  Element  from 'ltx/src/Element';
import { Roster } from '../../domain/entities/Roster';
import { User } from '../../domain/entities/User';
// import { User } from '../../domain/User';

// Interface to represent the user data that will be received
interface XmppUser {
	attrs: object;
}

/**
 * Mapper to convert an XMPP response to a Roster object.
 */
export class RosterMapper { 
	/**
	 * Convert XMPP response to Roster
	 * @param response 
	 * @returns 
	 */
	public static fromXmppResponse(response: Element): Roster {
		const users = response.getChild('query')?.children;
		if (!users) return new Roster([]);
		// check if users can be converted to an array of Element[]
		const userList = users
			.filter((user) => user as XmppUser)
			.map((user) => {
				const userAsElement = user as Element;

				const jid = userAsElement.attrs.jid;
				const name = userAsElement.attrs.name;
				return new User(jid, name);
			});
		
		return new Roster(userList);	
	}
}