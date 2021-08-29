public with sharing class CommunityRewardsController {

    @AuraEnabled(cacheable = true)
    public static Contact getContact(String userId) {
        System.debug('entered getContact with user id :: ' + userId);
        Contact ct = [SELECT Id, Rewards_Points__c FROM Contact WHERE Id IN (SELECT ContactId FROM User WHERE Id = :userId) WITH SECURITY_ENFORCED LIMIT 1];
        System.debug('return contact :: ' + ct);
        return ct;
    }

}