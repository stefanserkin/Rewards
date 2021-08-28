import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import getEligibleRewards from '@salesforce/apex/RewardsController.getEligibleRewardsForUser';
import getIneligibleRewards from '@salesforce/apex/RewardsController.getIneligibleRewardsForUser';
import getUserRewardsEvents from '@salesforce/apex/RewardsEventController.getUserRewardsEvents';

import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.FirstName';
import CONTACTID_FIELD from '@salesforce/schema/User.ContactId';
import REWARDSEVENT_OBJECT from '@salesforce/schema/Rewards_Event__c';
import POINTS_FIELD from '@salesforce/schema/Rewards_Event__c.Points__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Rewards_Event__c.Description__c';
import EVENTCONTACT_FIELD from '@salesforce/schema/Rewards_Event__c.Contact__c';
import REWARD_FIELD from '@salesforce/schema/Rewards_Event__c.Reward__c';
import STATUS_FIELD from '@salesforce/schema/Rewards_Event__c.Status__c';
import ACTIVEEVENT_FIELD from '@salesforce/schema/Rewards_Event__c.Active__c';
import RELATEDID_FIELD from '@salesforce/schema/Rewards_Event__c.Related_Entity_ID__c';
import REDEMPTION_RECORDTYPEID_FIELD from '@salesforce/schema/Rewards_Event__c.RecordTypeId';

const fields = [NAME_FIELD, CONTACTID_FIELD];

const COLS = [
    { label: 'Date', fieldName: 'Date__c', initialWidth: 210, type: 'date', typeAttributes:{
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }},
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'Type', fieldName: 'Type__c', initialWidth: 100, type: 'text' },
    { label: 'Points', fieldName: 'Points__c', initialWidth: 80, type: 'number' },
    { label: 'Balance', fieldName: 'Points_Balance__c', initialWidth: 90, type: 'number' }
];

export default class CommunityRewards extends LightningElement {

    isLoading = false;
    activeTab = '1';
    userId = USER_ID;
    cols = COLS;

    rewards;
    wiredRewardsResult;
    ineligibleRewards;
    wiredIneligibleRewardsResult;

    wiredRewardsEventList
    rewardsEventList = [];

    error;

    handleActiveTab(event) {
        const tab = event.target;
        this.activeTab = event.target.value;
    }

    // Wire user
    @wire(getRecord, { recordId: '$userId', fields })
    user;

    get userFirstName() {
        return getFieldValue(this.user.data, NAME_FIELD);
    }

    get contactId() {
        return getFieldValue(this.user.data, CONTACTID_FIELD);
    }

    // Eligible vs ineligible rewards data
    @wire(getEligibleRewards, { recordId: '$userId' })
    wiredRewards(result) {
        this.wiredRewardsResult = result;

        if (result.data) {
            this.rewards = result.data;
            this.error = null;
        } else if (result.error) {
            this.error = result.error;
            this.rewards = undefined;
        }
    }
    
    @wire(getIneligibleRewards, { recordId: '$userId' })
    wiredIneligibleRewards(result) {
        this.wiredIneligibleRewardsResult = result;

        if (result.data) {
            this.ineligibleRewards = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.ineligibleRewards = undefined;
        }
    }

    @wire(getUserRewardsEvents, { recordId: '$userId'}) 
    reList(result) {
        this.wiredRewardsEventList = result;

        if (result.data) {
            this.rewardsEventList = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewardsEventList = [];
        }
    }

    showMeYoType() {
        window.console.log(typeof this.contactId);
        window.console.log('Type for ' + this.contactId);
    }

}