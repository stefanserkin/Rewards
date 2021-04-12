/* *
 * Created by Stefan Serkin on March 26, 2021
 * */

@isTest
public class RewardsEventHandler_Test {
    
    @isTest static void awardPoints() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;
        
        Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 4444, RecordTypeId = awardRecTypeId);
        insert re;
    }
    
    @isTest static void redeemPoints() {
        String accHHRecTypeId      = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String redemptionRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Redemption').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;
        
        Reward__c reward = new Reward__c(Name = 'Test Reward', Cost__c = 444);
        insert reward;
        
        Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 444, Reward__c = reward.Id, RecordTypeId = redemptionRecTypeId);
        insert re;
    }

    @isTest static void deletePoints() {
        String accHHRecTypeId      = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId      = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        String redemptionRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Redemption').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;
        
        Reward__c reward = new Reward__c(Name = 'Test Reward', Cost__c = 444);
        insert reward;
        
        List<Rewards_Event__c> reList = new List<Rewards_Event__c>();
        for (Integer i=0; i<201; i++) {
            Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 50, RecordTypeId = awardRecTypeId);
            reList.add(re);
        }
        
        Rewards_Event__c reRedemption = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 444, Reward__c = reward.Id, RecordTypeId = redemptionRecTypeId);
        reList.add(reRedemption);
        
        insert reList;

        Rewards_Event__c reToDelete = [SELECT Id FROM Rewards_Event__c WHERE Contact__c = :ct.Id LIMIT 1];
        delete reToDelete;
    }

    @isTest static void inactiveAccountInsert() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = false);
        insert ct;
        
        Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 4444, RecordTypeId = awardRecTypeId);
        
        try {
            insert re;
        } catch (Exception e) {
            Boolean expectedExceptionThrown =  e.getMessage().contains('active rewards account') ? true : false;
            System.AssertEquals(expectedExceptionThrown, true);
        }
    }
    
    @isTest static void updateReNegativeTest() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;
        
        Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 4444, RecordTypeId = awardRecTypeId);
        insert re;
        
        re.Description__c = 'Test Description Update';
        update re;
    }
    
    @isTest static void bulkReInsertTest() {
        String accHHRecTypeId = Schema.SObjectType.Account.getRecordTypeInfosByName().get('Household Account').getRecordTypeId();
        String awardRecTypeId = Schema.SObjectType.Rewards_Event__c.getRecordTypeInfosByName().get('Award').getRecordTypeId();
        
        Account acc = new Account(Name = 'TestAcc Household', RecordTypeId = accHHRecTypeId);
        insert acc;
        
        Contact ct = new Contact(AccountId = acc.Id, FirstName = 'Test', LastName = 'TestAcc', Active_Rewards_Account__c = true);
        insert ct;
        
        List<Rewards_Event__c> reList = new List<Rewards_Event__c>();
        for (Integer i=0; i<201; i++) {
            Rewards_Event__c re = new Rewards_Event__c(Contact__c = ct.Id, Description__c = 'Test Points Awarded', Points__c = 50, RecordTypeId = awardRecTypeId);
        }
        insert reList;
    }

}