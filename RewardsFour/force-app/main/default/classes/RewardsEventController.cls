public with sharing class RewardsEventController {

    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getContactRewardsEvents(Id recordId) {
        return [SELECT Id, Type__c, Date__c, Description__c, Points__c, Points_Balance__c
                  FROM Rewards_Event__c
                 WHERE Contact__c = :recordId
                   AND Active__c = true
                  WITH SECURITY_ENFORCED 
                 ORDER BY Date__c DESC
                 LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getContactInactiveRewardsEvents(Id recordId) {
        return [SELECT Id, Type__c, Date__c, Description__c, Points__c, Points_Balance__c
                  FROM Rewards_Event__c
                 WHERE Contact__c = :recordId
                   AND Active__c = false
                  WITH SECURITY_ENFORCED 
                 ORDER BY Date__c DESC
                 LIMIT 15];
    }

    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getUserRewardsEvents(Id recordId) {
        return [SELECT Id, Type__c, Date__c, Description__c, Points__c, Points_Balance__c
                  FROM Rewards_Event__c
                 WHERE Contact__c IN (SELECT ContactId FROM User WHERE Id = :recordId)
                   AND Active__c = true
                  //WITH SECURITY_ENFORCED 
                 ORDER BY Date__c DESC
                 LIMIT 15];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Rewards_Event__c> getRewardsEvents(Id recordId) {
        return [SELECT Id, Points__c, Description__c
                  FROM Rewards_Event__c
                 WHERE Contact__c = :recordId
                  WITH SECURITY_ENFORCED 
                 ORDER BY CreatedDate DESC
                 LIMIT 5];
    }
    
}