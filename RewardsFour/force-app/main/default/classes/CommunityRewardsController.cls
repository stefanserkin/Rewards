public with sharing class CommunityRewardsController {

    @AuraEnabled(cacheable = true)
    public static String getContact(String userId) {
        User u = [SELECT Id, ContactId FROM User WHERE Id = :userId LIMIT 1];
        if (u.ContactId == null) {
            return null;
        }
        String contactId = u.ContactId;
        return contactId;
    }

}