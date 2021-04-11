import { LightningElement, wire, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { createRecord } from 'lightning/uiRecordApi';
import { reduceErrors } from 'c/ldsUtils';
import getContactRewardsEvents from '@salesforce/apex/RewardsEventController.getContactRewardsEvents';
import activateRewards from '@salesforce/apex/RewardsEventController.activateRewards';

import REWARDSEVENT_OBJECT from '@salesforce/schema/Rewards_Event__c';
import POINTS_FIELD from '@salesforce/schema/Rewards_Event__c.Points__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Rewards_Event__c.Description__c';
import EVENTCONTACT_FIELD from '@salesforce/schema/Rewards_Event__c.Contact__c';

export default class ContactRewards extends LightningElement {
    @api recordId;

    /** Wired Apex result so it can be refreshed programmatically */
    wiredRewardsEventsResult;

    // For ad-hoc rewards event creation values
    rewardsEventId;
    eventContact = this.recordId;
    points = '';
    description = '';
    reward = '';
    redemptionRecordTypeId = '0127f000000GsSLAA0';
    // Activation and navigation
    @track isActive = true;
    @track isAdhoc = false;
    @track isTable = true;
    @track isRedeem = false;
    @track pageTitle = 'JCCSF Rewards';
    result = [];
    error;

    // Columns for recent Rewards Events table
    @track columns = [
        {label: "Date",
        fieldName: "reDate",
        type: "date",
        typeAttributes:{
            year: "numeric",
            month: "long",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }},
        {label: 'Type', fieldName: 'type', type: 'text',sortable: false},
        {label: 'Description', fieldName: 'description', type: 'text',sortable: false},
        {label: 'Points', fieldName: 'points', type: 'number',sortable: false},
        {label: 'Balance', fieldName: 'pointsBalance', type: 'number',sortable: false}
    ];

    @wire(getContactRewardsEvents, {recordId: '$recordId'})
    wiredRewardsEvents ({error, data}) {
        this.wiredRewardsEventsResult = data;
        if (error) {
            this.result = undefined;
            this.error = error;
        } else if (data) {
            this.result = data;
            this.error = undefined;
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
        return refreshApex(this.wiredRewardsEventsResult);

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
        refreshApex(this.wiredRewardsEventsResult);
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
                return refreshApex(this.wiredRewardsEventsResult);
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

    @api
    refresh() {
        return refreshApex(this.wiredRewardsEventsResult); 
    }

}