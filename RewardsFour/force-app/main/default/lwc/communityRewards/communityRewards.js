import { LightningElement, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import getEligibleRewards from '@salesforce/apex/RewardsController.getEligibleRewards';
import getIneligibleRewards from '@salesforce/apex/RewardsController.getIneligibleRewards';
import getContactRewardsEvents from '@salesforce/apex/RewardsEventController.getContactRewardsEvents';

import USER_ID from '@salesforce/user/Id';
// User
import NAME_FIELD from '@salesforce/schema/User.FirstName';
import CONTACTID_FIELD from '@salesforce/schema/User.ContactId';
// Contact
import ID_FIELD from '@salesforce/schema/Contact.Id';
import ACTIVEREWARDS_FIELD from '@salesforce/schema/Contact.Active_Rewards_Account__c';
import CTPOINTS_FIELD from '@salesforce/schema/Contact.Rewards_Points__c';
// Rewards Event
import REWARDSEVENT_OBJECT from '@salesforce/schema/Rewards_Event__c';
import POINTS_FIELD from '@salesforce/schema/Rewards_Event__c.Points__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Rewards_Event__c.Description__c';
import EVENTCONTACT_FIELD from '@salesforce/schema/Rewards_Event__c.Contact__c';
import REWARD_FIELD from '@salesforce/schema/Rewards_Event__c.Reward__c';
import STATUS_FIELD from '@salesforce/schema/Rewards_Event__c.Status__c';
import ACTIVEEVENT_FIELD from '@salesforce/schema/Rewards_Event__c.Active__c';
import RELATEDID_FIELD from '@salesforce/schema/Rewards_Event__c.Related_Entity_ID__c';
import REDEMPTION_RECORDTYPEID_FIELD from '@salesforce/schema/Rewards_Event__c.RecordTypeId';

const COLS = [
    { label: 'Date', fieldName: 'Date__c', initialWidth: 210, type: 'date', typeAttributes:{
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }},
    { label: 'Description', fieldName: 'Description__c', type: 'text' },
    { label: 'Type', fieldName: 'Type__c', initialWidth: 110, type: 'text' },
    { label: 'Points', fieldName: 'Points__c', initialWidth: 110, type: 'number' },
    { label: 'Balance', fieldName: 'Points_Balance__c', initialWidth: 110, type: 'number' }
];

export default class CommunityRewards extends LightningElement {
    // Display control
    isLoading = false;
    activeTab = '1';
    isModalRedeem = false;
    isModalOpen = false;
    // User Id
    userId = USER_ID;
    // Contact fields from wire service
    name;
    contactId;
    isActive;
    contact;
    ctPoints;
    // Rewards data from wire service
    rewards;
    wiredRewardsResult;
    ineligibleRewards;
    wiredIneligibleRewardsResult;
    // Rewards Event formatted columns
    cols = COLS;
    // Rewards Events data from wire service
    wiredRewardsEventList;
    rewardsEventList = [];
    // Selected Reward
    selectedReward;
    points;
    description;
    rewardsEventStatus = 'Pending';
    redemptionRecordTypeId = '0124w000001lDRPAA2';
    // Modal
    modalHeader;
    modalBody;

    error;

    handleActiveTab(event) {
        const tab = event.target;
        this.activeTab = tab.value;
    }

    // Set labels
    get title() {
        return `${this.name}'s JCCSF Rewards`;
    }
    get pointsTotal() {
        return `Total Points: ${this.ctPoints}`;
    }
    get pointsHistoryTabTitle() {
        return `${this.name}'s Rewards Points History`;
    }
    get redeemRewardsTabTitle() {
        return `Reedem Points for Rewards`;
    }
    get contactActivationMessage() {
        return `Welcome to JCCSF Rewards, ${this.name}! Enjoy your first 250 points on us.`
    }

    // Wire user
    @wire(getRecord, {
        recordId: USER_ID,
        fields: [NAME_FIELD, CONTACTID_FIELD]
    }) wireuser({
        error,
        data
    }) {
        if (error) {
           this.error = error ; 
        } else if (data) {
            this.name = data.fields.FirstName.value;
            this.contactId = data.fields.ContactId.value;
        }
    }

    // Wire contact
    @wire(getRecord, {
        recordId: '$contactId',
        fields: [ACTIVEREWARDS_FIELD, CTPOINTS_FIELD]
    }) wireContact({
        error,
        data
    }) {
        window.console.log('contactId is :: ' + this.contactId);
        if (error) {
            this.error = error ; 
        } else if (data) {
            this.isActive = data.fields.Active_Rewards_Account__c.value;
            this.ctPoints = data.fields.Rewards_Points__c.value;
        }
    }

    // Eligible vs ineligible rewards data
    @wire(getEligibleRewards, { recordId: '$contactId' })
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
    
    @wire(getIneligibleRewards, { recordId: '$contactId' })
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
    
    @wire(getContactRewardsEvents, { recordId: '$contactId'}) 
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

    handleRewardSelection(event) {
        this.selectedReward = event.target.dataset.recordid;
        this.points = event.target.dataset.points;
        this.description = event.target.dataset.description;

        this.modalHeader = 'Redeem Reward';
        this.modalBody = `Are you sure you would like to redeem ${this.description} for ${this.points} points?`;
        this.isModalRedeem = true;
        this.isModalOpen = true;
    }

    handleIneligibleRewardSelection() {
        alert('More points are needed to unlock this reward.');
    }

    closeModal() {
        this.isModalOpen = false;
    }

    closeRedeemModal() {
        this.redeemReward();
        refreshApex(this.wiredRewardsEventList);
        this.isModalOpen = false;
    }

    showMeYoType() {
        window.console.log(typeof this.contactId);
        window.console.log('Type for ' + this.contactId);
    }

    redeemReward() { 
        this.isLoading = true;
        const fields = {};
        fields[DESCRIPTION_FIELD.fieldApiName] = this.description;
        fields[POINTS_FIELD.fieldApiName] = this.points;
        fields[REWARD_FIELD.fieldApiName] = this.selectedReward;
        fields[STATUS_FIELD.fieldApiName] = this.rewardsEventStatus;
        fields[ACTIVEEVENT_FIELD.fieldApiName] = true;
        fields[EVENTCONTACT_FIELD.fieldApiName] = this.contactId;
        fields[RELATEDID_FIELD.fieldApiName] = this.contactId;
        fields[REDEMPTION_RECORDTYPEID_FIELD.fieldApiName] = this.redemptionRecordTypeId;
        const recordInput = { apiName: REWARDSEVENT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then((rewardsEvent) => {
                this.rewardsEventId = rewardsEvent.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Reward Redeemed',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredRewardsEventList);
                refreshApex(this.wiredInactiveRewardsEventList);
                refreshApex(this.wiredRewardsResult);
                refreshApex(this.wiredIneligibleRewardsResult);
                this.isLoading = false;
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: reduceErrors(error).join(', '),
                        variant: 'error'
                    })
                );
                this.isLoading = false;
            });
    }

    handleActivate(){
        this.isActive = true;
        this.isModalOpen = false;

        this.isLoading = true;

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.contactId;
        fields[ACTIVEREWARDS_FIELD.fieldApiName] = true;

        const recordInput = { fields };
        updateRecord(recordInput)
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Rewards Account Activated!',
                                message: 'Welcome to Rewards!',
                                variant: 'success'
                            })
                        );
                        this.isLoading = false;
                        // Display fresh data
                        refreshApex(this.wiredRewardsEventList);
                        refreshApex(this.wiredRewardsResult);
                        refreshApex(this.wiredIneligibleRewardsResult);
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error creating record',
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                        this.isLoading = false;
                    });

    }

}