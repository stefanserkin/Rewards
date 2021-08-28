import { LightningElement, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
// import getContact from '@salesforce/apex/CommunityRewardsController.getContact';
import USER_ID from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.FirstName';
import CONTACTID_FIELD from '@salesforce/schema/User.ContactId';

const fields = [NAME_FIELD, CONTACTID_FIELD];

export default class CommunityRewards extends LightningElement {

    isLoading = false;
    activeTab = '1';
    userId = USER_ID;
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

    showMeYoType() {
        window.console.log(typeof this.contactId);
    }

}