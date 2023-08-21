import { VCard } from "../../domain/entities/VCard";
import  Element  from 'ltx/src/Element';

/**
 * Mapper to process VCards
 */
export class VCardMapper {

	/**
	 * Convert XMPP response to VCard
	 * @param response 
	 * @returns 
	 */
	public static fromXmppResponse(response: Element): VCard {
		let name = '';
		let nickname = '';
		let jid = '';

		if (response.getChild('JABBERID')) {
			jid = response.getChildText('JABBERID') ?? '';
		}
		if (response.getChild('N')) {
			name = response.getChild('N')?.getChildText('GIVEN') ?? '';
		}
		if (response.getChild('NICKNAME')) {
			nickname = response.getChildText('NICKNAME') ?? '';
		}
	
		return new VCard(name, nickname, jid);
	}
}