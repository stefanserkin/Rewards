/* *
* Created by Stefan Serkin on March 27, 2021
* */
import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import { reduceErrors } from 'c/ldsUtils';
import REWARDS_ICON from '@salesforce/resourceUrl/rewardsIcon';
// import activateRewards from '@salesforce/apex/RewardsEventController.activateRewards';

import REWARDSEVENT_OBJECT from '@salesforce/schema/Rewards_Event__c';
import POINTS_FIELD from '@salesforce/schema/Rewards_Event__c.Points__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Rewards_Event__c.Description__c';
import EVENTCONTACT_FIELD from '@salesforce/schema/Rewards_Event__c.Contact__c';
import REWARD_FIELD from '@salesforce/schema/Rewards_Event__c.Reward__c';
import STATUS_FIELD from '@salesforce/schema/Rewards_Event__c.Status__c';
import RELATEDID_FIELD from '@salesforce/schema/Rewards_Event__c.Related_Entity_Id__c';
import REDEMPTION_RECORDTYPEID_FIELD from '@salesforce/schema/Rewards_Event__c.RecordTypeId';
import ID_FIELD from '@salesforce/schema/Contact.Id';
import ACTIVEREWARDS_FIELD from '@salesforce/schema/Contact.Active_Rewards_Account__c';
import CTPOINTS_FIELD from '@salesforce/schema/Contact.Rewards_Points__c';
import CTNAME_FIELD from '@salesforce/schema/Contact.FirstName';

//import getRewards from '@salesforce/apex/RewardsController.getRewards';
import getEligibleRewards from '@salesforce/apex/RewardsController.getEligibleRewards';
import getIneligibleRewards from '@salesforce/apex/RewardsController.getIneligibleRewards';
import getContactRewardsEvents from '@salesforce/apex/RewardsEventController.getContactRewardsEvents';
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

export default class ContactRewards extends LightningElement {
    @api recordId;
    rewardsIcon = REWARDS_ICON;
    cols = COLS;
    // Defaults and navigation
    @track isActive = false;
    @track isTable = true;
    @track isAdhoc = false;
    @track isRedeem = false;
    // For modal
    @track modalHeader = '';
    @track modalBody = '';
    @track pageTitle = 'JCCSF Rewards';
    @track isModalOpen = false;
    @track isModalActivate = false;
    @track isModalDeactivate = false;
    @track isModalRedeem = false;
    @track selectedRecord;
    @track selectedReward;
    @track rewardsEventList = [];
    @track error;
    @track wiredRewardsEventList = [];
    @track ctPoints = '';
    @track ctName = '';
    // For ad-hoc rewards event creation values
    @track rewardsEventId;
    @track points = '';
    @track description = '';
    rewardsEventStatus = 'Pending';
    redemptionRecordTypeId = '0127f000000GsSLAA0';

    rewards;
    wiredRewardsResult;
    ineligibleRewards;
    wiredIneligibleRewardsResult;
/*
    @wire(getRewards)
    wiredRewards(result) {
        this.wiredRewardsResult = result;
        if (result.data) {
            this.rewards = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewards = undefined;
        }
    }
*/

    @wire(getEligibleRewards, { recordId: '$recordId'})
    wiredRewards(result) {
        this.wiredRewardsResult = result;

        if (result.data) {
            this.rewards = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewards = undefined;
        }
    }

    @wire(getIneligibleRewards, { recordId: '$recordId'})
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

    // Wire contact
    @wire(getRecord, {
        recordId: '$recordId',
        fields: [ACTIVEREWARDS_FIELD,
                 CTNAME_FIELD,
                 CTPOINTS_FIELD]
    }) wireContact({
        error,
        data
    }) {
        if (error) {
            this.error = error ; 
        } else if (data) {
            this.isActive = data.fields.Active_Rewards_Account__c.value;
            this.ctName = data.fields.FirstName.value;
            this.ctPoints = data.fields.Rewards_Points__c.value;
        }
    }
    get contactAndPointsLabel() {
        return `${this.ctName}'s Rewards Points: ${this.ctPoints}`;
    }

    @wire(getContactRewardsEvents, { recordId: '$recordId'}) reList(result) {
        this.wiredRewardsEventList = result;
    
        if (result.data) {
            this.rewardsEventList = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewardsEventList = [];
        }
    }

