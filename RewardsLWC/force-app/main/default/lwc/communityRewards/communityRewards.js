import { LightningElement, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';
import { createRecord } from 'lightning/uiRecordApi';
import { updateRecord } from 'lightning/uiRecordApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
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
    { label: 'Date', fieldName: 'Date__c', initialWidth: 215, type: 'date', typeAttributes:{
        year: "numeric",
        month: "long",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }},
    { label: 'Description', fieldName: 'Description__c', type: 'text', cellAttributes:{
        class:{fieldName:'typeColor'}
    }},
    { label: 'Type', fieldName: 'Type__c', initialWidth: 110, type: 'text', cellAttributes:{
        class:{fieldName:'typeColor'}
    }},
    { label: 'Points', fieldName: 'Points__c', initialWidth: 110, type: 'number', cellAttributes:{
        class:{fieldName:'typeColor'}
    }},
    { label: 'Balance', fieldName: 'Points_Balance__c', initialWidth: 110, type: 'number' }
];

export default class CommunityRewards extends LightningElement {
    // Public properties
    @api rewardsTitle;
    @api includeLinkToMoreInfo;
    @api moreInfoURL;
    @api moreInfoURLText;

    // Display control
    initialLoad = false;
    isLoading = true;
    activeTab = '1';
    // Modal
    isModalRedeem = false;
    isModalOpen = false;
    modalHeader;
    modalBody;
    
    // User Id
    userId = USER_ID;
    // Contact fields from wire service
    name;
    contactId;
    isActive;
    contact;
    ctPoints;

    error;

    handleActiveTab(event) {
        const tab = event.target;
        this.activeTab = tab.value;
    }

    // Set labels
    get title() {
        return `${this.name}'s ${this.rewardsTitle}`;
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
        if (error) {
            this.error = error ; 
        } else if (data) {
            this.isActive = data.fields.Active_Rewards_Account__c.value;
            this.ctPoints = data.fields.Rewards_Points__c.value;
            this.isLoading = false;
        }
    }

    // Rewards Event formatted columns
    cols = COLS;
    // Rewards Events data from wire service
    wiredRewardsEventList;
    rewardsEventList = [];
    rewardsEventsPerPage = [];
    // Navigation
    page = 1;
    pageSize = 10;
    startingRecord = 1;
    endingRecord = 0;
    totalRecordCount = 0;
    totalPages = 0;
    // Query arguments

    @wire(getContactRewardsEvents, { recordId: '$contactId' }) 
    reList(result) {
        this.wiredRewardsEventList = result;
        if (result.data) {
            this.rewardsEventList = result.data.map(item=>{
                let typeColor = item.Type__c === 'Redemption' ? "slds-text-color_success" : "slds-text-color_default"
                return {...item,
                    "typeColor":typeColor
                }
            })
            this.totalRecordCount = result.data.length;
            this.totalPages = Math.ceil(this.totalRecordCount / this.pageSize);
            this.rewardsEventsPerPage = this.rewardsEventList.slice(0, this.pageSize);
            this.endingRecord = this.pageSize;

            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewardsEventList = [];
        }
    }

    generateData(){
        getFacilityVisits({ recordId: this.recordId, minDate: this.minDate, maxDate: this.maxDate })
        .then(result => {
            this.facilityVisitList = result;
            this.generatePdf();
        });
    }

    // Pagination methods
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1;
            this.displayRecordsPerPage(this.page);
        }
    }

    nextHandler() {
        if((this.page < this.totalPages) && this.page !== this.totalPages){
            this.page = this.page + 1;
            this.displayRecordsPerPage(this.page);            
        }
    }

    displayRecordsPerPage(page){
        this.startingRecord = ((page -1) * this.pageSize) ;
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount) ? this.totalRecountCount : this.endingRecord; 

        this.rewardsEventsPerPage = this.rewardsEventList.slice(this.startingRecord, this.endingRecord);

        this.startingRecord = this.startingRecord + 1;
    } 

    // Rewards
    rewards;
    wiredRewardsResult;
    ineligibleRewards;
    wiredIneligibleRewardsResult;

    get hasIneligibleRewards() {
        return this.ineligibleRewards.length > 0 ? true : false;
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

    // Selected Reward
    selectedReward;
    points;
    description;
    rewardsEventStatus = 'Pending';

    @wire(getObjectInfo, { objectApiName: REWARDSEVENT_OBJECT })
    rewardsEventObjectInfo;

    get redemptionRecordTypeId() {
        const rtis = this.rewardsEventObjectInfo.data.recordTypeInfos;
        return Object.keys(rtis).find(rti => rtis[rti].name === 'Redemption');
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
                        title: 'Welcome to Rewards!',
                        message: this.contactActivationMessage,
                        variant: 'success'
                    })
                );
                // Display fresh data
                refreshApex(this.wiredRewardsEventList);
                refreshApex(this.wiredRewardsResult);
                refreshApex(this.wiredIneligibleRewardsResult);

                this.isLoading = false;
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