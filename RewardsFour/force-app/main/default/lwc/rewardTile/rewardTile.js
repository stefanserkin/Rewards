import { LightningElement, api } from 'lwc';

export default class RewardTile extends LightningElement {
    @api reward;

    handleRewardSelected() {
        const selectedEvent = new CustomEvent('selected', {
            detail: this.reward.Id
        });
        this.dispatchEvent(selectedEvent);
    }
    get backgroundImageStyle() {
        return `background-image:url(${this.reward.Image__c})`;
    }
}