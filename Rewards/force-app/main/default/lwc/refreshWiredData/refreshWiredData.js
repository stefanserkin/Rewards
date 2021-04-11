import { LightningElement, wire, track, api } from 'lwc';
import { deleteRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';

import getRewardsEvents from '@salesforce/apex/RewardsEventController.getRewardsEvents';
const COLS = [
    { label: 'Points', fieldName: 'Points__c', type: 'number' },
    { label: 'Description', fieldName: 'Description__c', type: 'text' }
  ];

export default class RefreshWiredData extends LightningElement {
    @api recordId;
    cols = COLS;
    @track selectedRecord;
    @track rewardsEventList = [];
    @track error;
    @track wiredRewardsEventList = [];

    @wire(getRewardsEvents, { recordId: '$recordId'}) reList(result) {
        this.wiredRewardsEventList = result;
    
        if (result.data) {
            this.rewardsEventList = result.data;
            this.error = undefined;
        } else if (result.error) {
            this.error = result.error;
            this.rewardsEventList = [];
        }
    }

    handleSelection(event) {
        if (event.detail.selectedRows.length > 0) {
            this.selectedRecord = event.detail.selectedRows[0].Id;
        }
    }

    deleteRecord() {
        deleteRecord(this.selectedRecord)
            .then(() => {
                refreshApex(this.wiredRewardsEventList);
            })
            .catch(error => {
            })
        }

}