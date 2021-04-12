/* *
* Created by Stefan Serkin on March 27, 2021
* */
import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { createRecord } from 'lightning/uiRecordApi';
import { deleteRecord } from 'lightning/uiRecordApi';
import { reduceErrors } from 'c/ldsUtils';
import REWARDS_ICON from '@salesforce/resourceUrl/rewardsIcon';
import activateRewards from '@salesforce/apex/RewardsEventController.activateRewards';

import REWARDSEVENT_OBJECT from '@salesforce/schema/Rewards_Event__c';
import POINTS_FIELD from '@salesforce/schema/Rewards_Event__c.Points__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Rewards_Event__c.Description__c';
import EVENTCONTACT_FIELD from '@salesforce/schema/Rewards_Event__c.Contact__c';

import getContactRewardsEvents from '@salesforce/apex/RewardsEventController.getContactRewardsEvents';
const COLS = [
    { label: 'Date', fieldName: 'Date__c', type: 'date', typeAttributes:{
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }},
    { label: 'Description', fieldName: 'Description__c', type: 'text'},
    { label: 'Type', fieldName: 'Type__c', type: 'text'},
    { label: 'Points', fieldName: 'Points__c', type: 'number' },
    { label: 'Balance', fieldName: 'Points_Balance__c', type: 'number' }
];

export default class ContactRewards extends LightningElement {
    @api recordId;

    cols = COLS;
    @track selectedRecord;
    @track rewardsEventList = [];
    @track error;
    @track wiredRewardsEventList = [];

    // For ad-hoc rewards event creation values
    rewardsEventId;
    eventContact = this.recordId;
    points = '';
    description = '';

    // Activation and navigation
    @track isActive = true;
    @track isTable = true;
    @track isAdhoc = false;
    @track isRedeem = false;
    @track pageTitle = 'JCCSF Rewards';
    rewardsIcon = REWARDS_ICON;

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
        alert('Woohoo! Rewards Account has been activated. Here\'s 250 points just for being you.');
        this.isActive = true;
        this.isTable = true;
        activateRewards({recordId: '$recordId'})
            .then(result => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Rewards Account was successfully activated',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                // TODO Error handling
            });
    }

    handleDeactivate(){
        alert('Are you sure you would like to deactivate this Rewards Account? All remaining points will be forfeited.');
        this.isActive = false;
        this.isTable = false;
        this.isAdhoc = false;
    }

    handleTable(){
        this.isTable = true;
        this.isAdhoc = false;
        this.isRedeem = false;
        refreshApex(this.wiredRewardsEventList);

    }
    
    handleRedeem(){
        alert('Hey, what\'s the big idea?! You know this doesn\'t work yet.');
        this.isRedeem = true;
        this.isAdhoc = false;
        this.isTable = false;
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
            })
            .catch(error => {
            })
        }

}