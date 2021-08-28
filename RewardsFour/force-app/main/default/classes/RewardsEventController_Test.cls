@isTest
public with sharing class RewardsEventController_Test {

    @isTest
    static void getContactRewardsEvents() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;

        RewardsEventController.getContactRewardsEvents(ct.Id);
    }

    @isTest
    static void getContactInactiveRewardsEvents() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;

        RewardsEventController.getContactInactiveRewardsEvents(ct.Id);
    }

    @isTest
    static void getRewardsEvents() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;

        RewardsEventController.getRewardsEvents(ct.Id);
    }
}