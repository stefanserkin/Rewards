public with sharing class RewardsController {

    @AuraEnabled(cacheable = true)
    public static List<Reward__c> getRewards(){
        return [SELECT Id, Name, Cost__c, Image_URL__c, Relative_URL__c 
                  FROM Reward__c 
                 WHERE Active__c = true
                  WITH SECURITY_ENFORCED
                 ORDER BY Cost__c ASC
                 LIMIT 40];
    }

    @AuraEnabled(cacheable = true)
    public static List<Reward__c> getEligibleRewards(Id recordId){

        Contact ct = [SELECT Id, Rewards_Points__c FROM Contact WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];

        return [SELECT Id, Name, Cost__c, Image_URL__c, Relative_URL__c 
                  FROM Reward__c 
                 WHERE Active__c = true
                   AND Cost__c <= :ct.Rewards_Points__c
                  WITH SECURITY_ENFORCED 
                 ORDER BY Cost__c ASC
                 LIMIT 40];

    }

    @AuraEnabled(cacheable = true)
    public static List<Reward__c> getIneligibleRewards(Id recordId){
        
        Contact ct = [SELECT Id, Rewards_Points__c FROM Contact WHERE Id = :recordId WITH SECURITY_ENFORCED LIMIT 1];

        return [SELECT Id, Name, Cost__c, Image_URL__c, Relative_URL__c 
                  FROM Reward__c 
                 WHERE Active__c = true
                   AND Cost__c > :ct.Rewards_Points__c
                  WITH SECURITY_ENFORCED 
                 ORDER BY Cost__c ASC
                 LIMIT 40];
    }

}