    // Handle buttons onclick
    handleActivate(){
        this.modalHeader = 'Rewards Account Activated!';
        this.modalBody = 'This contact will now begin earning points for eligible events.';
        this.isModalActivate = true;
        this.isModalRedeem = false;
        this.isModalDeactivate = false;
        this.isModalOpen = true;

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[ACTIVEREWARDS_FIELD.fieldApiName] = true;

        const recordInput = { fields };
        updateRecord(recordInput)
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Contact updated',
                                variant: 'success'
                            })
                        );
                        // Display fresh data in the form
                        return refreshApex(this.contact);
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error creating record',
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                    });
    }

    closeActivateModal() {
        this.isActive = true;
        this.isTable = true;
        this.isAdhoc = false;
        this.isRedeem = false;
        this.isModalOpen = false;
        refreshApex(this.wiredRewardsEventList);
        refreshApex(this.wiredRewardsResult);
        refreshApex(this.wiredIneligibleRewardsResult);
    }

    handleDeactivate(){
        this.modalHeader = 'Rewards Account Deactivation';
        this.modalBody = 'Are you sure you would like to deactivate this Rewards Account? All remaining points will be forfeited.';
        this.isModalActivate = false;
        this.isModalRedeem = false;
        this.isModalDeactivate = true;
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    closeDeactivateModal() {
        this.isActive = false;
        this.isTable = false;
        this.isAdhoc = false;
        this.isRedeem = false;

        const fields = {};
        fields[ID_FIELD.fieldApiName] = this.recordId;
        fields[ACTIVEREWARDS_FIELD.fieldApiName] = false;
        fields[CTPOINTS_FIELD.fieldApiName] = 0;

        const recordInput = { fields };
        updateRecord(recordInput)
                    .then(() => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Success',
                                message: 'Contact updated',
                                variant: 'success'
                            })
                        );
                        return refreshApex(this.contact);
                    })
                    .catch(error => {
                        this.dispatchEvent(
                            new ShowToastEvent({
                                title: 'Error creating record',
                                message: error.body.message,
                                variant: 'error'
                            })
                        );
                    });
        refreshApex(this.wiredRewardsEventList);
        refreshApex(this.wiredRewardsResult);
        refreshApex(this.wiredIneligibleRewardsResult);
        this.isModalOpen = false;
    }

    handleTable(){
        this.isTable = true;
        this.isAdhoc = false;
        this.isRedeem = false;
        refreshApex(this.wiredRewardsEventList);
    }
    
    handleRedeem(){
        this.isRedeem = true;
        this.isAdhoc = false;
        this.isTable = false;
        refreshApex(this.wiredRewardsResult);
        refreshApex(this.wiredIneligibleRewardsResult);
    }

    handleAdhoc(){
        this.isAdhoc = true;
        this.isTable = false;
        this.isRedeem = false;
    }

    handleRefresh(){
        refreshApex(this.wiredRewardsEventList);
        this.isTable = true;
        this.isAdhoc = false;
        this.isRedeem = false;
    }

    // Handle input for ad-hoc rewards event creation
    handlePointsChange(event) {
        this.rewardsEventId = undefined;
        this.points = event.target.value;
    }

    handleDescriptionChange(event) {
        this.rewardsEventId = undefined;
        this.description = event.target.value;
    }

    createPoints() {
        this.isAdhoc = false;
        this.isTable = true;
        const fields = {};
        fields[DESCRIPTION_FIELD.fieldApiName] = this.description;
        fields[POINTS_FIELD.fieldApiName] = this.points;
        fields[EVENTCONTACT_FIELD.fieldApiName] = this.recordId;
        const recordInput = { apiName: REWARDSEVENT_OBJECT.objectApiName, fields };
        createRecord(recordInput)
            .then((rewardsEvent) => {
                this.rewardsEventId = rewardsEvent.id;
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Rewards Event created: {rewardsEventId}',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredRewardsEventList);
                refreshApex(this.wiredRewardsResult);
                refreshApex(this.wiredIneligibleRewardsResult);
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: reduceErrors(error).join(', '),
                        variant: 'error'
                    })
                );
            });
    }

    // Handle redemption
    handlePointsChange(event) {
        this.rewardsEventId = undefined;
        this.points = event.target.value;
    }

    handleDescriptionChange(event) {
        this.rewardsEventId = undefined;
        this.description = event.target.value;
    }

    handleRewardChange(event) {
        this.rewardsEventId = undefined;
        this.reward = event.target.value;
    }

    handleRewardSelection(event) {
        this.modalHeader = 'Redeem Reward';
        this.modalBody = 'Are you sure you would like to redeem this reward?';
        this.isModalActivate = false;
        this.isModalRedeem = true;
        this.isModalDeactivate = false;
        this.isModalOpen = true;

        this.selectedReward = event.target.dataset.recordid;
        this.points = event.target.dataset.points;
        this.description = event.target.dataset.description;
    }

    handleIneligibleRewardSelection() {
        alert('Looks like some more points are needed before this reward can be redeemed.');
    }

    closeRedeemModal() {
        this.isTable = true;
        this.isAdhoc = false;
        this.isRedeem = false;
        this.redeemReward();
        refreshApex(this.wiredRewardsEventList);
        this.isModalOpen = false;
    }

    redeemReward() { 
        this.isRedeem = false;
        this.isTable = true;
        const fields = {};
        fields[DESCRIPTION_FIELD.fieldApiName] = this.description;
        fields[POINTS_FIELD.fieldApiName] = this.points;
        fields[REWARD_FIELD.fieldApiName] = this.selectedReward;
        fields[STATUS_FIELD.fieldApiName] = this.rewardsEventStatus;
        fields[EVENTCONTACT_FIELD.fieldApiName] = this.recordId;
        fields[RELATEDID_FIELD.fieldApiName] = this.recordId;
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
                refreshApex(this.wiredRewardsResult);
                refreshApex(this.wiredIneligibleRewardsResult);
            })
            .catch((error) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error creating record',
                        message: reduceErrors(error).join(', '),
                        variant: 'error'
                    })
                );
            });
    }

    // Handle deletion
    handleSelection(event) {
        if (event.detail.selectedRows.length > 0) {
            this.selectedRecord = event.detail.selectedRows[0].Id;
        }
    }

    deleteRecord() {
        deleteRecord(this.selectedRecord)
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Rewards Event deleted',
                        variant: 'success'
                    })
                );
                refreshApex(this.wiredRewardsEventList);
                refreshApex(this.wiredRewardsResult);
                refreshApex(this.wiredIneligibleRewardsResult);
            })
            .catch(error => {
            })
        }

}