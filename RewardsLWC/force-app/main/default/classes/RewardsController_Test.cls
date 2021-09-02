@isTest
public with sharing class RewardsController_Test {
    
    @isTest static void getRewards() {
        RewardsController.getRewards();
    }

    @isTest static void getEligibleRewards() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true, Rewards_Points__c = 500);
        insert ct;

        RewardsController.getEligibleRewards(ct.Id);
    }

    @isTest static void getIneligibleRewards() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true, Rewards_Points__c = 500);
        insert ct;

        RewardsController.getIneligibleRewards(ct.Id);
    }
}